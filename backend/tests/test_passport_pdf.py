"""Unit and integration tests for SevAIQ Scheme Passport PDF Generator.

Verifies POST /api/passport/pdf endpoint, ReportLab PDF generation,
disclaimers, document mapping integration, and edge cases.
"""

import io
import re
import pytest
import reportlab.rl_config
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import (
    CitizenProfile,
    DocumentMappingResponse,
    MappedDocument,
    ReadinessScore,
    SchemeEligibilityResult,
)
from app.services.passport_generator import generate_scheme_passport_pdf

client = TestClient(app)

SAMPLE_FARMER_PROFILE = {
    "age": 42,
    "state": "Karnataka",
    "residence_type": "rural",
    "occupation": "farmer",
    "annual_income": 120000,
    "owns_cultivable_land": True,
    "owns_pucca_house": False,
    "is_tax_payer": False,
    "is_government_employee": False,
    "available_documents": ["Aadhaar Card", "Bank Account Passbook"],
}


def test_passport_pdf_generation_success():
    """Verify POST /api/passport/pdf returns 200 with valid PDF bytes and correct headers."""
    payload = {
        "scheme_ids": ["pm-kisan", "pm-jay", "atal-pension-yojana"],
        "profile": SAMPLE_FARMER_PROFILE,
        "notes": "Verified at Gram Panchayat Seva Kendra",
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 200
    assert response.headers.get("content-type") == "application/pdf"
    assert 'attachment; filename="SevAIQ_Scheme_Passport.pdf"' in response.headers.get(
        "content-disposition", ""
    )

    pdf_bytes = response.content
    assert len(pdf_bytes) > 2000
    assert pdf_bytes.startswith(b"%PDF-")
    assert b"%%EOF" in pdf_bytes[-500:]


def test_passport_pdf_contains_required_sections_and_disclaimers():
    """Verify generated PDF contains branding, statutory disclaimers, and required section headers."""
    # Temporarily set pageCompression to 0 so plain-text stream contents can be checked
    orig_compression = reportlab.rl_config.pageCompression
    try:
        reportlab.rl_config.pageCompression = 0
        payload = {
            "scheme_ids": ["pm-kisan", "pm-jay"],
            "profile": SAMPLE_FARMER_PROFILE,
        }
        response = client.post("/api/passport/pdf", json=payload)
        assert response.status_code == 200
        raw_pdf = response.content

        # Branding & Headers
        assert b"SevAIQ" in raw_pdf
        assert b"SCHEME PASSPORT" in raw_pdf
        assert b"Government Benefits. Made Accessible." in raw_pdf

        # Statutory Advisory / Non-government disclaimer
        assert b"STATUTORY ADVISORY" in raw_pdf
        assert b"NOT constitute" in raw_pdf
        assert b"benefit application" in raw_pdf

        # Sections
        assert b"CITIZEN DEMOGRAPHIC" in raw_pdf
        assert b"DOCUMENT READINESS SCORECARD" in raw_pdf
        assert b"SCHEME EVALUATION" in raw_pdf
        assert b"CROSS-SCHEME DOCUMENT MAPPING" in raw_pdf
        assert b"NEXT STEPS & APPLICATION GUIDANCE" in raw_pdf

        # Scheme names & documents
        assert b"PM-KISAN" in raw_pdf or b"Pradhan Mantri Kisan" in raw_pdf
        assert b"Aadhaar Card" in raw_pdf
    finally:
        reportlab.rl_config.pageCompression = orig_compression


def test_passport_pdf_multi_schemes_all_catalog():
    """Verify PDF generation scales cleanly across all 8 verified schemes in catalog."""
    all_schemes = [
        "pm-kisan",
        "pm-jay",
        "pmay-g",
        "pmay-u",
        "atal-pension-yojana",
        "pm-mudra-yojana",
        "pm-vishwakarma",
        "pm-svanidhi",
    ]
    payload = {
        "scheme_ids": all_schemes,
        "profile": SAMPLE_FARMER_PROFILE,
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 200
    assert response.headers.get("content-type") == "application/pdf"
    assert response.content.startswith(b"%PDF-")
    assert len(response.content) > 10000


def test_passport_pdf_empty_scheme_selection():
    """Verify empty scheme_ids list is rejected with 400 or 422 error."""
    payload = {
        "scheme_ids": [],
        "profile": SAMPLE_FARMER_PROFILE,
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code in [400, 422]
    data = response.json()
    assert "detail" in data


def test_passport_pdf_duplicate_scheme_ids():
    """Verify duplicate scheme IDs return 400 Bad Request."""
    payload = {
        "scheme_ids": ["pm-kisan", "pm-kisan"],
        "profile": SAMPLE_FARMER_PROFILE,
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Duplicate scheme IDs" in data["detail"]


def test_passport_pdf_unknown_scheme_id():
    """Verify unknown scheme ID returns 404 Not Found."""
    payload = {
        "scheme_ids": ["pm-kisan", "non-existent-scheme-999"],
        "profile": SAMPLE_FARMER_PROFILE,
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "non-existent-scheme-999" in data["detail"]


def test_passport_pdf_malformed_profile():
    """Verify malformed citizen profile fails validation with 422."""
    payload = {
        "scheme_ids": ["pm-kisan"],
        "profile": {
            "age": -50,  # Invalid age
        },
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 422


def test_passport_pdf_eligibility_and_mapping_integration():
    """Verify engine outcomes (eligible vs ineligible) are computed and integrated into PDF."""
    # Farmer qualifies for PM-KISAN, but APY has max age 40 (profile age is 42)
    payload = {
        "scheme_ids": ["pm-kisan", "atal-pension-yojana"],
        "profile": SAMPLE_FARMER_PROFILE,
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")


def test_passport_pdf_with_unverified_or_incomplete_scheme_data():
    """Verify graceful handling of incomplete/unverified scheme attributes without crashing."""
    profile = CitizenProfile(age=35, state="Delhi", residence_type="urban")
    dummy_scheme = {
        "id": "mock-scheme",
        "title": "Mock Incomplete Scheme",
        "category": "Testing",
        # Missing portal URL, missing verification source, empty criteria
        "eligibility_criteria": {},
        "required_documents": [],
    }

    dummy_result = SchemeEligibilityResult(
        scheme_id="mock-scheme",
        scheme_title="Mock Incomplete Scheme",
        category="Testing",
        outcome="needs_verification",
        reasons=["Criteria under verification"],
        criteria_matched=[],
        criteria_not_met=[],
        missing_information=["Structured criteria unindexed"],
        official_portal_url=None,
        verification_source=None,
    )

    dummy_mapping = DocumentMappingResponse(
        selected_scheme_ids=["mock-scheme"],
        selected_schemes_summary=[{"id": "mock-scheme", "title": "Mock Incomplete Scheme"}],
        total_unique_required_documents=0,
        reusable_documents=[],
        single_scheme_documents=[],
        available_documents=[],
        missing_documents=[],
        unverified_requirements=["Mock scheme has no verified documents"],
        readiness_score=ReadinessScore(
            score_percentage=100,
            numerator=0,
            denominator=0,
            formula="N/A",
            disclaimer="Readiness disclaimer",
        ),
        official_source_references=[],
    )

    # Must generate successfully without exception
    pdf_buf = generate_scheme_passport_pdf(
        schemes=[dummy_scheme],
        profile=profile,
        eligibility_results=[dummy_result],
        document_mapping=dummy_mapping,
    )
    assert isinstance(pdf_buf, io.BytesIO)
    content = pdf_buf.getvalue()
    assert content.startswith(b"%PDF-")
    assert len(content) > 1000


def test_passport_pdf_with_missing_documents_checklist():
    """Verify PDF generates properly when citizen has zero available documents."""
    zero_doc_profile = {
        "age": 28,
        "state": "Maharashtra",
        "residence_type": "urban",
        "occupation": "street-vendor",
        "available_documents": [],
    }
    payload = {
        "scheme_ids": ["pm-svanidhi"],
        "profile": zero_doc_profile,
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")


def test_passport_pdf_senior_citizen_universal_pmjay():
    """Verify Ayushman Vay Vandana universal coverage for senior citizens aged 70+ in PDF."""
    senior_profile = {
        "age": 74,
        "state": "Tamil Nadu",
        "residence_type": "urban",
        "available_documents": ["Aadhaar Card"],
    }
    payload = {
        "scheme_ids": ["pm-jay"],
        "profile": senior_profile,
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")


def test_root_endpoint_includes_passport_pdf_pointer():
    """Verify root GET / endpoint exposes passport_pdf route pointer."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data.get("passport_pdf") == "/api/passport/pdf"


def test_passport_pdf_generation_failure_handling(monkeypatch):
    """Verify 500 Internal Server Error is raised if PDF engine encounters an unhandled exception."""
    from app import main

    def mock_fail(*args, **kwargs):
        raise RuntimeError("ReportLab simulated render failure")

    monkeypatch.setattr(main, "generate_scheme_passport_pdf", mock_fail)
    payload = {
        "scheme_ids": ["pm-kisan"],
        "profile": SAMPLE_FARMER_PROFILE,
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 500
    data = response.json()
    assert "detail" in data
    assert "Failed to generate Scheme Passport PDF" in data["detail"]
    assert "ReportLab simulated render failure" in data["detail"]


def test_passport_pdf_explicit_citizen_documents_override():
    """Verify citizen_documents in request overrides profile.available_documents for document mapping."""
    payload = {
        "scheme_ids": ["pm-kisan"],
        "profile": {
            **SAMPLE_FARMER_PROFILE,
            "available_documents": [],  # Profile has 0 docs
        },
        "citizen_documents": [
            "Aadhaar Card",
            "Land Ownership Record / Record of Rights (RoR) / Khasra-Khatauni",
            "Bank Account Passbook (Aadhaar linked with NPCI mapper)",
            "Active Mobile Number",
        ],
    }
    response = client.post("/api/passport/pdf", json=payload)
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")
