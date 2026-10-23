"""SevAIQ FastAPI Application Entry Point.

Civic Intelligence platform for the Seva First Innovation Challenge 2026.
"""

import json
import logging
import os
from pathlib import Path
from collections import Counter
from typing import List, Optional

try:
    from dotenv import load_dotenv
    # Load from root .env and backend/.env if present
    root_env = Path(__file__).resolve().parent.parent.parent / ".env"
    backend_env = Path(__file__).resolve().parent.parent / ".env"
    if root_env.exists():
        load_dotenv(root_env)
    if backend_env.exists():
        load_dotenv(backend_env)
except ImportError:
    pass

logger = logging.getLogger("sevaiq.main")

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    CategoryCount,
    ChatMessage as SchemaChatMessage,
    ChatRequest,
    ChatResponseSchema,
    CitizenProfile,
    DocumentMapperRequest,
    DocumentMappingResponse,
    EligibilityCheckResponse,
    HealthResponse,
    PassportRequest,
    ProviderStatusSchema,
    Scheme,
    SchemeDetail,
)
from app.services.ai import AIProviderError, ChatMessage, get_ai_manager
from app.services.document_mapper import map_scheme_documents
from app.services.eligibility_engine import evaluate_all_schemes, evaluate_single_scheme
from app.services.passport_generator import generate_scheme_passport_pdf


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
        "categories": "/api/categories",
        "eligibility_check": "/api/eligibility/check",
        "document_mapper": "/api/documents/mapper",
        "passport_pdf": "/api/passport/pdf",
        "chat": "/api/chat",
        "chat_providers": "/api/chat/providers",
    }


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def get_health() -> HealthResponse:
    """Return application health status."""
    return HealthResponse(
        status="healthy",
        service="SevAIQ Backend",
        version="0.1.0",
    )


@app.get("/api/categories", response_model=List[CategoryCount], tags=["Schemes"])
def get_categories() -> List[CategoryCount]:
    """Retrieve distinct scheme categories and their verified scheme counts."""
    schemes_data = load_schemes_from_storage()
    if not schemes_data:
        return []

    category_counts = Counter(s.get("category") for s in schemes_data if s.get("category"))
    return [
        CategoryCount(category=cat, count=cnt)
        for cat, cnt in sorted(category_counts.items(), key=lambda x: (-x[1], x[0]))
    ]


@app.get("/api/schemes", response_model=List[Scheme], tags=["Schemes"])
def get_schemes(
    category: Optional[str] = Query(None, description="Filter schemes by category (case-insensitive)"),
    q: Optional[str] = Query(None, description="Search term for title, description, or ministry"),
) -> List[Scheme]:
    """Retrieve verified government schemes with optional category filtering and search.
    
    Returns verified schemes originating from official government portals.
    """
    schemes_data = load_schemes_from_storage()
    if not schemes_data:
        return []

    results = schemes_data
    if category:
        cat_lower = category.strip().lower()
        results = [s for s in results if cat_lower in s.get("category", "").lower()]

    if q:
        query_lower = q.strip().lower()
        results = [
            s for s in results
            if query_lower in s.get("title", "").lower()
            or query_lower in s.get("short_description", "").lower()
            or query_lower in s.get("ministry", "").lower()
        ]

    return results


@app.get("/api/schemes/{scheme_id}", response_model=SchemeDetail, tags=["Schemes"])
def get_scheme_by_id(scheme_id: str) -> SchemeDetail:
    """Retrieve full verified details, criteria, and document requirements for a scheme by ID."""
    schemes_data = load_schemes_from_storage()
    normalized_id = scheme_id.strip().lower()

    for scheme in schemes_data:
        if scheme.get("id", "").strip().lower() == normalized_id:
            return scheme

    raise HTTPException(
        status_code=404,
        detail=f"Scheme with ID '{scheme_id}' was not found in the verified catalog.",
    )


@app.post(
    "/api/eligibility/check",
    response_model=EligibilityCheckResponse,
    tags=["Eligibility"],
)
def check_eligibility(profile: CitizenProfile) -> EligibilityCheckResponse:
    """Evaluate a citizen profile against verified schemes using explainable three-valued logic.
    
    Returns transparent match outcomes ('meets_known_criteria',
    'does_not_meet_known_criteria', 'needs_verification') with criteria breakdown.
    """
    schemes_data = load_schemes_from_storage()
    return evaluate_all_schemes(schemes_data, profile)


@app.post(
    "/api/documents/mapper",
    response_model=DocumentMappingResponse,
    tags=["Documents"],
)
def get_document_mapping(request: DocumentMapperRequest) -> DocumentMappingResponse:
    """Analyze required documents across selected schemes, identify cross-scheme reusability,
    and calculate transparent citizen document-readiness score.
    """
    schemes_data = load_schemes_from_storage()
    return map_scheme_documents(schemes_data, request)


@app.post(
    "/api/passport/pdf",
    tags=["Passport"],
    summary="Generate and download SevAIQ Scheme Passport PDF",
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Downloadable SevAIQ Scheme Passport PDF",
        },
        400: {"description": "Empty scheme list or duplicate scheme IDs"},
        404: {"description": "Unknown scheme ID"},
        500: {"description": "PDF generation failure"},
    },
)
def generate_passport_pdf(request: PassportRequest) -> Response:
    """Generate and download a printable SevAIQ Scheme Passport PDF.
    
    Validates selected scheme IDs against the verified scheme catalog,
    computes explainable eligibility and cross-scheme document mapping,
    and returns an in-memory PDF without persisting citizen PII.
    """
    # 1. Validate empty scheme_ids
    if not request.scheme_ids or len(request.scheme_ids) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one scheme ID must be provided to generate a Scheme Passport.",
        )

    # 2. Validate duplicate scheme IDs
    seen_ids = set()
    duplicate_ids = []
    for sid in request.scheme_ids:
        norm_sid = sid.strip().lower()
        if norm_sid in seen_ids:
            duplicate_ids.append(sid)
        seen_ids.add(norm_sid)

    if duplicate_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate scheme IDs provided in request: {duplicate_ids}. Each scheme ID must be unique.",
        )

    # 3. Load catalog and resolve schemes
    schemes_data = load_schemes_from_storage()
    scheme_catalog = {s.get("id", "").strip().lower(): s for s in schemes_data}
    resolved_schemes = []

    for sid in request.scheme_ids:
        norm_sid = sid.strip().lower()
        if norm_sid not in scheme_catalog:
            raise HTTPException(
                status_code=404,
                detail=f"Scheme with ID '{sid}' was not found in the verified catalog.",
            )
        resolved_schemes.append(scheme_catalog[norm_sid])

    # 4. Compute eligibility outcomes internally (zero-trust of client)
    eligibility_results = [
        evaluate_single_scheme(s, request.profile) for s in resolved_schemes
    ]

    # 5. Compute document mapping internally (zero-trust of client)
    user_docs = (
        request.citizen_documents
        if request.citizen_documents is not None
        else request.profile.available_documents
    )
    doc_request = DocumentMapperRequest(
        scheme_ids=request.scheme_ids,
        citizen_documents=user_docs,
        profile=request.profile,
    )
    document_mapping = map_scheme_documents(schemes_data, doc_request)

    # 6. Generate PDF in-memory
    try:
        pdf_buffer = generate_scheme_passport_pdf(
            schemes=resolved_schemes,
            profile=request.profile,
            eligibility_results=eligibility_results,
            document_mapping=document_mapping,
            notes=request.notes,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate Scheme Passport PDF: {str(e)}",
        )

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="SevAIQ_Scheme_Passport.pdf"',
            "Content-Type": "application/pdf",
        },
    )


@app.get(
    "/api/chat/providers",
    response_model=List[ProviderStatusSchema],
    tags=["AI Chatbot"],
    summary="List available AI providers and operational status",
)
def get_ai_providers() -> List[ProviderStatusSchema]:
    """Retrieve configured AI providers and their operational health."""
    manager = get_ai_manager()
    statuses = manager.list_providers()
    return [
        ProviderStatusSchema(
            provider_id=s.provider_id,
            display_name=s.display_name,
            configured=s.configured,
            status=s.status,
            message=s.message,
        )
        for s in statuses
    ]


@app.post(
    "/api/chat",
    response_model=ChatResponseSchema,
    tags=["AI Chatbot"],
    summary="Chat with SevAIQ Civic Intelligence AI Assistant",
)
def chat_with_ai(request: ChatRequest) -> ChatResponseSchema:
    """Civic-grounded AI chatbot for welfare scheme discovery and guidance.
    
    Routes to the configured AI provider (Google Gemini) and grounds answers
    in SevAIQ's verified scheme records.
    """
    manager = get_ai_manager()
    try:
        response = manager.generate_chat_response(
            messages=[
                ChatMessage(role=m.role, content=m.content)
                for m in request.messages
            ],
            language=request.language or "en",
            focused_scheme_id=request.context_scheme_id,
        )
        return ChatResponseSchema(
            reply=response.content,
            provider=response.provider_id,
            model=response.model_id,
            status="success",
            latency_ms=response.latency_ms,
        )
    except AIProviderError as e:
        logger.error(
            "AI Chatbot error [%s]: %s (provider=%s, retryable=%s)",
            e.error_type.value,
            e.message,
            e.provider_id,
            e.retryable,
        )
        raise HTTPException(
            status_code=e.status_code,
            detail={
                "error_type": e.error_type.value,
                "message": e.message,
                "provider_id": e.provider_id,
                "retryable": e.retryable,
            },
        )




