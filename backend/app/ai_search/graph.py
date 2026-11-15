import json
from decimal import Decimal
from typing import Any, Literal, TypedDict

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from app.ai_search.llm import LLMAdapter, LLMError, LLMOutputError, LLMProviderError
from app.ai_search.schemas import (
    AISearchRequest,
    AISearchResponse,
    ConversationContext,
    FilterExtraction,
    IntentClassification,
    SearchDomain,
)
from app.schemas import CarFilters, NotebookFilters
from app.services.car_search import search_cars
from app.services.notebook_search import search_notebooks


FilterModel = type[NotebookFilters] | type[CarFilters]


class AISearchState(TypedDict, total=False):
    request: AISearchRequest
    db: Session
    llm: LLMAdapter
    intent: IntentClassification
    domain: SearchDomain | None
    extraction: FilterExtraction
    filter_model: NotebookFilters | CarFilters
    applied_filters: dict[str, Any]
    clarification_required: bool
    clarification_question: str | None
    search_result: dict[str, Any]
    response: AISearchResponse


class AIRequestFilterError(ValueError):
    def __init__(self, field: str, reason: str):
        super().__init__(reason)
        self.field = field
        self.reason = reason


def _filter_model(domain: SearchDomain) -> FilterModel:
    return NotebookFilters if domain == "notebooks" else CarFilters


def validate_context(context: ConversationContext | None, requested_domain: SearchDomain | None) -> None:
    if context is None:
        return
    if requested_domain is not None and requested_domain != context.domain:
        raise AIRequestFilterError("conversation_context.domain", "must match domain")
    model = _filter_model(context.domain)
    unknown = set(context.filters) - set(model.model_fields)
    if unknown:
        field = sorted(unknown)[0]
        raise AIRequestFilterError(f"conversation_context.filters.{field}", "unsupported filter field")
    for field, value in context.filters.items():
        if isinstance(value, str) and len(value) > 200:
            raise AIRequestFilterError(f"conversation_context.filters.{field}", "text filters may not exceed 200 characters")
    try:
        model.model_validate(context.filters)
    except ValidationError as exc:
        first = exc.errors()[0] if exc.errors() else {}
        field = ".".join(str(part) for part in first.get("loc", ())) or "conversation_context.filters"
        raise AIRequestFilterError(f"conversation_context.filters.{field}", first.get("msg", "invalid filter value")) from exc


def _parse_output(schema: type[BaseModel], output: Any) -> BaseModel:
    if isinstance(output, str):
        try:
            output = json.loads(output)
        except json.JSONDecodeError as exc:
            raise LLMOutputError("The model returned invalid JSON") from exc
    try:
        return schema.model_validate(output)
    except ValidationError as exc:
        raise LLMOutputError("The model returned an invalid structured response") from exc


def _call_model(llm: LLMAdapter, method: str, **kwargs) -> Any:
    try:
        return getattr(llm, method)(**kwargs)
    except LLMError:
        raise
    except Exception as exc:
        raise LLMProviderError("The model provider request failed") from exc


def _filters_for_domain(domain: SearchDomain, values: dict[str, Any]):
    model = _filter_model(domain)
    unknown = set(values) - set(model.model_fields)
    if unknown:
        raise LLMOutputError("The model returned a filter outside the supported field set")
    try:
        return model.model_validate(values)
    except ValidationError:
        return None


def _json_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, dict):
        return {key: _json_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_value(item) for item in value]
    return value


def _display_filters(filters: dict[str, Any]) -> str:
    labels = {
        "manufacturer": "제조사", "model": "모델", "cpu_vendor": "CPU 제조사",
        "cpu_series": "CPU 시리즈", "gpu_type": "GPU 유형", "min_ram_gb": "최소 RAM(GB)",
        "max_ram_gb": "최대 RAM(GB)", "min_price_krw": "최저 가격(원)",
        "max_price_krw": "최고 가격(원)", "min_weight_kg": "최소 무게(kg)",
        "max_weight_kg": "최대 무게(kg)", "registration_year_min": "최소 등록연도",
        "registration_year_max": "최대 등록연도", "min_mileage_km": "최소 주행거리(km)",
        "max_mileage_km": "최대 주행거리(km)", "branch_or_region": "지역", "sort": "정렬",
        "page": "페이지", "page_size": "페이지 크기",
    }
    return ", ".join(f"{labels.get(key, key)} {value:,}" if isinstance(value, int) else f"{labels.get(key, key)} {value}" for key, value in filters.items())


def _notice(domain: SearchDomain | None) -> str:
    if domain == "notebooks":
        return "노트북 가격은 관측된 구성 중 최저가 기준이며, 데이터는 수집 시점의 스냅샷입니다."
    if domain == "cars":
        return "자동차 가격은 수집 당시 판매 희망가이며, 현재 재고나 판매 상태를 보장하지 않는 스냅샷입니다."
    return "검색 결과는 데이터베이스에 저장된 수집 시점의 스냅샷을 기준으로 합니다."


def intent_classification(state: AISearchState) -> dict[str, Any]:
    request = state["request"]
    context = request.conversation_context
    raw = _call_model(
        state["llm"],
        "classify_intent",
        message=request.message,
        requested_domain=request.domain,
        context=context,
    )
    intent = _parse_output(IntentClassification, raw)
    assert isinstance(intent, IntentClassification)

    question = intent.clarification_question
    domain = request.domain or intent.domain
    if request.domain and intent.domain and request.domain != intent.domain:
        question = "요청한 검색 분야와 문장에서 파악한 분야가 다릅니다. 노트북과 자동차 중 어느 쪽을 검색할까요?"
    elif context and intent.domain and context.domain != intent.domain:
        question = "이전 검색 분야와 새 요청의 분야가 다릅니다. 어느 분야의 검색을 이어갈까요?"
    elif domain is None and intent.intent in ("refine", "sort_only") and context:
        domain = context.domain

    if intent.intent == "clarify" and not question:
        question = "검색 분야나 조건을 조금 더 구체적으로 알려주세요."
    elif domain is None and not question:
        question = "노트북과 자동차 중 어떤 분야를 검색할까요?"
    elif intent.intent == "sort_only" and context is None and not question:
        question = "정렬할 검색 분야와 기존 조건을 알려주세요."
    elif intent.intent == "refine" and context is None and not question:
        question = "수정할 기존 검색 조건을 전달해 주세요."

    needs_clarification = bool(question) or domain is None or (intent.intent in ("sort_only", "refine") and context is None)
    return {
        "intent": intent,
        "domain": domain,
        "clarification_required": needs_clarification,
        "clarification_question": question,
    }


def filter_extraction(state: AISearchState) -> dict[str, Any]:
    request = state["request"]
    domain = state["domain"]
    assert domain is not None
    raw = _call_model(
        state["llm"],
        "extract_filters",
        message=request.message,
        domain=domain,
        context=request.conversation_context,
    )
    extraction = _parse_output(FilterExtraction, raw)
    assert isinstance(extraction, FilterExtraction)
    return {"extraction": extraction}


def filter_validation(state: AISearchState) -> dict[str, Any]:
    request = state["request"]
    domain = state["domain"]
    intent = state["intent"]
    extraction = state["extraction"]
    assert domain is not None

    if extraction.domain is not None and extraction.domain != domain:
        return {
            "clarification_required": True,
            "clarification_question": "추출된 조건의 분야가 요청과 다릅니다. 노트북과 자동차 중 어떤 분야를 검색할까요?",
        }
    if extraction.unsupported_fields:
        requested = ", ".join(extraction.unsupported_fields[:3])
        question = extraction.clarification_question or f"{requested} 조건은 현재 구조화된 데이터에서 검색할 수 없습니다. 해당 조건을 제외하고 검색할지 알려주세요."
        return {"clarification_required": True, "clarification_question": question}
    if extraction.ambiguous_fields:
        question = extraction.clarification_question or "정량 기준을 조금 더 구체적으로 알려주세요."
        return {"clarification_required": True, "clarification_question": question}
    if extraction.clarification_question:
        return {"clarification_required": True, "clarification_question": extraction.clarification_question}

    previous = {}
    if intent.intent in ("refine", "sort_only") and request.conversation_context:
        previous = dict(request.conversation_context.filters)
    merged = {**previous, **extraction.filters}
    for field, value in merged.items():
        if isinstance(value, str) and len(value) > 200:
            raise LLMOutputError("The model returned an overlong text filter")
    if intent.intent == "sort_only" and "page" not in extraction.filters:
        merged["page"] = 1

    params = _filters_for_domain(domain, merged)
    if params is None:
        question = extraction.clarification_question or "최소·최대 범위 또는 숫자 형식을 확인해 주세요."
        return {"clarification_required": True, "clarification_question": question}
    normalized = _json_value(params.model_dump(exclude_unset=True))
    return {
        "filter_model": params,
        "applied_filters": normalized,
        "clarification_required": False,
        "clarification_question": None,
    }


def clarification(state: AISearchState) -> dict[str, Any]:
    domain = state.get("domain")
    question = state.get("clarification_question") or "검색 조건을 확인해 주세요."
    return {
        "response": AISearchResponse(
            domain=domain,
            applied_filters={},
            clarification_required=True,
            clarification_question=question,
            items=[],
            total=None,
            page=None,
            page_size=None,
            total_pages=None,
            answer=question,
            data_notice=_notice(domain),
        )
    }


def search_tool(state: AISearchState) -> dict[str, Any]:
    domain = state["domain"]
    params = state["filter_model"]
    if domain == "notebooks":
        result = search_notebooks(state["db"], params)  # type: ignore[arg-type]
    else:
        result = search_cars(state["db"], params)  # type: ignore[arg-type]
    return {"search_result": result}


def result_explanation(state: AISearchState) -> dict[str, Any]:
    domain = state["domain"]
    result = state["search_result"]
    total = result["total"]
    page_items = len(result["items"])
    domain_label = "노트북" if domain == "notebooks" else "자동차"
    conditions = _display_filters(state.get("applied_filters", {})) or "추가 조건 없음"
    if total == 0:
        answer = f"{conditions} 조건에 맞는 {domain_label} 검색 결과는 0건입니다. 조건을 자동으로 완화하지 않았습니다."
    else:
        answer = f"{conditions} 조건에 맞는 {domain_label}은 총 {total:,}건이며, 현재 페이지에 {page_items}건을 표시합니다."
    return {
        "response": AISearchResponse(
            domain=domain,
            applied_filters=state.get("applied_filters", {}),
            clarification_required=False,
            clarification_question=None,
            items=result["items"],
            total=total,
            page=result["page"],
            page_size=result["page_size"],
            total_pages=result["total_pages"],
            answer=answer,
            data_notice=_notice(domain),
        )
    }


def _after_intent(state: AISearchState) -> Literal["clarification", "filter_extraction"]:
    return "clarification" if state.get("clarification_required") else "filter_extraction"


def _after_validation(state: AISearchState) -> Literal["clarification", "search_tool"]:
    return "clarification" if state.get("clarification_required") else "search_tool"


def build_search_graph():
    builder = StateGraph(AISearchState)
    builder.add_node("intent_classification", intent_classification)
    builder.add_node("filter_extraction", filter_extraction)
    builder.add_node("filter_validation", filter_validation)
    builder.add_node("clarification", clarification)
    builder.add_node("search_tool", search_tool)
    builder.add_node("result_explanation", result_explanation)
    builder.add_edge(START, "intent_classification")
    builder.add_conditional_edges("intent_classification", _after_intent)
    builder.add_edge("filter_extraction", "filter_validation")
    builder.add_conditional_edges("filter_validation", _after_validation)
    builder.add_edge("clarification", END)
    builder.add_edge("search_tool", "result_explanation")
    builder.add_edge("result_explanation", END)
    return builder.compile()


search_graph = build_search_graph()
