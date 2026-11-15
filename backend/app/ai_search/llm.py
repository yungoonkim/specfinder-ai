from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
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


# Reuse the same backend/.env resolution approach as app.database.Settings.
# os.getenv alone does not read values declared only in a .env file.
_VERTEX_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class _VertexSettings(BaseSettings):
    google_cloud_project: str = ""
    google_cloud_location: str = "global"
    gemini_model: str = "gemini-3.5-flash-lite"
    model_config = SettingsConfigDict(extra="ignore")


def get_llm_adapter() -> LLMAdapter:
    """Read environment + backend/.env; defer ADC until the first model call."""
    settings = _VertexSettings(_env_file=_VERTEX_ENV_FILE)
    project = settings.google_cloud_project.strip()
    if not project:
        return UnconfiguredLLM()
    return _vertex_adapter(
        project,
        settings.google_cloud_location.strip() or "global",
        settings.gemini_model.strip() or "gemini-3.5-flash-lite",
    )


@lru_cache(maxsize=8)
def _vertex_adapter(project_id: str, location: str, model: str) -> LLMAdapter:
    # Keep the SDK's HTTP client alive across requests, but defer all ADC access
    # until the first model call.
    from app.ai_search.vertex_gemini_adapter import VertexGeminiAdapter

    return VertexGeminiAdapter(project_id=project_id, location=location, model=model)
