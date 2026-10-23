"""Unit and integration tests for SevAIQ Backend API."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify root endpoint responds with basic service info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "SevAIQ Backend API" in data["service"]
    assert data["health"] == "/api/health"
    assert data["schemes"] == "/api/schemes"
    assert data["categories"] == "/api/categories"


def test_health_endpoint():
    """Verify /api/health returns 200 and healthy status payload."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "SevAIQ Backend"
    assert data["version"] == "0.1.0"


def test_schemes_endpoint_empty_fallback(monkeypatch):
    """Verify /api/schemes returns an empty list if storage is empty."""
    monkeypatch.setattr("app.main.load_schemes_from_storage", lambda: [])
    response = client.get("/api/schemes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0



def test_cors_headers_on_preflight():
    """Verify CORS middleware permits local frontend origins."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_headers_on_get_request():
    """Verify CORS headers are returned on standard GET requests from frontend."""
    headers = {"Origin": "http://localhost:5173"}
    response = client.get("/api/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_headers_on_alternate_origin():
    """Verify CORS middleware also permits 127.0.0.1 frontend origin."""
    headers = {"Origin": "http://127.0.0.1:5173"}
    response = client.get("/api/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://127.0.0.1:5173"


def test_health_response_schema():
    """Verify /api/health strictly adheres to HealthResponse fields."""
    response = client.get("/api/health")
    data = response.json()
    assert set(data.keys()) == {"status", "service", "version"}
    assert isinstance(data["status"], str)
    assert isinstance(data["service"], str)
    assert isinstance(data["version"], str)


def test_schemes_response_with_populated_data(monkeypatch):
    """Verify /api/schemes serializes and returns verified scheme data properly."""
    sample_scheme = {
        "id": "pm-kisan",
        "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "short_description": "Income support of Rs 6,000 per year.",
        "category": "Agriculture",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "beneficiary_type": "Small and Marginal Farmers",
        "official_portal_url": "https://pmkisan.gov.in",
        "verified": True,
        "verification_source": "Official Portal pmkisan.gov.in",
    }
    monkeypatch.setattr("app.main.load_schemes_from_storage", lambda: [sample_scheme])

    response = client.get("/api/schemes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "pm-kisan"
    assert data[0]["verified"] is True
    assert data[0]["official_portal_url"] == "https://pmkisan.gov.in"

