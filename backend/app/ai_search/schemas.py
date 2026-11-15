from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas import CarItem, NotebookItem

SearchDomain = Literal["notebooks", "cars"]
SearchIntent = Literal["search", "refine", "sort_only", "clarify"]


class ConversationContext(BaseModel):
    """Small client-carried state; all fields are revalidated on every request."""

    model_config = ConfigDict(extra="forbid")

    domain: SearchDomain
    filters: dict[str, Any] = Field(default_factory=dict, max_length=32)


class AISearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    domain: SearchDomain | None = None
    message: str = Field(min_length=1, max_length=2000)
    conversation_context: ConversationContext | None = None

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message must not be blank")
        return value


class AISearchResponse(BaseModel):
    domain: SearchDomain | None
    applied_filters: dict[str, Any]
    clarification_required: bool
    clarification_question: str | None
    items: list[NotebookItem | CarItem]
    total: int | None
    page: int | None
    page_size: int | None
    total_pages: int | None
    answer: str
    data_notice: str


class IntentClassification(BaseModel):
    model_config = ConfigDict(extra="forbid")

    domain: SearchDomain | None = None
    intent: SearchIntent
    clarification_question: str | None = Field(default=None, max_length=500)


class FilterExtraction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    domain: SearchDomain | None = None
    filters: dict[str, Any] = Field(default_factory=dict, max_length=32)
    ambiguous_fields: list[str] = Field(default_factory=list, max_length=16)
    unsupported_fields: list[str] = Field(default_factory=list, max_length=16)
    clarification_question: str | None = Field(default=None, max_length=500)
