"""Base interfaces, data structures, and error classifications for AI Providers.

Provides an extensible contract for integrating LLM providers in SevAIQ.
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class AIErrorType(str, Enum):
    """Classification of errors that may occur during AI generation."""
    CONFIGURATION_ERROR = "configuration_error"
    AUTH_ERROR = "auth_error"
    QUOTA_EXHAUSTED = "quota_exhausted"
    RATE_LIMITED = "rate_limited"
    TRANSIENT_ERROR = "transient_error"
    TIMEOUT = "timeout"
    EMPTY_RESPONSE = "empty_response"
    SAFETY_BLOCKED = "safety_blocked"
    INVALID_RESPONSE = "invalid_response"


class AIProviderError(Exception):
    """Structured exception raised when an AI provider fails."""

    def __init__(
        self,
        provider_id: str,
        error_type: AIErrorType,
        message: str,
        status_code: int = 500,
        retryable: bool = False,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.provider_id = provider_id
        self.error_type = error_type
        self.message = message
        self.status_code = status_code
        self.retryable = retryable
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider_id": self.provider_id,
            "error_type": self.error_type.value,
            "message": self.message,
            "status_code": self.status_code,
            "retryable": self.retryable,
            "details": self.details,
        }


class ChatMessage(BaseModel):
    """Individual message in a multi-turn conversation."""
    role: Literal["user", "assistant", "system"] = Field(
        ..., description="Message author role"
    )
    content: str = Field(..., min_length=1, description="Message text content")


class ChatResponse(BaseModel):
    """Standardized response from an AI provider."""
    content: str = Field(..., description="Assistant text response")
    provider_id: str = Field(..., description="Unique ID of provider (e.g. 'gemini')")
    model_id: str = Field(..., description="Model version used (e.g. 'gemini-2.5-flash')")
    latency_ms: Optional[float] = Field(None, description="Generation latency in milliseconds")
    usage: Optional[Dict[str, Any]] = Field(None, description="Sanitized token usage counts")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional non-sensitive metadata")


class ProviderHealth(BaseModel):
    """Health and readiness assessment of an AI provider."""
    provider_id: str
    display_name: str
    configured: bool
    status: Literal["ready", "not_configured", "quota_exhausted", "error"]
    message: str


class BaseAIProvider(ABC):
    """Abstract Base Class for an AI Provider."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique identifier for this provider (e.g. 'gemini', 'anthropic', 'openai')."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable display name for this provider."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if required environment variables/credentials are present."""
        pass

    @abstractmethod
    def get_health(self) -> ProviderHealth:
        """Return the current configuration and operational health status."""
        pass

    @abstractmethod
    def generate_chat_response(
        self,
        messages: List[ChatMessage],
        context: Optional[str] = None,
        language: str = "en",
        timeout_seconds: float = 15.0,
    ) -> ChatResponse:
        """Generate a grounded, genuine AI response for the conversation.
        
        Args:
            messages: Prior conversation turns and user query.
            context: Verified scheme catalog grounding context.
            language: Requested response language ('en' or 'ta').
            timeout_seconds: Maximum time allowed before timing out.

        Returns:
            ChatResponse: Genuine AI response object.

        Raises:
            AIProviderError: Categorized provider error if generation fails.
        """
        pass
