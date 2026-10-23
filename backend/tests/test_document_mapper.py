"""Unit and integration tests for SevAIQ Cross-Scheme Document Mapper."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.document_mapper import normalize_document_name, map_scheme_documents
from app.schemas import DocumentMapperRequest

client = TestClient(app)


def test_documents_shared_across_multiple_schemes():
    """Verify mapper identifies reusable documents across multiple selected schemes."""
    payload = {
        "scheme_ids": ["pm-kisan", "pm-jay", "atal-pension-yojana"],
        "citizen_documents": ["Aadhaar Card"],
    }
    response = client.post("/api/documents/mapper", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["total_unique_required_documents"] == 5
    reusable = data["reusable_documents"]
    reusable_names = [d["canonical_name"] for d in reusable]

    # Aadhaar Card is required by all 3 schemes
    assert "Aadhaar Card" in reusable_names
    aadhaar = next(d for d in reusable if d["canonical_name"] == "Aadhaar Card")
    assert aadhaar["reusability_count"] == 3
    assert set(aadhaar["schemes_requiring"]) == {"pm-kisan", "pm-jay", "atal-pension-yojana"}

    # Mobile Number is required by all 3 schemes
    assert "Active Mobile Number" in reusable_names
    mobile = next(d for d in reusable if d["canonical_name"] == "Active Mobile Number")
    assert mobile["reusability_count"] == 3

    # Bank Passbook is required by pm-kisan and atal-pension-yojana
    assert "Bank Account Passbook" in reusable_names
    passbook = next(d for d in reusable if d["canonical_name"] == "Bank Account Passbook")
    assert passbook["reusability_count"] == 2
    assert set(passbook["schemes_requiring"]) == {"pm-kisan", "atal-pension-yojana"}


def test_documents_required_by_only_one_scheme():
    """Verify mapper separates single-scheme documents from reusable ones."""
    payload = {
        "scheme_ids": ["pm-kisan", "pm-jay"],
    }
    response = client.post("/api/documents/mapper", json=payload)
    assert response.status_code == 200
    data = response.json()

    single_docs = data["single_scheme_documents"]
    single_names = [d["canonical_name"] for d in single_docs]

    # Land ownership is unique to PM-KISAN in this pair
    assert "Land Ownership Document (RoR / Title Deed)" in single_names
    land = next(d for d in single_docs if d["canonical_name"] == "Land Ownership Document (RoR / Title Deed)")
    assert land["reusability_count"] == 1
    assert land["schemes_requiring"] == ["pm-kisan"]

    # Ration Card is unique to PM-JAY in this pair
    assert "Ration Card / Family ID" in single_names
    ration = next(d for d in single_docs if d["canonical_name"] == "Ration Card / Family ID")
    assert ration["reusability_count"] == 1
    assert ration["schemes_requiring"] == ["pm-jay"]


def test_available_versus_missing_documents():
    """Verify documents are correctly partitioned into available and missing lists."""
    payload = {
        "scheme_ids": ["pm-kisan", "pm-jay"],
        "citizen_documents": ["Aadhaar Card", "Bank Account Passbook"],
    }
    response = client.post("/api/documents/mapper", json=payload)
    assert response.status_code == 200
    data = response.json()

    available_names = [d["canonical_name"] for d in data["available_documents"]]
    missing_names = [d["canonical_name"] for d in data["missing_documents"]]

    assert "Aadhaar Card" in available_names
    assert "Bank Account Passbook" in available_names

    assert "Active Mobile Number" in missing_names
    assert "Land Ownership Document (RoR / Title Deed)" in missing_names
    assert "Ration Card / Family ID" in missing_names


def test_document_name_normalization_function():
    """Verify document normalization standardizes synonyms without confusing distinct types."""
    # Aadhaar variants
    assert normalize_document_name("Aadhaar Card")["canonical_name"] == "Aadhaar Card"
    assert normalize_document_name("Aadhaar Card of all family members")["canonical_name"] == "Aadhaar Card"
    assert normalize_document_name("UID / Aadhar")["canonical_name"] == "Aadhaar Card"

    # Passbook vs 6-Month Statement (must remain distinct)
    passbook_norm = normalize_document_name("Savings Bank Account Passbook with Auto-Debit facility")
    statement_norm = normalize_document_name("Bank Account Statement for past 6 months")
    assert passbook_norm["canonical_name"] == "Bank Account Passbook"
    assert statement_norm["canonical_name"] == "Bank Account Statement (6 Months)"
    assert passbook_norm["canonical_name"] != statement_norm["canonical_name"]

    # Land documents
    assert normalize_document_name("Land Ownership Record / Record of Rights (RoR) / Khasra-Khatauni")[
        "canonical_name"
    ] == "Land Ownership Document (RoR / Title Deed)"
    assert normalize_document_name("Land Title Deed / Patta (for Beneficiary-led Construction)")[
        "canonical_name"
    ] == "Land Ownership Document (RoR / Title Deed)"

    # Ration Card
    assert normalize_document_name("Ration Card / Family ID / NFSA Card")["canonical_name"] == "Ration Card / Family ID"


def test_empty_scheme_selection_validation():
    """Verify empty scheme_ids array triggers 400 or 422 error."""
    response = client.post("/api/documents/mapper", json={"scheme_ids": []})
    assert response.status_code in [400, 422]
    data = response.json()
    assert "detail" in data


def test_unknown_scheme_id_validation():
    """Verify non-existent scheme IDs return 404 Not Found."""
    payload = {
        "scheme_ids": ["pm-kisan", "fictional-scheme-789"],
    }
    response = client.post("/api/documents/mapper", json=payload)
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "fictional-scheme-789" in data["detail"]


def test_duplicate_scheme_ids_validation():
    """Verify duplicate scheme IDs in request return 400 Bad Request."""
    payload = {
        "scheme_ids": ["pm-kisan", "pm-kisan"],
    }
    response = client.post("/api/documents/mapper", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "duplicate" in data["detail"].lower()


def test_incomplete_or_unverified_scheme_requirements():
    """Verify schemes with empty required_documents are recorded in unverified_requirements."""
    mock_catalog = [
        {
            "id": "mock-incomplete-scheme",
            "title": "Mock Incomplete Scheme",
            "required_documents": [],  # Empty required documents
            "official_portal_url": "https://india.gov.in",
            "verification_source": "Official Portal",
        }
    ]
    req = DocumentMapperRequest(scheme_ids=["mock-incomplete-scheme"])
    result = map_scheme_documents(mock_catalog, req)

    assert len(result.unverified_requirements) == 1
    assert "mock-incomplete-scheme" in result.unverified_requirements[0]
    assert result.total_unique_required_documents == 0
    assert result.readiness_score.score_percentage == 100


def test_readiness_score_calculations_accuracy():
    """Verify transparent mathematical calculation of document readiness score."""
    # 3 schemes -> 5 total distinct required documents:
    # [Aadhaar, Mobile, Passbook, Land RoR, Ration Card]
    scheme_ids = ["pm-kisan", "pm-jay", "atal-pension-yojana"]

    # 1. 0 documents available -> 0%
    res0 = client.post("/api/documents/mapper", json={"scheme_ids": scheme_ids, "citizen_documents": []})
    assert res0.status_code == 200
    d0 = res0.json()["readiness_score"]
    assert d0["numerator"] == 0
    assert d0["denominator"] == 5
    assert d0["score_percentage"] == 0
    assert "Distinct Required Documents" in d0["formula"]
    assert "does not evaluate citizen statutory eligibility" in d0["disclaimer"]

    # 2. 2 documents available (Aadhaar, Passbook) -> 2/5 = 40%
    res2 = client.post(
        "/api/documents/mapper",
        json={"scheme_ids": scheme_ids, "citizen_documents": ["Aadhaar Card", "Bank Account Passbook"]},
    )
    assert res2.status_code == 200
    d2 = res2.json()["readiness_score"]
    assert d2["numerator"] == 2
    assert d2["denominator"] == 5
    assert d2["score_percentage"] == 40

    # 3. All 5 documents available -> 100%
    all_5 = [
        "Aadhaar Card",
        "Bank Account Passbook",
        "Active Mobile Number",
        "Land Ownership Record / RoR",
        "Ration Card",
    ]
    res5 = client.post("/api/documents/mapper", json={"scheme_ids": scheme_ids, "citizen_documents": all_5})
    assert res5.status_code == 200
    d5 = res5.json()["readiness_score"]
    assert d5["numerator"] == 5
    assert d5["denominator"] == 5
    assert d5["score_percentage"] == 100


def test_official_source_attribution_in_mapping_response():
    """Verify official government portal links and sources are included for all selected schemes."""
    payload = {
        "scheme_ids": ["pm-kisan", "pm-vishwakarma"],
    }
    response = client.post("/api/documents/mapper", json=payload)
    assert response.status_code == 200
    data = response.json()

    refs = data["official_source_references"]
    assert len(refs) == 2
    for ref in refs:
        assert ref["scheme_id"] in ["pm-kisan", "pm-vishwakarma"]
        assert ref["official_portal_url"].startswith("https://")
        assert ref["verification_source"] is not None


def test_profile_fallback_documents_integration():
    """Verify citizen_documents falls back to profile.available_documents when provided."""
    payload = {
        "scheme_ids": ["pm-kisan"],
        "citizen_documents": [],
        "profile": {
            "age": 40,
            "available_documents": ["Aadhaar Card", "Bank Account Passbook"],
        },
    }
    response = client.post("/api/documents/mapper", json=payload)
    assert response.status_code == 200
    data = response.json()

    available = [d["canonical_name"] for d in data["available_documents"]]
    assert "Aadhaar Card" in available
    assert "Bank Account Passbook" in available
    assert data["readiness_score"]["numerator"] == 2
