"""Unit and integration tests for verified scheme discovery in SevAIQ."""

import re
import pytest
from fastapi.testclient import TestClient

from app.main import app, load_schemes_from_storage
from app.schemas import CategoryCount, Scheme, SchemeDetail

client = TestClient(app)


def test_scheme_listing_populated_catalog():
    """Verify /api/schemes returns all verified schemes and matches the Scheme schema."""
    response = client.get("/api/schemes")
    assert response.status_code == 200
    schemes = response.json()
    assert isinstance(schemes, list)
    assert len(schemes) == 9, f"Expected 9 verified schemes, found {len(schemes)}"

    # Validate each scheme conforms to the frontend Scheme interface
    required_keys = {"id", "title", "short_description", "category", "ministry", "verified"}
    for scheme in schemes:
        assert required_keys.issubset(scheme.keys())
        assert scheme["verified"] is True
        assert scheme["id"] in [
            "pm-kisan",
            "pm-jay",
            "pmay-g",
            "pmay-u",
            "atal-pension-yojana",
            "pm-mudra-yojana",
            "pm-vishwakarma",
            "pm-svanidhi",
            "nsp-post-matric",
        ]


def test_retrieve_scheme_by_id_success():
    """Verify /api/schemes/{id} returns complete detailed scheme metadata."""
    response = client.get("/api/schemes/pm-kisan")
    assert response.status_code == 200
    scheme = response.json()

    assert scheme["id"] == "pm-kisan"
    assert "PM-KISAN" in scheme["title"]
    assert scheme["category"] == "Agriculture & Rural"
    assert scheme["ministry"] == "Ministry of Agriculture and Farmers Welfare"
    assert scheme["official_portal_url"] == "https://pmkisan.gov.in"
    assert scheme["verified"] is True
    assert scheme["verification_date"] == "2024-02-28"
    assert "detailed_benefits" in scheme
    assert "₹6,000" in scheme["detailed_benefits"]
    assert isinstance(scheme["required_documents"], list)
    assert len(scheme["required_documents"]) > 0
    assert any("Aadhaar" in doc for doc in scheme["required_documents"])
    assert any("Land" in doc for doc in scheme["required_documents"])


def test_pmay_u_2_0_verticals_and_criteria():
    """Verify PMAY-U 2.0 framework details, 4 verticals, and income categories."""
    response = client.get("/api/schemes/pmay-u")
    assert response.status_code == 200
    scheme = response.json()

    assert scheme["id"] == "pmay-u"
    assert "PMAY-U 2.0" in scheme["title"]
    assert scheme["category"] == "Housing & Infrastructure"
    assert scheme["official_portal_url"] == "https://pmay-urban.gov.in"
    assert scheme["verification_date"] == "2024-08-09"
    assert "2043924" in scheme["verification_source"]

    # Verify all 4 programme components / verticals are documented in benefits
    benefits = scheme["detailed_benefits"]
    assert "Beneficiary-Led Construction" in benefits or "BLC" in benefits
    assert "Affordable Housing in Partnership" in benefits or "AHP" in benefits
    assert "Affordable Rental Housing" in benefits or "ARH" in benefits
    assert "Interest Subsidy Scheme" in benefits or "ISS" in benefits

    # Verify income brackets and eligibility conditions
    eligibility = scheme["eligibility_summary"]
    assert "EWS" in eligibility
    assert "LIG" in eligibility
    assert "MIG" in eligibility
    assert "pucca house" in eligibility.lower()


def test_pm_mudra_yojana_tarun_plus_and_credit_classification():
    """Verify PM Mudra Yojana Tarun Plus category and institutional loan classification."""
    response = client.get("/api/schemes/pm-mudra-yojana")
    assert response.status_code == 200
    scheme = response.json()

    assert scheme["id"] == "pm-mudra-yojana"
    assert scheme["verification_date"] == "2024-10-24"
    assert "financialservices.gov.in" in scheme["official_portal_url"] or "mudra.org.in" in scheme["verification_source"]

    # Must be classified as a loan/credit scheme, not a grant or free handout
    benefits = scheme["detailed_benefits"]
    assert "repayable loans" in benefits.lower() or "micro-credit" in benefits.lower()
    assert "not a cash handout" in benefits.lower() or "not a" in benefits.lower()

    # Must document Shishu, Kishore, Tarun, and Tarun Plus
    assert "Shishu" in benefits
    assert "Kishore" in benefits
    assert "Tarun" in benefits
    assert "Tarun Plus" in benefits
    assert "₹20 Lakh" in benefits or "20 Lakh" in benefits

    # Tarun Plus requirement of prior successful Tarun loan repayment
    summary = scheme["eligibility_summary"]
    assert "previously availed and successfully repaid" in summary or "Tarun" in summary


def test_nsp_post_matric_scholarship_catalog_metadata():
    """Verify NSP Post-Matric Scholarship is properly indexed in backend catalog."""
    response = client.get("/api/schemes/nsp-post-matric")
    assert response.status_code == 200
    scheme = response.json()

    assert scheme["id"] == "nsp-post-matric"
    assert "Post-Matric Scholarship" in scheme["title"]
    assert scheme["category"] == "Education & Skilling"
    assert scheme["official_portal_url"] == "https://scholarships.gov.in"
    assert scheme["verified"] is True
    assert scheme["verification_date"] == "2024-07-01"

    # Criteria and documents
    assert "student" in scheme["eligibility_criteria"].get("occupations", [])
    assert scheme["eligibility_criteria"].get("max_income_limit") == 250000
    docs = scheme["required_documents"]
    assert any("Caste" in d for d in docs)
    assert any("Income" in d for d in docs)


def test_retrieve_scheme_by_id_case_insensitive():
    """Verify scheme lookup is case-insensitive (e.g., PM-JAY or pm-jay)."""
    response_lower = client.get("/api/schemes/pm-jay")
    response_upper = client.get("/api/schemes/PM-JAY")
    assert response_lower.status_code == 200
    assert response_upper.status_code == 200
    assert response_lower.json()["id"] == response_upper.json()["id"] == "pm-jay"


def test_retrieve_unknown_scheme_id_404():
    """Verify /api/schemes/{id} returns consistent 404 for non-existent scheme IDs."""
    response = client.get("/api/schemes/non-existent-fake-scheme-999")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


def test_category_counts_endpoint():
    """Verify /api/categories returns distinct categories with accurate counts."""
    response = client.get("/api/categories")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    assert len(categories) > 0

    # Ensure each entry conforms to CategoryCount schema
    total_schemes_in_categories = 0
    category_names = []
    for cat in categories:
        assert "category" in cat
        assert "count" in cat
        assert isinstance(cat["count"], int)
        assert cat["count"] > 0
        total_schemes_in_categories += cat["count"]
        category_names.append(cat["category"])

    assert total_schemes_in_categories == 9
    assert "Agriculture & Rural" in category_names
    assert "Healthcare & Wellness" in category_names
    assert "Housing & Infrastructure" in category_names
    assert "Social Security & Pensions" in category_names
    assert "Education & Skilling" in category_names


def test_scheme_filtering_by_category():
    """Verify /api/schemes?category=... filters schemes properly."""
    response = client.get("/api/schemes?category=Healthcare")
    assert response.status_code == 200
    schemes = response.json()
    assert len(schemes) == 1
    assert schemes[0]["id"] == "pm-jay"


def test_scheme_search_query():
    """Verify /api/schemes?q=... performs search over title, description, and ministry."""
    response = client.get("/api/schemes?q=vendor")
    assert response.status_code == 200
    schemes = response.json()
    assert len(schemes) == 1
    assert schemes[0]["id"] == "pm-svanidhi"


def test_official_source_metadata_verification():
    """Verify every scheme in storage has verified official source metadata and URL."""
    schemes = load_schemes_from_storage()
    assert len(schemes) == 9

    date_regex = re.compile(r"^\d{4}-\d{2}-\d{2}$")

    for scheme in schemes:
        scheme_id = scheme.get("id")
        # Every scheme must be verified
        assert scheme.get("verified") is True, f"Scheme {scheme_id} must be marked verified"
        
        # Every scheme must have an official government portal URL starting with https://
        url = scheme.get("official_portal_url")
        assert url is not None and url.startswith("https://"), (
            f"Scheme {scheme_id} must have a valid HTTPS official portal URL"
        )
        assert ".gov.in" in url or ".nic.in" in url or ".org.in" in url or ".nsdl.co.in" in url, (
            f"Scheme {scheme_id} URL {url} must point to a legitimate official government portal"
        )

        # Every scheme must specify its official verification citation
        source = scheme.get("verification_source")
        assert source is not None and len(source) > 10, (
            f"Scheme {scheme_id} must have an official verification source citation"
        )

        # Every scheme must have a genuine verification date in YYYY-MM-DD format
        vdate = scheme.get("verification_date")
        assert vdate is not None and date_regex.match(vdate), (
            f"Scheme {scheme_id} must record a valid verification date format"
        )
        # Placeholder blanket date '2026-10-22' must not be used
        assert vdate != "2026-10-22", (
            f"Scheme {scheme_id} must not use placeholder date '2026-10-22'"
        )

        # Every scheme must specify required documents
        docs = scheme.get("required_documents")
        assert isinstance(docs, list) and len(docs) > 0, (
            f"Scheme {scheme_id} must list verified required documents"
        )


def test_invalid_scheme_fields_handling(monkeypatch):
    """Verify Pydantic validation flags missing or invalid scheme fields in storage."""
    from pydantic import ValidationError

    invalid_scheme = {
        "id": "broken-scheme",
        # "title" is missing
        "short_description": "Test description",
        "category": "Testing",
        "ministry": "Ministry of Testing",
    }

    # Verify Pydantic strictly rejects incomplete scheme records
    with pytest.raises(ValidationError) as exc_info:
        Scheme(**invalid_scheme)
    assert "title" in str(exc_info.value)

    # Verify FastAPI response validation blocks corrupted records from reaching clients
    client_no_raise = TestClient(app, raise_server_exceptions=False)
    monkeypatch.setattr("app.main.load_schemes_from_storage", lambda: [invalid_scheme])
    response = client_no_raise.get("/api/schemes")
    assert response.status_code == 500
