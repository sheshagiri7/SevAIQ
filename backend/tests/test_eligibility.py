"""Tests for SevAIQ Explainable Government Scheme Eligibility Engine."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.eligibility_engine import evaluate_single_scheme
from app.schemas import CitizenProfile

client = TestClient(app)


def test_profile_meeting_known_criteria_farmer():
    """Verify a qualifying farmer profile produces 'meets_known_criteria' for PM-KISAN."""
    payload = {
        "age": 42,
        "state": "Karnataka",
        "residence_type": "rural",
        "occupation": "farmer",
        "owns_cultivable_land": True,
        "is_tax_payer": False,
        "annual_income": 120000,
    }
    response = client.post("/api/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_schemes_evaluated"] == 8

    pm_kisan = next(s for s in data["schemes"] if s["scheme_id"] == "pm-kisan")
    assert pm_kisan["outcome"] == "meets_known_criteria"
    assert len(pm_kisan["criteria_matched"]) >= 4
    assert len(pm_kisan["criteria_not_met"]) == 0
    assert len(pm_kisan["missing_information"]) == 0
    assert any("42" in r for r in pm_kisan["criteria_matched"])
    assert any("cultivable" in r.lower() for r in pm_kisan["criteria_matched"])
    assert "pmkisan.gov.in" in pm_kisan["official_portal_url"]


def test_profile_meeting_known_criteria_street_vendor():
    """Verify an urban street vendor profile matches PM SVANidhi."""
    payload = {
        "age": 30,
        "residence_type": "urban",
        "occupation": "street vendor",
    }
    response = client.post("/api/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()

    svanidhi = next(s for s in data["schemes"] if s["scheme_id"] == "pm-svanidhi")
    assert svanidhi["outcome"] == "meets_known_criteria"
    assert len(svanidhi["criteria_not_met"]) == 0
    assert any("urban" in r.lower() for r in svanidhi["criteria_matched"])


def test_profile_failing_known_criterion_age():
    """Verify age over 40 for Atal Pension Yojana results in 'does_not_meet_known_criteria'."""
    payload = {
        "age": 48,
        "is_tax_payer": False,
    }
    response = client.post("/api/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()

    apy = next(s for s in data["schemes"] if s["scheme_id"] == "atal-pension-yojana")
    assert apy["outcome"] == "does_not_meet_known_criteria"
    assert len(apy["criteria_not_met"]) >= 1
    assert any("exceeds the maximum" in r.lower() for r in apy["criteria_not_met"])
    assert any("disqualified" in r.lower() for r in apy["reasons"])


def test_profile_failing_known_criterion_location_mismatch():
    """Verify urban resident fails rural-only housing scheme PMAY-G."""
    payload = {
        "age": 35,
        "residence_type": "urban",
        "owns_pucca_house": False,
        "annual_income": 150000,
    }
    response = client.post("/api/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()

    pmay_g = next(s for s in data["schemes"] if s["scheme_id"] == "pmay-g")
    assert pmay_g["outcome"] == "does_not_meet_known_criteria"
    assert any("restricted to rural" in r.lower() for r in pmay_g["criteria_not_met"])


def test_missing_profile_fields_yields_needs_verification():
    """Verify missing critical fields yields 'needs_verification' rather than silent pass."""
    payload = {
        "age": 28,
        "occupation": "farmer",
        # owns_cultivable_land and is_tax_payer are omitted
    }
    response = client.post("/api/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()

    pm_kisan = next(s for s in data["schemes"] if s["scheme_id"] == "pm-kisan")
    assert pm_kisan["outcome"] == "needs_verification"
    assert len(pm_kisan["criteria_not_met"]) == 0
    assert len(pm_kisan["missing_information"]) >= 2
    assert any("landholding" in m.lower() for m in pm_kisan["missing_information"])
    assert any("tax payer" in m.lower() for m in pm_kisan["missing_information"])


def test_incomplete_scheme_criteria_yields_needs_verification():
    """Verify schemes with missing/empty criteria dictionary return needs_verification."""
    incomplete_scheme = {
        "id": "unverified-new-scheme",
        "title": "Unverified Test Scheme",
        "category": "Testing",
        "official_portal_url": "https://india.gov.in",
        "verification_source": "Pending",
        "eligibility_criteria": {},  # Incomplete criteria
    }
    profile = CitizenProfile(age=30, occupation="farmer")
    result = evaluate_single_scheme(incomplete_scheme, profile)

    assert result.outcome == "needs_verification"
    assert result.scheme_id == "unverified-new-scheme"
    assert any("incomplete or undergoing" in r.lower() for r in result.reasons)
    assert len(result.criteria_not_met) == 0


def test_invalid_profile_values_validation():
    """Verify malformed profile payloads return 422 Unprocessable Entity."""
    # Negative age
    res1 = client.post("/api/eligibility/check", json={"age": -10})
    assert res1.status_code == 422

    # Unreasonable age > 130
    res2 = client.post("/api/eligibility/check", json={"age": 180})
    assert res2.status_code == 422

    # Negative annual income
    res3 = client.post("/api/eligibility/check", json={"annual_income": -5000})
    assert res3.status_code == 422


def test_multiple_schemes_with_different_rules_evaluation():
    """Verify engine evaluates multiple diverse schemes with distinct rules accurately."""
    payload = {
        "age": 35,
        "residence_type": "rural",
        "occupation": "farmer",
        "owns_cultivable_land": True,
        "owns_pucca_house": False,
        "is_tax_payer": False,
        "annual_income": 100000,
    }
    response = client.post("/api/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()

    outcomes = {s["scheme_id"]: s["outcome"] for s in data["schemes"]}
    # PM-KISAN: Rural landholding non-taxpayer farmer -> meets_known_criteria
    assert outcomes["pm-kisan"] == "meets_known_criteria"
    # PMAY-G: Rural houseless, income 1L < 3L -> meets_known_criteria
    assert outcomes["pmay-g"] == "meets_known_criteria"
    # APY: Age 35 (18-40), non-taxpayer -> meets_known_criteria
    assert outcomes["atal-pension-yojana"] == "meets_known_criteria"
    # PMAY-U: Requires urban -> does_not_meet_known_criteria
    assert outcomes["pmay-u"] == "does_not_meet_known_criteria"
    # PM SVANidhi: Requires urban street vendor -> does_not_meet_known_criteria
    assert outcomes["pm-svanidhi"] == "does_not_meet_known_criteria"

    # Verify summary consistency
    summary = data["summary"]
    total = sum(summary.values())
    assert total == data["total_schemes_evaluated"] == 8


def test_empty_scheme_catalog_graceful_handling(monkeypatch):
    """Verify empty scheme catalog produces 200 OK with empty results without crashing."""
    monkeypatch.setattr("app.main.load_schemes_from_storage", lambda: [])
    response = client.post("/api/eligibility/check", json={"age": 25})
    assert response.status_code == 200
    data = response.json()
    assert data["total_schemes_evaluated"] == 0
    assert data["schemes"] == []
    assert data["summary"]["meets_known_criteria"] == 0


def test_official_source_references_in_results():
    """Verify all evaluated schemes include official portal URLs and verification sources."""
    response = client.post("/api/eligibility/check", json={"age": 25})
    assert response.status_code == 200
    data = response.json()

    for scheme in data["schemes"]:
        assert scheme["official_portal_url"] is not None
        assert scheme["official_portal_url"].startswith("https://")
        assert scheme["verification_source"] is not None
        assert len(scheme["verification_source"]) > 5


def test_pm_jay_senior_citizen_universal_coverage():
    """Verify senior citizens aged 70+ qualify for PM-JAY regardless of high income."""
    payload = {
        "age": 73,
        "annual_income": 1500000,  # ₹15 Lakh income normally exceeds BPL criteria
        "is_government_employee": False,
    }
    response = client.post("/api/eligibility/check", json=payload)
    assert response.status_code == 200
    data = response.json()

    pm_jay = next(s for s in data["schemes"] if s["scheme_id"] == "pm-jay")
    assert pm_jay["outcome"] == "meets_known_criteria"
    assert any("70+" in r or "Vay Vandana" in r for r in pm_jay["criteria_matched"])

