from typing import Any, Protocol

from app.ai_search.schemas import ConversationContext, SearchDomain


class LLMError(Exception):
    """Base class for safe-to-report model service failures."""


class LLMUnavailableError(LLMError):
    pass


class LLMProviderError(LLMError):
    pass


class LLMOutputError(LLMError):
    pass


class LLMAdapter(Protocol):
    """Provider contract: message/context are untrusted; return schema-only data.

    Implementations must not expose tools or SQL execution to the model. The
    graph independently validates every returned field before invoking search.
    """

    def classify_intent(
        self,
        *,
        message: str,
        requested_domain: SearchDomain | None,
        context: ConversationContext | None,
    ) -> Any: ...

    def extract_filters(
        self,
        *,
        message: str,
        domain: SearchDomain,
        context: ConversationContext | None,
    ) -> Any: ...


class UnconfiguredLLM:
    """Production default until a provider and its credentials are selected."""

    def classify_intent(self, **kwargs):
        raise LLMUnavailableError("No LLM provider has been configured")

    def extract_filters(self, **kwargs):
        raise LLMUnavailableError("No LLM provider has been configured")


def get_llm_adapter() -> LLMAdapter:
    return UnconfiguredLLM()
