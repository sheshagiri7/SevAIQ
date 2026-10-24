"""AI Provider Manager for SevAIQ.

Orchestrates configured AI providers in priority order, enforces bounded
retries on transient errors, prevents quota evasion, and allows clean
plug-and-play extension for future model providers.
"""

import logging
import os
import time
from typing import Dict, List, Optional

from app.services.ai.base import (
    AIErrorType,
    AIProviderError,
    BaseAIProvider,
    ChatMessage,
    ChatResponse,
    ProviderHealth,
)
from app.services.ai.gemini_provider import GeminiProvider

logger = logging.getLogger("sevaiq.ai.manager")


class AIProviderManager:
    """Manages AI provider registration, routing policy, and bounded execution."""

    def __init__(
        self,
        providers: Optional[List[BaseAIProvider]] = None,
        priority: Optional[List[str]] = None,
        max_transient_retries: Optional[int] = None,
        default_timeout: Optional[float] = None,
    ):
        self._registry: Dict[str, BaseAIProvider] = {}

        # Default providers: Gemini is the primary initial provider
        initial_providers = providers if providers is not None else [GeminiProvider()]
        for p in initial_providers:
            self.register_provider(p)

        self._priority_override = priority
        self._max_retries = max_transient_retries
        self._default_timeout = default_timeout

    def register_provider(self, provider: BaseAIProvider) -> None:
        """Register a new AI provider instance."""
        self._registry[provider.provider_id] = provider
        logger.info(
            "Registered AI provider: %s (%s)",
            provider.provider_id,
            provider.display_name,
        )

    def get_provider(self, provider_id: str) -> Optional[BaseAIProvider]:
        """Look up a provider by ID."""
        return self._registry.get(provider_id)

    @property
    def provider_priority(self) -> List[str]:
        """Get the ordered provider IDs for execution routing."""
        if self._priority_override is not None:
            return self._priority_override

        env_priority = os.getenv("AI_PROVIDER_PRIORITY")
        if env_priority:
            parsed = [p.strip() for p in env_priority.split(",") if p.strip()]
            if parsed:
                return parsed

        return list(self._registry.keys())

    @property
    def max_transient_retries(self) -> int:
        """Maximum number of retries allowed for transient errors (never quota)."""
        if self._max_retries is not None:
            return self._max_retries
        try:
            val = int(os.getenv("AI_MAX_TRANSIENT_RETRIES", "1"))
            return max(0, min(val, 2))  # bounded strictly between 0 and 2
        except ValueError:
            return 1

    @property
    def default_timeout(self) -> float:
        """Default generation timeout in seconds."""
        if self._default_timeout is not None:
            return self._default_timeout
        try:
            return float(os.getenv("AI_REQUEST_TIMEOUT", "15.0"))
        except ValueError:
            return 15.0

    def list_providers(self) -> List[ProviderHealth]:
        """Assess and list health status of all registered providers."""
        statuses: List[ProviderHealth] = []
        for p_id in self.provider_priority:
            provider = self._registry.get(p_id)
            if provider:
                statuses.append(provider.get_health())

        # Include any registered providers not explicitly in priority list
        for p_id, provider in self._registry.items():
            if p_id not in self.provider_priority:
                statuses.append(provider.get_health())

        return statuses

    def generate_chat_response(
        self,
        messages: List[ChatMessage],
        context: Optional[str] = None,
        language: str = "en",
        focused_scheme_id: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
        citizen_context: Optional[Dict[str, Any]] = None,
    ) -> ChatResponse:
        """Execute chat generation using the configured provider policy.
        
        Routing Logic:
        1. Evaluates providers in priority order.
        2. Applies bounded retries ONLY for transient failures (network/503/timeout).
        3. Never retries quota exhaustion or configuration errors indefinitely.
        4. If a provider fails, falls back to the next independently configured
           provider in the policy (if one exists).
        5. If all configured providers fail or only one is configured, raises
           the structured AIProviderError to inform the citizen.
        """
        timeout = timeout_seconds or self.default_timeout
        priority_order = self.provider_priority
        last_error: Optional[AIProviderError] = None

        configured_candidates = [
            self._registry[p_id]
            for p_id in priority_order
            if p_id in self._registry and self._registry[p_id].is_configured()
        ]

        if not configured_candidates:
            # Check if any provider exists at all
            if not self._registry:
                raise AIProviderError(
                    provider_id="none",
                    error_type=AIErrorType.CONFIGURATION_ERROR,
                    message="No AI providers are registered on the server.",
                    status_code=503,
                    retryable=False,
                )

            # Return specific error for the primary provider
            first_id = priority_order[0] if priority_order else list(self._registry.keys())[0]
            first_provider = self._registry.get(first_id)
            if first_provider:
                raise AIProviderError(
                    provider_id=first_id,
                    error_type=AIErrorType.CONFIGURATION_ERROR,
                    message=f"{first_provider.display_name} is not configured on the backend server. Set {first_id.upper()}_API_KEY in backend/.env.",
                    status_code=503,
                    retryable=False,
                )

        for provider in configured_candidates:
            logger.info("Attempting AI generation with provider: %s", provider.provider_id)
            attempts = 0
            max_attempts = 1 + self.max_transient_retries

            while attempts < max_attempts:
                attempts += 1
                try:
                    kwargs = {
                        "messages": messages,
                        "context": context,
                        "language": language,
                        "timeout_seconds": timeout,
                    }
                    import inspect
                    sig = inspect.signature(provider.generate_chat_response)
                    if "citizen_context" in sig.parameters:
                        kwargs["citizen_context"] = citizen_context

                    response = provider.generate_chat_response(**kwargs)
                    return response

                except AIProviderError as e:
                    last_error = e

                    # Strictly do NOT retry quota exhaustion, auth errors, or config errors
                    if not e.retryable or attempts >= max_attempts:
                        logger.warning(
                            "Provider %s non-retryable or max attempts (%d) reached: %s [%s]",
                            provider.provider_id,
                            attempts,
                            e.error_type.value,
                            e.message,
                        )
                        break

                    # Transient error bounded backoff
                    logger.info(
                        "Provider %s transient error (%s). Bounded retry attempt %d of %d...",
                        provider.provider_id,
                        e.error_type.value,
                        attempts + 1,
                        max_attempts,
                    )
                    time.sleep(0.5)

            # If quota is exhausted or provider failed, log routing transition
            logger.warning(
                "Provider %s failed with %s. Checking if next provider is available in policy.",
                provider.provider_id,
                last_error.error_type.value if last_error else "unknown",
            )

        # If we reach here, all configured providers failed
        if last_error:
            raise last_error

        raise AIProviderError(
            provider_id="system",
            error_type=AIErrorType.TRANSIENT_ERROR,
            message="All configured AI providers failed to generate a response.",
            status_code=503,
            retryable=True,
        )


_global_manager: Optional[AIProviderManager] = None


def get_ai_manager() -> AIProviderManager:
    """Obtain or initialize the global AI Provider Manager singleton."""
    global _global_manager
    if _global_manager is None:
        _global_manager = AIProviderManager()
    return _global_manager
