"""Comprehensive test suite for SevAIQ Chatbot Action Layer and Registry.

Tests cover:
- Valid and invalid action requests
- Allowlist enforcement and prevention of arbitrary actions
- Scheme discovery across verified catalog (English and Tamil)
- Deterministic 3-valued eligibility guidance and follow-up generation
- Cross-scheme document mapping, deduplication, and readiness scoring
- Scheme Readiness Passport generation and validation
- Application guidance and user-recorded tracking separation
- Frontend-only action proposals (navigation, language, kiosk purge confirmation)
- Conversational /api/chat action detection and Gemini fallback resilience
- Official-source URL integrity and public kiosk data minimization
"""

import base64
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai.base import AIErrorType, AIProviderError, ChatResponse
from app.services.chat_actions import detect_action_intent, execute_chat_action

client = TestClient(app)


# ============================================================================
# 1. Action Registry and Allowlist Enforcement
# ============================================================================

def test_get_registered_actions_metadata():
    """Verify GET /api/chat/actions returns complete list of registered actions."""
    res = client.get("/api/chat/actions")
    assert res.status_code == 200
    actions = res.json()
    assert isinstance(actions, list)
    action_names = {a["action"] for a in actions}

    expected_actions = {
        "discover_schemes",
        "check_eligibility",
        "get_scheme_details",
        "map_documents",
        "generate_passport",
        "get_application_guidance",
        "navigate_to",
        "set_language",
        "clear_session",
        "speak_text",
    }
    assert expected_actions.issubset(action_names)

    # Check structure of metadata
    for a in actions:
        assert "action" in a
        assert "type" in a
        assert a["type"] in ("server", "client_side")
        assert "description" in a
        assert "parameters" in a


def test_unsupported_action_rejected():
    """Verify that arbitrary or unallowlisted actions are rejected with structured error."""
    payload = {
        "action": "execute_arbitrary_shell_command",
        "payload": {"command": "rm -rf /"},
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["action"] == "execute_arbitrary_shell_command"
    assert data["error"]["code"] == "UNSUPPORTED_ACTION"
    assert "not in the allowlist" in data["error"]["message"]


# ============================================================================
# 2. Scheme Discovery Tests (English & Tamil)
# ============================================================================

def test_discover_schemes_farming_query():
    """Verify discovering schemes with 'farming' keyword finds PM-KISAN."""
    payload = {
        "action": "discover_schemes",
        "payload": {"query": "farming"},
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["action"] == "discover_schemes"
    assert data["data"]["match_count"] >= 1
    scheme_ids = [s["id"] for s in data["data"]["schemes"]]
    assert "pm-kisan" in scheme_ids
    assert len(data["sources"]) >= 1
    assert data["sources"][0]["url"].startswith("https://")


def test_discover_schemes_tamil_language():
    """Verify discovering schemes in Tamil returns localized Tamil summary."""
    payload = {
        "action": "discover_schemes",
        "payload": {"query": "விவசாய"},
        "language": "ta",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "சரிபார்க்கப்பட்ட திட்டம்" in data["summary"]
    scheme_ids = [s["id"] for s in data["data"]["schemes"]]
    assert "pm-kisan" in scheme_ids


def test_discover_schemes_unmatched_query():
    """Verify unknown query returns clear notice and myscheme.gov.in guidance."""
    payload = {
        "action": "discover_schemes",
        "payload": {"query": "deep-sea submarine subsidy"},
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["match_count"] == 0
    assert "myscheme.gov.in" in data["summary"]


def test_discover_schemes_invalid_query_type():
    """Verify non-string query triggers validation error."""
    payload = {
        "action": "discover_schemes",
        "payload": {"query": 12345},
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_ARGUMENTS"


# ============================================================================
# 3. Deterministic Eligibility Guidance Tests (3-Valued Logic)
# ============================================================================

def test_check_eligibility_meets_known_criteria():
    """Verify eligible citizen profile satisfies PM-KISAN criteria."""
    payload = {
        "action": "check_eligibility",
        "payload": {
            "scheme_id": "pm-kisan",
            "profile": {
                "age": 40,
                "occupation": "farmer",
                "owns_cultivable_land": True,
                "annual_income": 120000,
                "is_tax_payer": False,
                "is_government_employee": False,
            },
        },
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["outcome"] == "meets_known_criteria"
    assert len(data["data"]["criteria_matched"]) >= 3
    assert len(data["data"]["criteria_not_met"]) == 0
    assert len(data["data"]["missing_information"]) == 0
    assert data["next_question"] is None
    # Crucial: Must clarify this is guidance, not final legal sanction
    assert "not guaranteed official approval" in data["summary"].lower()


def test_check_eligibility_does_not_meet_known_criteria():
    """Verify disqualifying criterion correctly marks citizen ineligible."""
    payload = {
        "action": "check_eligibility",
        "payload": {
            "scheme_id": "pm-kisan",
            "profile": {
                "age": 40,
                "occupation": "farmer",
                "owns_cultivable_land": True,
                "annual_income": 120000,
                "is_tax_payer": True,  # Disqualified under statutory guidelines
                "is_government_employee": False,
            },
        },
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["outcome"] == "does_not_meet_known_criteria"
    assert len(data["data"]["criteria_not_met"]) >= 1
    assert "tax payer" in data["data"]["criteria_not_met"][0].lower()


def test_check_eligibility_needs_verification_missing_answers():
    """Verify missing values are NEVER assumed false and generate a follow-up question."""
    payload = {
        "action": "check_eligibility",
        "payload": {
            "scheme_id": "pm-kisan",
            "profile": {
                "age": 35,
                "occupation": "farmer",
                "annual_income": 120000,
                # owns_cultivable_land is missing!
            },
        },
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["outcome"] == "needs_verification"
    assert len(data["data"]["missing_information"]) >= 1
    assert data["next_question"] is not None
    assert "cultivable" in data["next_question"].lower() or "land" in data["next_question"].lower()


def test_check_eligibility_tamil_followup_question():
    """Verify follow-up question in Tamil for missing landholding."""
    payload = {
        "action": "check_eligibility",
        "payload": {
            "scheme_id": "pm-kisan",
            "profile": {
                "age": 35,
                "occupation": "farmer",
                "annual_income": 120000,
                # owns_cultivable_land is missing!
            },
        },
        "language": "ta",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["next_question"] == "உங்களிடம் பயிரிடக்கூடிய விவசாய நிலம் உள்ளதா?"


def test_check_eligibility_unknown_scheme_id():
    """Verify checking eligibility for non-existent scheme returns SCHEME_NOT_FOUND."""
    payload = {
        "action": "check_eligibility",
        "payload": {
            "scheme_id": "invalid-nonexistent-scheme",
            "profile": {"age": 25},
        },
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "SCHEME_NOT_FOUND"


def test_check_eligibility_invalid_profile_type():
    """Verify negative income or out-of-range age fails validation cleanly."""
    payload = {
        "action": "check_eligibility",
        "payload": {
            "scheme_id": "pm-kisan",
            "profile": {"age": 200, "annual_income": -50000},
        },
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_ARGUMENTS"


def test_check_eligibility_all_schemes():
    """Verify evaluating all schemes when scheme_id is omitted."""
    payload = {
        "action": "check_eligibility",
        "payload": {
            "profile": {"age": 30, "occupation": "farmer", "owns_cultivable_land": True},
        },
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "total_schemes_evaluated" in data["data"]
    assert data["data"]["total_schemes_evaluated"] >= 8


# ============================================================================
# 4. Scheme Details Tests
# ============================================================================

def test_get_scheme_details_success():
    """Verify retrieving verified details for PM-JAY."""
    payload = {
        "action": "get_scheme_details",
        "payload": {"scheme_id": "pm-jay"},
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["id"] == "pm-jay"
    assert "National Health Authority" in data["data"].get("nodal_agency", "")
    assert len(data["sources"]) >= 1
    assert "pmjay.gov.in" in data["sources"][0]["url"]


def test_get_scheme_details_missing_id():
    """Verify error when scheme_id is not passed."""
    payload = {"action": "get_scheme_details", "payload": {}, "language": "en"}
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_ARGUMENTS"


# ============================================================================
# 5. Cross-Scheme Document Mapping Tests
# ============================================================================

def test_map_documents_multi_scheme():
    """Verify mapping documents across PM-KISAN and PM-JAY identifies reusability."""
    payload = {
        "action": "map_documents",
        "payload": {
            "scheme_ids": ["pm-kisan", "pm-jay"],
            "citizen_documents": ["Aadhaar Card"],
        },
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["total_unique_required_documents"] >= 3
    assert len(data["data"]["reusable_documents"]) >= 1
    assert "readiness_score" in data["data"]
    score = data["data"]["readiness_score"]
    assert 0 <= score["score_percentage"] <= 100
    assert len(data["sources"]) >= 1


def test_map_documents_empty_scheme_list():
    """Verify mapping with empty scheme list returns EMPTY_SCHEME_LIST."""
    payload = {
        "action": "map_documents",
        "payload": {"scheme_ids": []},
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "EMPTY_SCHEME_LIST"


# ============================================================================
# 6. Scheme Readiness Passport Tests
# ============================================================================

def test_generate_passport_success():
    """Verify valid passport request generates in-memory PDF."""
    payload = {
        "action": "generate_passport",
        "payload": {
            "scheme_ids": ["pm-kisan"],
            "profile": {
                "age": 42,
                "occupation": "farmer",
                "state": "Tamil Nadu",
                "owns_cultivable_land": True,
            },
            "citizen_documents": ["Aadhaar Card", "Bank Account Passbook"],
            "notes": "Citizen verified at e-Seva Kendra.",
        },
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["filename"] == "SevAIQ_Scheme_Passport.pdf"
    assert data["data"]["download_endpoint"] == "/api/passport/pdf"
    assert "pdf_base64" in data["data"]
    # Verify PDF base64 is valid PDF format
    pdf_bytes = base64.b64decode(data["data"]["pdf_base64"])
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 1000


def test_generate_passport_duplicate_schemes_rejected():
    """Verify duplicate scheme IDs in passport request are rejected."""
    payload = {
        "action": "generate_passport",
        "payload": {
            "scheme_ids": ["pm-kisan", "pm-kisan"],
            "profile": {"age": 40},
        },
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "DUPLICATE_SCHEME_IDS"


def test_generate_passport_missing_profile():
    """Verify passport generation without profile returns error."""
    payload = {
        "action": "generate_passport",
        "payload": {"scheme_ids": ["pm-kisan"]},
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_ARGUMENTS"


# ============================================================================
# 7. Application Guidance & User-Recorded Tracking Tests
# ============================================================================

def test_get_application_guidance_with_tracking():
    """Verify verified application steps and user-recorded tracking status."""
    payload = {
        "action": "get_application_guidance",
        "payload": {"scheme_id": "pm-mudra-yojana"},
        "language": "en",
        "citizen_context": {
            "tracking": {"pm-mudra-yojana": "Application submitted at Canara Bank"}
        },
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]["application_steps"]) >= 2
    assert data["data"]["user_recorded_status"] == "Application submitted at Canara Bank"
    # Must distinguish user notes from official portal status
    assert "reflects your own session notes" in data["data"]["portal_status_notice"]


# ============================================================================
# 8. Frontend-Only Action Proposals Tests
# ============================================================================

def test_frontend_navigate_to():
    """Verify navigate_to proposals are flagged as client_side execution."""
    payload = {
        "action": "navigate_to",
        "payload": {"target": "eligibility"},
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["target"] == "eligibility"
    assert data["data"]["execution"] == "client_side"
    assert data["requires_confirmation"] is False


def test_frontend_clear_session_requires_confirmation():
    """Verify clear_session mandates requires_confirmation=True for kiosk safety."""
    payload = {"action": "clear_session", "payload": {}, "language": "en"}
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["requires_confirmation"] is True
    assert data["data"]["execution"] == "client_side"


def test_frontend_set_language_tamil():
    """Verify language switch proposal to Tamil."""
    payload = {
        "action": "set_language",
        "payload": {"language": "ta"},
        "language": "ta",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["language"] == "ta"
    assert data["data"]["execution"] == "client_side"


# ============================================================================
# 9. Conversational /api/chat with Action Layer Integration
# ============================================================================

def test_chat_endpoint_automatic_action_intent_detection():
    """Verify conversational message triggers automatic action execution."""
    mock_resp = ChatResponse(
        content="You meet the age criteria for PM-KISAN, but need to verify landholding.",
        provider_id="gemini",
        model_id="gemini-2.5-flash",
        latency_ms=210.0,
    )

    with patch("app.main.get_ai_manager") as mock_get_mgr:
        mock_mgr = MagicMock()
        mock_mgr.generate_chat_response.return_value = mock_resp
        mock_get_mgr.return_value = mock_mgr

        payload = {
            "messages": [{"role": "user", "content": "Am I eligible for PM-KISAN?"}],
            "language": "en",
            "citizen_context": {
                "profile": {"age": 45, "occupation": "farmer"}
            },
        }
        res = client.post("/api/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        # Action result must be populated deterministically
        assert data["action_result"] is not None
        assert data["action_result"]["action"] == "check_eligibility"
        assert data["action_result"]["success"] is True
        assert data["action_result"]["data"]["scheme_id"] == "pm-kisan"
        assert "pm-kisan" in data["suggested_schemes"]


def test_chat_endpoint_gemini_fallback_to_action_summary():
    """Verify that when Gemini raises an AIProviderError during an action inquiry,
    the endpoint gracefully falls back to the deterministic action summary instead of failing.
    """
    with patch("app.main.get_ai_manager") as mock_get_mgr:
        mock_mgr = MagicMock()
        # Simulate AI timeout or error
        mock_mgr.generate_chat_response.side_effect = AIProviderError(
            provider_id="gemini",
            error_type=AIErrorType.TIMEOUT,
            message="Gemini request timed out after 15s",
            status_code=504,
            retryable=True,
        )
        mock_get_mgr.return_value = mock_mgr

        payload = {
            "messages": [{"role": "user", "content": "Am I eligible for PM-KISAN?"}],
            "language": "en",
            "citizen_context": {
                "profile": {
                    "age": 40,
                    "occupation": "farmer",
                    "owns_cultivable_land": True,
                    "annual_income": 120000,
                    "is_tax_payer": False,
                    "is_government_employee": False,
                }
            },
        }
        res = client.post("/api/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["provider"] == "deterministic-action-layer"
        assert data["action_result"] is not None
        assert data["action_result"]["action"] == "check_eligibility"
        assert data["action_result"]["data"]["outcome"] == "meets_known_criteria"
        assert "Based on your answers, you meet all known statutory criteria" in data["reply"]


# ============================================================================
# 10. Official Source Integrity & Data Minimization
# ============================================================================

def test_official_source_link_integrity():
    """Verify all official portal links returned in actions use HTTPS and official domains."""
    res = client.post("/api/chat/action", json={"action": "discover_schemes", "payload": {}})
    assert res.status_code == 200
    data = res.json()
    for source in data["sources"]:
        url = source["url"]
        assert url.startswith("https://")
        assert any(
            d in url for d in [".gov.in", ".nic.in", "nsdl.co.in", "nha.gov.in", "scholarships.gov.in", "mudra.org.in"]
        )


def test_intent_recognizer_helper():
    """Verify intent helper function patterns in English and Tamil."""
    # Eligibility in English
    act1, p1 = detect_action_intent("Am I eligible for PM Kisan?")
    assert act1 == "check_eligibility"
    assert p1.get("scheme_id") == "pm-kisan"

    # Eligibility in Tamil
    act2, p2 = detect_action_intent("நான் ஆயுஷ்மான் திட்டத்திற்கு தகுதியுடையவனா?")
    assert act2 == "check_eligibility"
    assert p2.get("scheme_id") == "pm-jay"

    # Documents in English
    act3, p3 = detect_action_intent("What documents are needed for PM-KISAN?")
    assert act3 == "map_documents"
    assert p3.get("scheme_ids") == ["pm-kisan"]

    # Clear session
    act4, _ = detect_action_intent("Please clear my data")
    assert act4 == "clear_session"


def test_action_aliases_and_camelcase_arguments():
    """Verify frontend uppercase action names and camelCase argument normalization."""
    # 1. SHOW_REQUIRED_DOCUMENTS with schemeId
    payload = {
        "action": "SHOW_REQUIRED_DOCUMENTS",
        "payload": {"schemeId": "pm-kisan"},
        "language": "en",
    }
    res = client.post("/api/chat/action", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["action"] == "map_documents"
    assert data["data"]["selected_scheme_ids"] == ["pm-kisan"]

    # 2. CHECK_ELIGIBILITY with schemeId
    payload2 = {
        "action": "CHECK_ELIGIBILITY",
        "payload": {
            "schemeId": "pm-kisan",
            "profile": {
                "age": 30,
                "occupation": "farmer",
                "annual_income": 100000,
                "owns_cultivable_land": True,
                "is_tax_payer": False,
                "is_government_employee": False,
            },
        },
        "language": "en",
    }
    res2 = client.post("/api/chat/action", json=payload2)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["success"] is True
    assert data2["action"] == "check_eligibility"
    assert data2["data"]["outcome"] == "meets_known_criteria"
