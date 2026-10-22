"""SevAIQ FastAPI Application Entry Point.

Civic Intelligence platform for the Seva First Innovation Challenge 2026.
"""

import json
import os
from pathlib import Path
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import HealthResponse, Scheme

app = FastAPI(
    title="SevAIQ API",
    description="Civic intelligence platform providing verified government scheme discovery.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS origins for local development
cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
)
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE_PATH = Path(__file__).resolve().parent / "data" / "schemes.json"


def load_schemes_from_storage() -> List[dict]:
    """Load scheme records from local JSON storage.
    
    Returns an empty list if file is absent, empty, or unverified.
    """
    if not DATA_FILE_PATH.exists():
        return []
    try:
        with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                return []
            data = json.loads(content)
            if isinstance(data, list):
                return data
            return []
    except Exception:
        return []


@app.get("/", tags=["Root"])
def root():
    """Welcome endpoint with service pointers."""
    return {
        "service": "SevAIQ Backend API",
        "challenge": "Seva First Innovation Challenge 2026",
        "docs": "/docs",
        "health": "/api/health",
        "schemes": "/api/schemes",
    }


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def get_health() -> HealthResponse:
    """Return application health status."""
    return HealthResponse(
        status="healthy",
        service="SevAIQ Backend",
        version="0.1.0",
    )


@app.get("/api/schemes", response_model=List[Scheme], tags=["Schemes"])
def get_schemes() -> List[Scheme]:
    """Retrieve verified government schemes.
    
    Returns an empty list until official-source verified schemes are added.
    """
    schemes_data = load_schemes_from_storage()
    return schemes_data
