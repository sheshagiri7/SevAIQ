"""SevAIQ AI Services Package.

Modular, multi-provider AI architecture for civic intelligence.
Supports Google Gemini as the primary provider with clean extension points
for future LLM providers.
"""

from app.services.ai.base import (
    AIErrorType,
    AIProviderError,
    BaseAIProvider,
    ChatMessage,
    ChatResponse,
    ProviderHealth,
)
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.provider_manager import AIProviderManager, get_ai_manager

__all__ = [
    "AIErrorType",
    "AIProviderError",
    "BaseAIProvider",
    "ChatMessage",
    "ChatResponse",
    "ProviderHealth",
    "GeminiProvider",
    "AIProviderManager",
    "get_ai_manager",
]
