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


def test_health_endpoint():
    """Verify /api/health returns 200 and healthy status payload."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "SevAIQ Backend"
    assert data["version"] == "0.1.0"


def test_schemes_endpoint_initially_empty():
    """Verify /api/schemes returns an empty list before verified data is added."""
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
