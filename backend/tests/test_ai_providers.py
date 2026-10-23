"""Unit and integration tests for SevAIQ AI Providers and Chatbot Architecture."""

import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai.base import (
    AIErrorType,
    AIProviderError,
    BaseAIProvider,
    ChatMessage,
    ChatResponse,
    ProviderHealth,
)
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.grounding import (
    build_scheme_catalog_context,
    build_system_instruction,
    load_verified_schemes,
)
from app.services.ai.provider_manager import AIProviderManager


client = TestClient(app)


# =====================================================================
# 1. Grounding Engine Tests
# =====================================================================

def test_scheme_catalog_context_formatting():
    """Verify that verified scheme catalog is properly formatted for grounding."""
    context = build_scheme_catalog_context()
    assert "pm-kisan" in context.lower()
    assert "pm-jay" in context.lower()
    assert "pmay-g" in context.lower()
    assert "pmay-u" in context.lower()
    assert "atal-pension-yojana" in context.lower()
    assert "pm-mudra-yojana" in context.lower()
    assert "nsp-post-matric" in context.lower()
    assert "Official Portal:" in context
    assert "Verification Source:" in context


def test_grounding_contains_pmay_u_2_0_verticals():
    """Verify PMAY-U 2.0 framework and all 4 verticals are present in AI grounding."""
    context = build_scheme_catalog_context()
    assert "PMAY-U 2.0" in context
    assert "Beneficiary-Led Construction" in context or "BLC" in context
    assert "Affordable Housing in Partnership" in context or "AHP" in context
    assert "Affordable Rental Housing" in context or "ARH" in context
    assert "Interest Subsidy Scheme" in context or "ISS" in context
    assert "EWS" in context
    assert "LIG" in context
    assert "MIG" in context


def test_grounding_contains_mudra_tarun_plus_and_loan_rules():
    """Verify Mudra Tarun Plus tier and loan-vs-grant instructions are grounded."""
    context = build_scheme_catalog_context()
    assert "Tarun Plus" in context
    assert "₹20 Lakh" in context or "20,00,000" in context

    instruction = build_system_instruction(language="en")
    assert "DISTINCTION BETWEEN REPAYABLE LOANS AND WELFARE GRANTS" in instruction
    assert "NEVER describe the loan amount as free money" in instruction
    assert "Tarun Plus" in instruction
    assert "PMAY-U 2.0" in instruction


def test_grounding_contains_nsp_post_matric():
    """Verify NSP Post-Matric Scholarship is present in catalog context."""
    context = build_scheme_catalog_context()
    assert "nsp-post-matric" in context
    assert "scholarships.gov.in" in context
    assert "Post-Matric Scholarship" in context


def test_system_instruction_tamil_and_english():
    """Verify bilingual instructions and core civic-tech principles."""
    en_prompt = build_system_instruction(language="en")
    assert "SevAIQ Civic Intelligence Assistant" in en_prompt
    assert "simple ENGLISH" in en_prompt
    assert "TRUTHFULNESS & GROUNDING" in en_prompt
    assert "CITIZEN PRIVACY" in en_prompt
    assert "https://myscheme.gov.in" in en_prompt

    ta_prompt = build_system_instruction(language="ta")
    assert "TAMIL (தமிழ்)" in ta_prompt
    assert "விவசாயி" in ta_prompt


# =====================================================================
# 2. Gemini Provider Unit Tests
# =====================================================================

def test_gemini_provider_unconfigured():
    """Provider reports not_configured when no API key is set."""
    provider = GeminiProvider(api_key="")
    assert not provider.is_configured()
    health = provider.get_health()
    assert health.status == "not_configured"
    assert not health.configured

    with pytest.raises(AIProviderError) as exc_info:
        provider.generate_chat_response([ChatMessage(role="user", content="Hello")])
    assert exc_info.value.error_type == AIErrorType.CONFIGURATION_ERROR
    assert exc_info.value.status_code == 503


def test_gemini_provider_default_and_custom_model_selection():
    """Verify gemini-3.5-flash-lite default model and configurable GEMINI_MODEL override."""
    with patch.dict(os.environ, {}, clear=True):
        provider = GeminiProvider(api_key="test-key")
        assert provider.model_name == "gemini-3.5-flash-lite"

    with patch.dict(os.environ, {"GEMINI_MODEL": "gemini-3.5-flash-lite", "GEMINI_API_KEY": "test-key"}):
        provider = GeminiProvider()
        assert provider.model_name == "gemini-3.5-flash-lite"
        assert provider.api_key == "test-key"
        assert provider.is_configured() is True

    with patch.dict(os.environ, {"GEMINI_MODEL": "gemini-2.5-pro"}):
        provider = GeminiProvider(api_key="test-key")
        assert provider.model_name == "gemini-2.5-pro"


def test_gemini_provider_success():
    """Provider returns genuine ChatResponse when Gemini API call succeeds."""
    provider = GeminiProvider(api_key="valid-test-key", model_name="gemini-2.5-flash")
    assert provider.is_configured()
    assert provider.get_health().status == "ready"

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "PM-KISAN provides ₹6,000 per year to eligible farmers."
    mock_candidate = MagicMock()
    mock_candidate.finish_reason = "STOP"
    mock_response.candidates = [mock_candidate]
    mock_response.usage_metadata.prompt_token_count = 150
    mock_response.usage_metadata.candidates_token_count = 25
    mock_response.usage_metadata.total_token_count = 175

    mock_client.models.generate_content.return_value = mock_response
    provider._client = mock_client

    messages = [ChatMessage(role="user", content="How much financial support does PM-KISAN offer?")]
    result = provider.generate_chat_response(messages=messages, language="en")

    assert isinstance(result, ChatResponse)
    assert result.provider_id == "gemini"
    assert result.model_id == "gemini-2.5-flash"
    assert "PM-KISAN" in result.content
    assert result.usage["total_token_count"] == 175
    assert result.latency_ms is not None


def test_gemini_provider_auth_error_classification():
    """Classify 401 / API_KEY_INVALID as AUTH_ERROR without retry."""
    from google.genai.errors import APIError

    provider = GeminiProvider(api_key="invalid-key")
    mock_client = MagicMock()
    api_err = APIError(code=400, response_json={"error": {"message": "API_KEY_INVALID"}})
    mock_client.models.generate_content.side_effect = api_err
    provider._client = mock_client

    with pytest.raises(AIProviderError) as exc_info:
        provider.generate_chat_response([ChatMessage(role="user", content="Test")])

    err = exc_info.value
    assert err.error_type == AIErrorType.AUTH_ERROR
    assert err.status_code == 401
    assert err.retryable is False


def test_gemini_provider_quota_exhausted_classification():
    """Classify 429 as QUOTA_EXHAUSTED without retry."""
    from google.genai.errors import APIError

    provider = GeminiProvider(api_key="valid-key")
    mock_client = MagicMock()
    api_err = APIError(code=429, response_json={"error": {"message": "RESOURCE_EXHAUSTED: Rate limit exceeded"}})
    mock_client.models.generate_content.side_effect = api_err
    provider._client = mock_client

    with pytest.raises(AIProviderError) as exc_info:
        provider.generate_chat_response([ChatMessage(role="user", content="Test")])

    err = exc_info.value
    assert err.error_type == AIErrorType.QUOTA_EXHAUSTED
    assert err.status_code == 429
    assert err.retryable is False


def test_gemini_provider_transient_error_classification():
    """Classify 503 UNAVAILABLE as retryable TRANSIENT_ERROR."""
    from google.genai.errors import APIError

    provider = GeminiProvider(api_key="valid-key")
    mock_client = MagicMock()
    api_err = APIError(code=503, response_json={"error": {"message": "UNAVAILABLE: Server overloaded"}})
    mock_client.models.generate_content.side_effect = api_err
    provider._client = mock_client

    with pytest.raises(AIProviderError) as exc_info:
        provider.generate_chat_response([ChatMessage(role="user", content="Test")])

    err = exc_info.value
    assert err.error_type == AIErrorType.TRANSIENT_ERROR
    assert err.status_code == 503
    assert err.retryable is True


def test_gemini_provider_timeout_classification():
    """Classify network timeout as retryable TIMEOUT error."""
    provider = GeminiProvider(api_key="valid-key")
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = TimeoutError("Request timed out after 15s")
    provider._client = mock_client

    with pytest.raises(AIProviderError) as exc_info:
        provider.generate_chat_response([ChatMessage(role="user", content="Test")])

    err = exc_info.value
    assert err.error_type == AIErrorType.TIMEOUT
    assert err.status_code == 504
    assert err.retryable is True


def test_gemini_provider_safety_blocked_classification():
    """Classify SAFETY finish reason as non-retryable SAFETY_BLOCKED error."""
    provider = GeminiProvider(api_key="valid-key")
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_candidate = MagicMock()
    mock_candidate.finish_reason = "SAFETY"
    mock_response.candidates = [mock_candidate]
    mock_response.text = ""
    mock_client.models.generate_content.return_value = mock_response
    provider._client = mock_client

    with pytest.raises(AIProviderError) as exc_info:
        provider.generate_chat_response([ChatMessage(role="user", content="Dangerous query")])

    err = exc_info.value
    assert err.error_type == AIErrorType.SAFETY_BLOCKED
    assert err.status_code == 400
    assert err.retryable is False


def test_gemini_provider_empty_response_classification():
    """Classify blank text as non-retryable EMPTY_RESPONSE error."""
    provider = GeminiProvider(api_key="valid-key")
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_candidate = MagicMock()
    mock_candidate.finish_reason = "STOP"
    mock_response.candidates = [mock_candidate]
    mock_response.text = "   "
    mock_client.models.generate_content.return_value = mock_response
    provider._client = mock_client

    with pytest.raises(AIProviderError) as exc_info:
        provider.generate_chat_response([ChatMessage(role="user", content="Hello")])

    err = exc_info.value
    assert err.error_type == AIErrorType.EMPTY_RESPONSE
    assert err.status_code == 502
    assert err.retryable is False


def test_gemini_sanitized_logging():
    """Verify secrets and citizen PII are excluded from usage logging."""
    provider = GeminiProvider(api_key="secret-key-12345")
    raw_metadata = {
        "api_key": "secret-key-12345",
        "authorization": "Bearer xyz",
        "aadhaar_number": "1234-5678-9012",
        "latency_ms": 320.5,
        "model": "gemini-2.5-flash",
    }
    sanitized = provider._sanitize_log_metadata(raw_metadata)
    assert "api_key" not in sanitized
    assert "authorization" not in sanitized
    assert "aadhaar_number" not in sanitized
    assert sanitized["latency_ms"] == 320.5
    assert sanitized["model"] == "gemini-2.5-flash"


# =====================================================================
# 3. Modular AI Provider Manager & Routing Policy Tests
# =====================================================================

class MockExtensionProvider(BaseAIProvider):
    """Mock secondary provider for testing multi-provider extension points."""

    def __init__(self, provider_id="anthropic", configured=True, response_text="Secondary answer"):
        self._id = provider_id
        self._configured = configured
        self._text = response_text

    @property
    def provider_id(self) -> str:
        return self._id

    @property
    def display_name(self) -> str:
        return f"Mock {self._id.capitalize()}"

    def is_configured(self) -> bool:
        return self._configured

    def get_health(self) -> ProviderHealth:
        return ProviderHealth(
            provider_id=self._id,
            display_name=self.display_name,
            configured=self._configured,
            status="ready" if self._configured else "not_configured",
            message="Mock status",
        )

    def generate_chat_response(self, messages, context=None, language="en", timeout_seconds=15.0):
        return ChatResponse(
            content=self._text,
            provider_id=self._id,
            model_id=f"{self._id}-v1",
            latency_ms=120.0,
        )


def test_manager_single_gemini_provider_unconfigured():
    """When only Gemini is registered and unconfigured, manager raises 503."""
    unconf_gemini = GeminiProvider(api_key="")
    manager = AIProviderManager(providers=[unconf_gemini])

    with pytest.raises(AIProviderError) as exc_info:
        manager.generate_chat_response([ChatMessage(role="user", content="Hi")])

    err = exc_info.value
    assert err.error_type == AIErrorType.CONFIGURATION_ERROR
    assert "Google Gemini is not configured" in err.message


def test_manager_bounded_retries_on_transient_error():
    """Manager performs bounded retry on retryable transient error then succeeds."""
    mock_gemini = MagicMock(spec=BaseAIProvider)
    mock_gemini.provider_id = "gemini"
    mock_gemini.display_name = "Google Gemini"
    mock_gemini.is_configured.return_value = True

    # 1st attempt: transient 503; 2nd attempt: success
    transient_err = AIProviderError(
        provider_id="gemini",
        error_type=AIErrorType.TRANSIENT_ERROR,
        message="Transient gateway timeout",
        status_code=503,
        retryable=True,
    )
    success_resp = ChatResponse(
        content="Success on retry",
        provider_id="gemini",
        model_id="gemini-2.5-flash",
    )
    mock_gemini.generate_chat_response.side_effect = [transient_err, success_resp]

    manager = AIProviderManager(
        providers=[mock_gemini],
        priority=["gemini"],
        max_transient_retries=1,
    )

    resp = manager.generate_chat_response([ChatMessage(role="user", content="Hi")])
    assert resp.content == "Success on retry"
    assert mock_gemini.generate_chat_response.call_count == 2


def test_manager_does_not_retry_quota_exhausted():
    """Manager NEVER retries quota exhaustion requests indefinitely."""
    mock_gemini = MagicMock(spec=BaseAIProvider)
    mock_gemini.provider_id = "gemini"
    mock_gemini.display_name = "Google Gemini"
    mock_gemini.is_configured.return_value = True

    quota_err = AIProviderError(
        provider_id="gemini",
        error_type=AIErrorType.QUOTA_EXHAUSTED,
        message="Quota exceeded",
        status_code=429,
        retryable=False,
    )
    mock_gemini.generate_chat_response.side_effect = quota_err

    manager = AIProviderManager(
        providers=[mock_gemini],
        priority=["gemini"],
        max_transient_retries=2,
    )

    with pytest.raises(AIProviderError) as exc_info:
        manager.generate_chat_response([ChatMessage(role="user", content="Hi")])

    assert exc_info.value.error_type == AIErrorType.QUOTA_EXHAUSTED
    # Strictly called only ONCE (zero retries on quota exhaustion)
    assert mock_gemini.generate_chat_response.call_count == 1


def test_manager_routes_to_secondary_provider_when_configured():
    """When a legitimate secondary provider is configured, failover routes to it."""
    mock_gemini = MagicMock(spec=BaseAIProvider)
    mock_gemini.provider_id = "gemini"
    mock_gemini.display_name = "Google Gemini"
    mock_gemini.is_configured.return_value = True
    mock_gemini.generate_chat_response.side_effect = AIProviderError(
        provider_id="gemini",
        error_type=AIErrorType.QUOTA_EXHAUSTED,
        message="Gemini project quota exhausted",
        status_code=429,
        retryable=False,
    )

    secondary = MockExtensionProvider(provider_id="anthropic", response_text="Answer from Anthropic")

    manager = AIProviderManager(
        providers=[mock_gemini, secondary],
        priority=["gemini", "anthropic"],
    )

    resp = manager.generate_chat_response([ChatMessage(role="user", content="Tell me about PM-KISAN")])
    assert resp.provider_id == "anthropic"
    assert resp.content == "Answer from Anthropic"


# =====================================================================
# 4. HTTP API Endpoint Tests (/api/chat and /api/chat/providers)
# =====================================================================

def test_api_chat_providers_listing():
    """GET /api/chat/providers returns registered providers and statuses."""
    res = client.get("/api/chat/providers")
    assert res.status_code == 200
    providers = res.json()
    assert isinstance(providers, list)
    assert any(p["provider_id"] == "gemini" for p in providers)


def test_api_chat_endpoint_success():
    """POST /api/chat returns successful response when provider succeeds."""
    mock_resp = ChatResponse(
        content="PM-KISAN provides direct bank deposits of ₹2,000 every 4 months.",
        provider_id="gemini",
        model_id="gemini-2.5-flash",
        latency_ms=310.2,
    )

    with patch("app.main.get_ai_manager") as mock_get_mgr:
        mock_mgr = MagicMock()
        mock_mgr.generate_chat_response.return_value = mock_resp
        mock_get_mgr.return_value = mock_mgr

        payload = {
            "messages": [{"role": "user", "content": "How does PM-KISAN disburse payments?"}],
            "language": "en",
        }
        res = client.post("/api/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["provider"] == "gemini"
        assert "₹2,000" in data["reply"]


def test_api_chat_endpoint_unconfigured_error():
    """POST /api/chat returns 503 with structured detail when unconfigured."""
    with patch("app.main.get_ai_manager") as mock_get_mgr:
        mock_mgr = MagicMock()
        mock_mgr.generate_chat_response.side_effect = AIProviderError(
            provider_id="gemini",
            error_type=AIErrorType.CONFIGURATION_ERROR,
            message="GEMINI_API_KEY is not configured on the backend server.",
            status_code=503,
            retryable=False,
        )
        mock_get_mgr.return_value = mock_mgr

        payload = {
            "messages": [{"role": "user", "content": "Hello"}],
            "language": "en",
        }
        res = client.post("/api/chat", json=payload)
        assert res.status_code == 503
        detail = res.json()["detail"]
        assert detail["error_type"] == "configuration_error"
        assert "GEMINI_API_KEY" in detail["message"]
        assert detail["retryable"] is False


def test_api_chat_endpoint_quota_error():
    """POST /api/chat returns 429 when quota is exhausted."""
    with patch("app.main.get_ai_manager") as mock_get_mgr:
        mock_mgr = MagicMock()
        mock_mgr.generate_chat_response.side_effect = AIProviderError(
            provider_id="gemini",
            error_type=AIErrorType.QUOTA_EXHAUSTED,
            message="Gemini project quota exhausted. Please retry later.",
            status_code=429,
            retryable=False,
        )
        mock_get_mgr.return_value = mock_mgr

        payload = {
            "messages": [{"role": "user", "content": "Hello"}],
            "language": "en",
        }
        res = client.post("/api/chat", json=payload)
        assert res.status_code == 429
        detail = res.json()["detail"]
        assert detail["error_type"] == "quota_exhausted"
        assert detail["retryable"] is False
