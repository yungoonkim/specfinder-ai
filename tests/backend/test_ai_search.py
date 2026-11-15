from decimal import Decimal
from typing import Any
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.ai_search.llm import get_llm_adapter
from app.database import get_db
from app.main import app
from app.routers import ai_search


class FakeLLM:
    """Scripted test adapter; never selected by the production dependency."""

    def __init__(self, classification: Any, extraction: Any = None, error: Exception | None = None):
        self.classification = classification
        self.extraction = extraction
        self.error = error
        self.classification_calls = 0
        self.extraction_calls = 0

    def classify_intent(self, **kwargs):
        self.classification_calls += 1
        if self.error:
            raise self.error
        return self.classification

    def extract_filters(self, **kwargs):
        self.extraction_calls += 1
        if self.error:
            raise self.error
        return self.extraction


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = lambda: None
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def configure_fake(fake: FakeLLM):
    app.dependency_overrides[get_llm_adapter] = lambda: fake


def notebook_result(total: int = 1):
    items = [] if total == 0 else [{
        "id": "101", "name": "Test notebook", "manufacturer": "LG전자", "product_type": None,
        "cpu_vendor": None, "cpu_series": None, "cpu_model": None, "gpu_type": None,
        "gpu_model": None, "ram_gb": Decimal("16.0"), "screen_inches": Decimal("15.60"),
        "weight_kg": Decimal("0.990"), "price_krw": 1200000,
        "own_configuration_price_krw": 1300000, "base_storage_text": "512GB", "os": None,
        "source_url": None, "captured_at": None,
    }]
    return {"items": items, "total": total, "page": 1, "page_size": 20, "total_pages": int(total > 0)}


def car_result(total: int = 1):
    items = [] if total == 0 else [{
        "id": "direct:101", "title": "현대 아이오닉 5", "manufacturer": "현대", "model": "아이오닉 5",
        "trim": None, "registration_year": 2022, "registration_month": 1, "mileage_km": 40000,
        "price_krw": 30000000, "branch_or_region": "서울", "status_label": None,
        "drive_text_explicit": None, "flag_extreme_mileage": False, "thumbnail_url": None,
        "source_url": "https://www.kcar.com/bc/search", "captured_at": None,
    }]
    return {"items": items, "total": total, "page": 1, "page_size": 20, "total_pages": int(total > 0)}


def set_search_results(monkeypatch, notebooks=None, cars=None):
    from app.ai_search import graph
    if notebooks is not None:
        monkeypatch.setattr(graph, "search_notebooks", lambda db, params: notebooks)
    if cars is not None:
        monkeypatch.setattr(graph, "search_cars", lambda db, params: cars)


def run_search(client, fake, *, domain, message, context=None):
    configure_fake(fake)
    body = {"domain": domain, "message": message}
    if context is not None:
        body["conversation_context"] = context
    return client.post("/api/ai/search", json=body)


PROMPT_CASES = [
    ("150만 원 이하 RAM 16GB 이상", "notebooks", "search", {"min_ram_gb": 16, "max_price_krw": 1500000}, None, {"min_ram_gb": 16, "max_price_krw": 1500000}),
    ("RAM 32GB 이상 노트북", "notebooks", "search", {"min_ram_gb": 32}, None, {"min_ram_gb": 32}),
    ("무게 1.5kg에서 2kg 노트북", "notebooks", "search", {"min_weight_kg": 1.5, "max_weight_kg": 2}, None, {"min_weight_kg": 1.5, "max_weight_kg": 2}),
    ("LG전자 노트북", "notebooks", "search", {"manufacturer": "LG전자"}, None, {"manufacturer": "LG전자"}),
    ("AMD CPU 노트북", "notebooks", "search", {"cpu_vendor": "AMD"}, None, {"cpu_vendor": "AMD"}),
    ("라이젠 AI 시리즈", "notebooks", "search", {"cpu_series": "라이젠AI 5"}, None, {"cpu_series": "라이젠AI 5"}),
    ("내장그래픽 노트북", "notebooks", "search", {"gpu_type": "내장그래픽"}, None, {"gpu_type": "내장그래픽"}),
    ("100만 원에서 150만 원 노트북", "notebooks", "search", {"min_price_krw": 1000000, "max_price_krw": 1500000}, None, {"min_price_krw": 1000000, "max_price_krw": 1500000}),
    ("무겁지 않은 노트북", "notebooks", "search", {}, {"ambiguous_fields": ["weight_kg"], "clarification_question": "가벼운 무게 기준을 알려주세요."}, None),
    ("성능 좋은 노트북", "notebooks", "search", {}, {"ambiguous_fields": ["performance"], "clarification_question": "원하는 CPU 또는 RAM 기준을 알려주세요."}, None),
    ("현대 전기차 3천만 원 이하 주행거리 5만 km 이하", "cars", "search", {"manufacturer": "현대", "max_price_krw": 30000000, "max_mileage_km": 50000}, None, {"manufacturer": "현대", "max_price_krw": 30000000, "max_mileage_km": 50000}),
    ("현대 전기차 3천만 원 이하", "cars", "search", {"manufacturer": "현대", "max_price_krw": 30000000}, None, {"manufacturer": "현대", "max_price_krw": 30000000}),
    ("기아 EV6 2023년 이후", "cars", "search", {"manufacturer": "기아", "model": "EV6", "registration_year_min": 2023}, None, {"manufacturer": "기아", "model": "EV6", "registration_year_min": 2023}),
    ("전기차 매물 보여줘", "cars", "search", {}, None, {}),
    ("현대 3천만 원 이하 매물 보여줘", "cars", "search", {"manufacturer": "현대", "max_price_krw": 30000000}, None, {"manufacturer": "현대", "max_price_krw": 30000000}),
    ("기아 전기차 2천만 원 이상", "cars", "search", {"manufacturer": "기아", "min_price_krw": 20000000}, None, {"manufacturer": "기아", "min_price_krw": 20000000}),
    ("아이오닉 5 찾아줘", "cars", "search", {"model": "아이오닉 5"}, None, {"model": "아이오닉 5"}),
    ("2022년 이후 등록된 차", "cars", "search", {"registration_year_min": 2022}, None, {"registration_year_min": 2022}),
    ("서울 지역 매물", "cars", "search", {"branch_or_region": "서울"}, None, {"branch_or_region": "서울"}),
    ("주행거리 3만에서 5만 km", "cars", "search", {"min_mileage_km": 30000, "max_mileage_km": 50000}, None, {"min_mileage_km": 30000, "max_mileage_km": 50000}),
    ("가격 낮은 순", "notebooks", "sort_only", {"sort": "price_asc"}, {"domain": "notebooks", "filters": {"min_ram_gb": 16, "max_price_krw": 1500000}}, {"sort": "price_asc", "min_ram_gb": 16, "max_price_krw": 1500000, "page": 1}),
    ("RAM을 32GB 이상으로 바꿔줘", "notebooks", "refine", {"min_ram_gb": 32}, {"domain": "notebooks", "filters": {"min_ram_gb": 16, "max_price_krw": 1500000}}, {"min_ram_gb": 32, "max_price_krw": 1500000}),
    ("가격이 1원 이하인 노트북", "notebooks", "search", {"max_price_krw": 1}, None, {"max_price_krw": 1}),
    ("등록연도 2020년에서 2022년", "cars", "search", {"registration_year_min": 2020, "registration_year_max": 2022}, None, {"registration_year_min": 2020, "registration_year_max": 2022}),
]


@pytest.mark.parametrize("message,domain,intent,filters,context,expected", PROMPT_CASES)
def test_scripted_prompt_evaluation_runs_through_graph(client, monkeypatch, message, domain, intent, filters, context, expected):
    request_context = context if context and "domain" in context and "filters" in context else None
    extraction_extras = {} if request_context else (context or {})
    fake = FakeLLM(
        {"domain": domain, "intent": intent},
        {"domain": domain, "filters": filters, **extraction_extras},
    )
    total = 0 if message == "가격이 1원 이하인 노트북" else 1
    if domain == "notebooks":
        set_search_results(monkeypatch, notebooks=notebook_result(total))
    else:
        set_search_results(monkeypatch, cars=car_result(total))
    response = run_search(client, fake, domain=domain, message=message, context=request_context)

    assert response.status_code == 200
    body = response.json()
    if expected is None:
        assert body["clarification_required"] is True
        assert body["items"] == []
        assert fake.extraction_calls == 1
    else:
        assert body["clarification_required"] is False
        assert body["applied_filters"] == expected
        assert body["total"] == total


def test_explicit_domain_conflict_returns_clarification(client, monkeypatch):
    fake = FakeLLM({"domain": "cars", "intent": "search"}, {"domain": "cars", "filters": {"manufacturer": "현대"}})
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_cars", search)

    response = run_search(client, fake, domain="notebooks", message="현대 전기차")

    assert response.status_code == 200
    assert response.json()["clarification_required"] is True
    assert response.json()["items"] == []
    assert fake.extraction_calls == 0
    search.assert_not_called()


def test_sort_request_without_context_asks_instead_of_guessing(client, monkeypatch):
    fake = FakeLLM({"domain": None, "intent": "sort_only"}, {"filters": {"sort": "price_asc"}})
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_notebooks", search)
    monkeypatch.setattr("app.ai_search.graph.search_cars", search)

    response = run_search(client, fake, domain=None, message="가격 낮은 순")

    assert response.status_code == 200
    assert response.json()["clarification_required"] is True
    assert response.json()["domain"] is None
    assert search.call_count == 0
    assert fake.extraction_calls == 0


def test_domain_can_be_classified_from_message_when_not_supplied(client, monkeypatch):
    fake = FakeLLM(
        {"domain": "notebooks", "intent": "search"},
        {"domain": "notebooks", "filters": {"min_ram_gb": 16}},
    )
    set_search_results(monkeypatch, notebooks=notebook_result())
    response = run_search(client, fake, domain=None, message="RAM 16GB 이상 노트북")

    assert response.status_code == 200
    assert response.json()["domain"] == "notebooks"
    assert response.json()["applied_filters"] == {"min_ram_gb": 16}


def test_unsupported_battery_field_requires_clarification(client, monkeypatch):
    fake = FakeLLM(
        {"domain": "cars", "intent": "search"},
        {"domain": "cars", "filters": {"manufacturer": "현대"}, "unsupported_fields": ["battery_soh"]},
    )
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_cars", search)

    response = run_search(client, fake, domain="cars", message="배터리 상태 좋은 현대차")

    assert response.status_code == 200
    assert response.json()["clarification_required"] is True
    assert "검색할 수 없습니다" in response.json()["clarification_question"]
    search.assert_not_called()


@pytest.mark.parametrize(
    "message,unsupported",
    [
        ("배터리 SOH 90% 이상인 현대 전기차", ["battery_soh"]),
        ("1회 충전으로 500km 이상 가는 차량", ["range_per_charge"]),
    ],
)
def test_unavailable_battery_specs_require_clarification_without_search(client, monkeypatch, message, unsupported):
    fake = FakeLLM(
        {"domain": "cars", "intent": "search"},
        {"domain": "cars", "filters": {"manufacturer": "현대"}, "unsupported_fields": unsupported},
    )
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_cars", search)

    response = run_search(client, fake, domain="cars", message=message)

    assert response.status_code == 200
    assert response.json()["domain"] == "cars"
    assert response.json()["clarification_required"] is True
    assert "검색할 수 없습니다" in response.json()["clarification_question"]
    search.assert_not_called()


def test_vague_battery_question_keeps_selected_car_domain(client, monkeypatch):
    fake = FakeLLM(
        {"domain": "notebooks", "intent": "clarify", "clarification_question": "노트북과 자동차 중 어느 분야를 검색할까요?"},
        {"domain": "cars", "filters": {}, "unsupported_fields": ["battery_life"]},
    )
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_cars", search)
    monkeypatch.setattr("app.ai_search.graph.search_notebooks", search)

    response = run_search(client, fake, domain="cars", message="배터리 오래가는 걸로 추천해줘")

    assert response.status_code == 200
    body = response.json()
    assert body["domain"] == "cars"
    assert body["clarification_required"] is True
    assert "배터리" in body["clarification_question"]
    assert "데이터가 없어" in body["clarification_question"]
    assert "노트북과 자동차 중" not in body["clarification_question"]
    search.assert_not_called()


def test_explicit_notebook_request_after_car_selection_keeps_domain_conflict(client, monkeypatch):
    fake = FakeLLM({"domain": "notebooks", "intent": "search"}, {"domain": "notebooks", "filters": {}})
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_cars", search)
    monkeypatch.setattr("app.ai_search.graph.search_notebooks", search)

    response = run_search(client, fake, domain="cars", message="노트북 찾아줘")

    assert response.status_code == 200
    assert response.json()["domain"] == "cars"
    assert response.json()["clarification_required"] is True
    assert "분야가 다릅니다" in response.json()["clarification_question"]
    search.assert_not_called()


def test_car_follow_up_preserves_existing_price_and_mileage_context(client, monkeypatch):
    fake = FakeLLM(
        {"domain": "notebooks", "intent": "refine", "clarification_question": "노트북과 자동차 중 어느 분야를 검색할까요?"},
        {"domain": "cars", "filters": {"manufacturer": "현대"}},
    )
    set_search_results(monkeypatch, cars=car_result())
    context = {"domain": "cars", "filters": {"max_price_krw": 30000000, "max_mileage_km": 50000}}

    response = run_search(client, fake, domain="cars", message="현대차로 좁혀줘", context=context)

    assert response.status_code == 200
    assert response.json()["domain"] == "cars"
    assert response.json()["applied_filters"] == {
        "manufacturer": "현대", "max_price_krw": 30000000, "max_mileage_km": 50000,
    }


def test_car_filter_field_outside_whitelist_is_rejected(client, monkeypatch):
    fake = FakeLLM(
        {"domain": "cars", "intent": "search"},
        {"domain": "cars", "filters": {"battery_soh": 90}},
    )
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_cars", search)

    response = run_search(client, fake, domain="cars", message="배터리 SOH 90%")

    assert response.status_code == 502
    assert response.json()["code"] == "AI_OUTPUT_INVALID"
    search.assert_not_called()


def test_model_clarification_question_prevents_search_even_without_flag(client, monkeypatch):
    fake = FakeLLM(
        {"domain": "notebooks", "intent": "search"},
        {"filters": {}, "clarification_question": "가격 범위를 확인해 주세요."},
    )
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_notebooks", search)

    response = run_search(client, fake, domain="notebooks", message="적당한 가격")

    assert response.status_code == 200
    assert response.json()["clarification_required"] is True
    assert response.json()["clarification_question"] == "가격 범위를 확인해 주세요."
    search.assert_not_called()


def test_minimum_above_maximum_requests_clarification_without_search(client, monkeypatch):
    fake = FakeLLM(
        {"domain": "notebooks", "intent": "search"},
        {"filters": {"min_price_krw": 3000000, "max_price_krw": 1000000}},
    )
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_notebooks", search)

    response = run_search(client, fake, domain="notebooks", message="예산 범위")

    assert response.status_code == 200
    assert response.json()["clarification_required"] is True
    search.assert_not_called()


@pytest.mark.parametrize("bad_output", ["{not json", {"filters": {"sql": "DROP TABLE cars"}}, {"unknown": True}])
def test_malformed_or_non_whitelisted_model_output_is_rejected(client, monkeypatch, bad_output):
    fake = FakeLLM({"domain": "notebooks", "intent": "search"}, bad_output)
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_notebooks", search)

    response = run_search(client, fake, domain="notebooks", message="RAM 16GB 노트북")

    assert response.status_code == 502
    assert response.json()["code"] == "AI_OUTPUT_INVALID"
    search.assert_not_called()


def test_provider_failure_is_distinct_from_database_failure(client, monkeypatch):
    fake = FakeLLM({}, error=RuntimeError("secret provider traceback"))
    response = run_search(client, fake, domain="notebooks", message="노트북")
    assert response.status_code == 502
    assert response.json()["code"] == "AI_MODEL_ERROR"
    assert "traceback" not in response.text.lower()

    fake = FakeLLM({"domain": "notebooks", "intent": "search"}, {"filters": {"min_ram_gb": 16}})
    configure_fake(fake)
    monkeypatch.setattr("app.ai_search.graph.search_notebooks", Mock(side_effect=SQLAlchemyError("db details")))
    response = client.post("/api/ai/search", json={"domain": "notebooks", "message": "RAM 16GB"})
    assert response.status_code == 503
    assert response.json()["code"] == "DB_UNAVAILABLE"


def test_unconfigured_production_adapter_never_returns_fake_results(client):
    response = client.post("/api/ai/search", json={"domain": "notebooks", "message": "RAM 16GB"})
    assert response.status_code == 503
    assert response.json()["code"] == "AI_MODEL_UNAVAILABLE"


def test_untrusted_context_is_validated_before_model_or_search(client, monkeypatch):
    fake = FakeLLM({"domain": "notebooks", "intent": "refine"}, {"filters": {}})
    configure_fake(fake)
    search = Mock()
    monkeypatch.setattr("app.ai_search.graph.search_notebooks", search)

    response = client.post("/api/ai/search", json={
        "domain": "notebooks", "message": "가격 낮은 순",
        "conversation_context": {"domain": "notebooks", "filters": {"sql": "DROP TABLE cars"}},
    })

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_AI_REQUEST"
    assert fake.classification_calls == 0
    search.assert_not_called()


@pytest.mark.parametrize(
    "body",
    [
        {"domain": "notebooks", "message": "   "},
        {"domain": "notebooks", "message": "x" * 2001},
        {"domain": "notebooks", "message": "search", "unexpected": "value"},
    ],
)
def test_ai_request_shape_and_length_are_validated(client, body):
    response = client.post("/api/ai/search", json=body)
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_AI_REQUEST"


def test_post_cors_is_limited_to_configured_frontend_origin(client):
    response = client.options(
        "/api/ai/search",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "POST" in response.headers["access-control-allow-methods"]


def test_zero_results_are_reported_without_relaxing_filters(client, monkeypatch):
    fake = FakeLLM({"domain": "cars", "intent": "search"}, {"filters": {"manufacturer": "현대"}})
    set_search_results(monkeypatch, cars=car_result(0))

    response = run_search(client, fake, domain="cars", message="현대 전기차")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["items"] == []
    assert body["applied_filters"] == {"manufacturer": "현대"}
    assert "자동으로 완화하지 않았습니다" in body["answer"]
