from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ai_search.graph import AIRequestFilterError, search_graph, validate_context
from app.ai_search.llm import (
    LLMOutputError,
    LLMProviderError,
    LLMUnavailableError,
    get_llm_adapter,
)
from app.ai_search.schemas import AISearchRequest, AISearchResponse
from app.database import get_db

router = APIRouter(prefix="/api/ai", tags=["ai-search"])


@router.post("/search", response_model=AISearchResponse)
def natural_language_search(
    request: AISearchRequest,
    db: Annotated[Session, Depends(get_db)],
    llm: Annotated[object, Depends(get_llm_adapter)],
):
    try:
        validate_context(request.conversation_context, request.domain)
        state = search_graph.invoke({"request": request, "db": db, "llm": llm})
        return state["response"]
    except AIRequestFilterError as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_AI_REQUEST",
                "message": "대화 검색 조건을 확인해 주세요.",
                "details": {"field": exc.field, "reason": exc.reason},
            },
        ) from exc
    except LLMUnavailableError as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "AI_MODEL_UNAVAILABLE", "message": "AI 모델이 설정되지 않았습니다.", "details": None},
        ) from exc
    except LLMOutputError as exc:
        raise HTTPException(
            status_code=502,
            detail={"code": "AI_OUTPUT_INVALID", "message": "AI 모델 응답을 처리할 수 없습니다.", "details": None},
        ) from exc
    except LLMProviderError as exc:
        raise HTTPException(
            status_code=502,
            detail={"code": "AI_MODEL_ERROR", "message": "AI 모델 요청에 실패했습니다.", "details": None},
        ) from exc
