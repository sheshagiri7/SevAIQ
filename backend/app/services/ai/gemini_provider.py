"""Google Gemini AI Provider for SevAIQ.

Implements the official Google Gen AI Python SDK (google-genai) with
robust error classification, civic grounding, sanitized usage logging,
and strict quota respect.
"""

import logging
import os
import time
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.services.ai.base import (
    AIErrorType,
    AIProviderError,
    BaseAIProvider,
    ChatMessage,
    ChatResponse,
    ProviderHealth,
)
from app.services.ai.grounding import build_system_instruction

logger = logging.getLogger("sevaiq.ai.gemini")


class GeminiProvider(BaseAIProvider):
    """Google Gemini AI Provider using the official Google Gen AI SDK."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        self._custom_api_key = api_key
        self._custom_model = model_name
        self._client: Optional[genai.Client] = None

    @property
    def provider_id(self) -> str:
        return "gemini"

    @property
    def display_name(self) -> str:
        return "Google Gemini"

    @property
    def api_key(self) -> Optional[str]:
        """Read API key from constructor override or backend environment variable."""
        if self._custom_api_key is not None:
            return self._custom_api_key
        return os.getenv("GEMINI_API_KEY")

    @property
    def model_name(self) -> str:
        """Read model name from constructor or backend environment variable."""
        if self._custom_model is not None:
            return self._custom_model
        return os.getenv("GEMINI_MODEL") or "gemini-3.5-flash-lite"

    def is_configured(self) -> bool:
        """Check if a valid, non-empty Gemini API key is present."""
        key = self.api_key
        return bool(key and key.strip() and not key.startswith("your_gemini_api_key"))

    def _get_client(self) -> genai.Client:
        """Obtain or initialize the official Google Gen AI client."""
        if not self.is_configured():
            raise AIProviderError(
                provider_id=self.provider_id,
                error_type=AIErrorType.CONFIGURATION_ERROR,
                message="GEMINI_API_KEY is not configured on the backend server. Please set it in backend/.env.",
                status_code=503,
                retryable=False,
            )

        key = self.api_key
        # Reuse existing client if key hasn't changed
        if self._client is None:
            self._client = genai.Client(api_key=key)
        return self._client

    def get_health(self) -> ProviderHealth:
        """Evaluate provider configuration health."""
        if not self.is_configured():
            return ProviderHealth(
                provider_id=self.provider_id,
                display_name=self.display_name,
                configured=False,
                status="not_configured",
                message="GEMINI_API_KEY is not configured on the backend server.",
            )

        return ProviderHealth(
            provider_id=self.provider_id,
            display_name=self.display_name,
            configured=True,
            status="ready",
            message=f"Gemini provider configured using model {self.model_name}.",
        )

    def _convert_messages(self, messages: List[ChatMessage]) -> List[types.Content]:
        """Convert standard ChatMessage objects into GenAI Content structures.

        Enforces Google GenAI multi-turn invariants:
        - Drops any initial assistant turns so conversation strictly begins with 'user'.
        - Collapses consecutive turns of the same role into a single Content turn.
        - Preserves conversational context across alternating user-model turns.
        """
        # 1. Skip any initial assistant greetings or prompts
        first_user_idx = next((i for i, m in enumerate(messages) if m.role == "user"), None)
        if first_user_idx is None:
            return []

        filtered: List[ChatMessage] = []
        # 2. Collect turns starting from the first user message
        for msg in messages[first_user_idx:]:
            if not msg.content or not msg.content.strip():
                continue
            if filtered and filtered[-1].role == msg.role:
                # Merge consecutive messages with same role
                filtered[-1] = ChatMessage(
                    role=filtered[-1].role,
                    content=f"{filtered[-1].content}\n\n{msg.content}",
                )
            else:
                filtered.append(msg)

        contents: List[types.Content] = []
        for msg in filtered:
            role = "model" if msg.role == "assistant" else "user"
            part = types.Part.from_text(text=msg.content)
            contents.append(types.Content(role=role, parts=[part]))
        return contents

    def _sanitize_log_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Strip any secrets, API keys, or sensitive citizen tokens before logging."""
        sanitized = {}
        for k, v in metadata.items():
            k_lower = k.lower()
            if any(secret in k_lower for secret in ["key", "secret", "token", "auth", "aadhaar", "password"]):
                continue
            sanitized[k] = v
        return sanitized

    def generate_chat_response(
        self,
        messages: List[ChatMessage],
        context: Optional[str] = None,
        language: str = "en",
        timeout_seconds: float = 15.0,
        citizen_context: Optional[Dict[str, Any]] = None,
    ) -> ChatResponse:
        """Generate a grounded, genuine AI response using Google Gemini."""
        if not messages:
            raise AIProviderError(
                provider_id=self.provider_id,
                error_type=AIErrorType.INVALID_RESPONSE,
                message="Cannot generate response for empty message list.",
                status_code=400,
                retryable=False,
            )

        client = self._get_client()
        system_instruction = build_system_instruction(
            language=language,
            citizen_context=citizen_context,
        )
        if context:
            system_instruction += f"\n\nADDITIONAL VERIFIED CONTEXT:\n{context}"

        genai_contents = self._convert_messages(messages)
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
            max_output_tokens=1024,
        )

        start_time = time.perf_counter()

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=genai_contents,
                config=config,
            )
        except APIError as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            err_code = getattr(e, "code", 500)
            err_str = str(e)

            # Classify Gemini API Errors
            if err_code in (401, 403) or "API_KEY_INVALID" in err_str or "INVALID_ARGUMENT" in err_str and "key" in err_str.lower():
                logger.error(
                    "Gemini authentication failure. Error: %s [latency=%.1fms]",
                    "Invalid API credentials",
                    latency_ms,
                )
                raise AIProviderError(
                    provider_id=self.provider_id,
                    error_type=AIErrorType.AUTH_ERROR,
                    message="Invalid or unauthorized Gemini API key. Please check your credentials.",
                    status_code=401,
                    retryable=False,
                    details={"code": err_code},
                ) from e

            if err_code == 429 or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                logger.warning(
                    "Gemini quota/rate limit exhausted [code=%s, latency=%.1fms]",
                    err_code,
                    latency_ms,
                )
                raise AIProviderError(
                    provider_id=self.provider_id,
                    error_type=AIErrorType.QUOTA_EXHAUSTED,
                    message="Gemini API rate limit or project quota reached. Please retry in a few moments.",
                    status_code=429,
                    retryable=False,
                    details={"code": err_code},
                ) from e

            if err_code in (500, 502, 503, 504) or "UNAVAILABLE" in err_str:
                logger.warning(
                    "Gemini transient server error [code=%s, latency=%.1fms]",
                    err_code,
                    latency_ms,
                )
                raise AIProviderError(
                    provider_id=self.provider_id,
                    error_type=AIErrorType.TRANSIENT_ERROR,
                    message="Temporary server failure contacting Gemini API. Please try again.",
                    status_code=503,
                    retryable=True,
                    details={"code": err_code},
                ) from e

            logger.error(
                "Gemini API unexpected error [code=%s, latency=%.1fms]: %s",
                err_code,
                latency_ms,
                err_str[:200],
            )
            raise AIProviderError(
                provider_id=self.provider_id,
                error_type=AIErrorType.INVALID_RESPONSE,
                message=f"Gemini API returned an unexpected error: {err_str[:120]}",
                status_code=500,
                retryable=False,
                details={"code": err_code},
            ) from e

        except (TimeoutError, Exception) as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            err_name = type(e).__name__
            err_str = str(e).lower()

            if "timeout" in err_name.lower() or "timeout" in err_str:
                logger.warning("Gemini request timed out [latency=%.1fms]", latency_ms)
                raise AIProviderError(
                    provider_id=self.provider_id,
                    error_type=AIErrorType.TIMEOUT,
                    message="Gemini request timed out. Please try again.",
                    status_code=504,
                    retryable=True,
                ) from e

            if "connection" in err_str or "connect" in err_name.lower():
                logger.warning("Gemini network connection failure [latency=%.1fms]", latency_ms)
                raise AIProviderError(
                    provider_id=self.provider_id,
                    error_type=AIErrorType.TRANSIENT_ERROR,
                    message="Network error connecting to Gemini API. Please check internet connection.",
                    status_code=503,
                    retryable=True,
                ) from e

            logger.error("Gemini unhandled exception: %s", err_name)
            raise AIProviderError(
                provider_id=self.provider_id,
                error_type=AIErrorType.INVALID_RESPONSE,
                message=f"Failed to communicate with Gemini: {str(e)[:100]}",
                status_code=500,
                retryable=False,
            ) from e

        latency_ms = (time.perf_counter() - start_time) * 1000

        # Validate Response Structure & Candidates
        candidates = getattr(response, "candidates", None)
        if candidates and len(candidates) > 0:
            candidate = candidates[0]
            finish_reason = getattr(candidate, "finish_reason", None)
            if finish_reason and str(finish_reason).upper() in ("SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "RECITATION"):
                logger.warning("Gemini response blocked by content policy: %s", finish_reason)
                raise AIProviderError(
                    provider_id=self.provider_id,
                    error_type=AIErrorType.SAFETY_BLOCKED,
                    message="The response was blocked by content safety filters.",
                    status_code=400,
                    retryable=False,
                    details={"finish_reason": str(finish_reason)},
                )

        text = getattr(response, "text", None)
        if not text or not text.strip():
            logger.warning("Gemini returned empty text response [latency=%.1fms]", latency_ms)
            raise AIProviderError(
                provider_id=self.provider_id,
                error_type=AIErrorType.EMPTY_RESPONSE,
                message="Gemini returned an empty response. Please rephrase your query.",
                status_code=502,
                retryable=False,
            )

        # Extract usage metadata if present
        usage_dict = None
        usage = getattr(response, "usage_metadata", None)
        if usage:
            usage_dict = {
                "prompt_token_count": getattr(usage, "prompt_token_count", None),
                "candidates_token_count": getattr(usage, "candidates_token_count", None),
                "total_token_count": getattr(usage, "total_token_count", None),
            }

        sanitized_log = self._sanitize_log_metadata({
            "provider": self.provider_id,
            "model": self.model_name,
            "latency_ms": round(latency_ms, 1),
            "tokens": usage_dict.get("total_token_count") if usage_dict else None,
        })
        logger.info("Gemini generation successful: %s", sanitized_log)

        return ChatResponse(
            content=text.strip(),
            provider_id=self.provider_id,
            model_id=self.model_name,
            latency_ms=round(latency_ms, 1),
            usage=usage_dict,
            metadata={"language": language},
        )
