"""Pydantic models for SevAIQ Backend API."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response model for the health check endpoint."""
    status: str = Field(default="healthy", description="Service health status")
    service: str = Field(default="SevAIQ Backend", description="Service identifier")
    version: str = Field(default="0.1.0", description="API version")


class Scheme(BaseModel):
    """Data model for verified government schemes.
    
    Fields are designed for civic intelligence: government scheme details
    must originate from official, verified government portals.
    """
    id: str = Field(..., description="Unique scheme identifier (slug or code)")
    title: str = Field(..., description="Official title of the scheme")
    short_description: str = Field(..., description="Concise summary of benefits")
    category: str = Field(..., description="Domain/Sector (e.g., Agriculture, Healthcare, Education)")
    ministry: str = Field(..., description="Governing Ministry or Department")
    beneficiary_type: Optional[str] = Field(None, description="Target demographic / beneficiary group")
    official_portal_url: Optional[str] = Field(None, description="Official government portal link")
    verified: bool = Field(default=True, description="Official verification status flag")
    verification_source: Optional[str] = Field(None, description="Citation or official gazette/portal reference")


class SchemeDetail(Scheme):
    """Detailed verified government scheme information."""
    verification_date: Optional[str] = Field(None, description="Date scheme details were verified against official portal")
    nodal_agency: Optional[str] = Field(None, description="Implementing department or nodal agency")
    detailed_benefits: Optional[str] = Field(None, description="Full verified scheme benefits description")
    eligibility_summary: Optional[str] = Field(None, description="Human-readable summary of eligibility criteria")
    eligibility_criteria: Dict[str, Any] = Field(default_factory=dict, description="Structured verified eligibility rules")
    required_documents: List[str] = Field(default_factory=list, description="Verified mandatory documents required for application")
    application_mode: Optional[str] = Field(None, description="Official application channel or method")
    application_steps: List[str] = Field(default_factory=list, description="Verified step-by-step application instructions")


class CategoryCount(BaseModel):
    """Summary of scheme counts per category/sector."""
    category: str = Field(..., description="Sector / Domain category name")
    count: int = Field(..., description="Total verified schemes in this category")


class CitizenProfile(BaseModel):
    """Citizen demographic and socioeconomic profile for scheme matching."""
    age: Optional[int] = Field(None, ge=0, le=130, description="Age in completed years (0 to 130)")
    state: Optional[str] = Field(None, min_length=2, max_length=100, description="State or UT of residence")
    residence_type: Optional[str] = Field(None, description="Location environment ('rural' or 'urban')")
    occupation: Optional[str] = Field(None, max_length=100, description="Primary occupation or trade")
    annual_income: Optional[float] = Field(None, ge=0, description="Annual household income in INR")
    owns_cultivable_land: Optional[bool] = Field(None, description="Cultivable agricultural landholding status")
    owns_pucca_house: Optional[bool] = Field(None, description="Pucca house ownership status anywhere in India")
    is_tax_payer: Optional[bool] = Field(None, description="Income tax payer status in last assessment year")
    is_government_employee: Optional[bool] = Field(None, description="Government employment status")
    available_documents: List[str] = Field(default_factory=list, description="Documents currently available to citizen")


class SchemeEligibilityResult(BaseModel):
    """Explainable evaluation outcome for a single scheme."""
    scheme_id: str = Field(..., description="Unique scheme identifier")
    scheme_title: str = Field(..., description="Official title of the scheme")
    category: str = Field(..., description="Scheme sector/category")
    outcome: str = Field(
        ...,
        description="Outcome: 'meets_known_criteria', 'does_not_meet_known_criteria', or 'needs_verification'"
    )
    reasons: List[str] = Field(default_factory=list, description="Explainable rationale supporting outcome")
    criteria_matched: List[str] = Field(default_factory=list, description="Verified criteria satisfied")
    criteria_not_met: List[str] = Field(default_factory=list, description="Verified criteria failed/disqualified")
    missing_information: List[str] = Field(default_factory=list, description="Profile fields required to complete evaluation")
    official_portal_url: Optional[str] = Field(None, description="Official government scheme portal URL")
    verification_source: Optional[str] = Field(None, description="Official citation verifying eligibility rules")


class EligibilityCheckResponse(BaseModel):
    """Complete evaluation response across the scheme catalog."""
    total_schemes_evaluated: int = Field(..., description="Total schemes evaluated")
    summary: Dict[str, int] = Field(..., description="Counts by outcome status")
    schemes: List[SchemeEligibilityResult] = Field(..., description="Evaluated schemes with explainable outcomes")


class DocumentMapperRequest(BaseModel):
    """Input payload for cross-scheme document mapping."""
    scheme_ids: List[str] = Field(
        ...,
        min_length=1,
        description="List of unique scheme IDs to analyze (must not be empty)"
    )
    citizen_documents: List[str] = Field(
        default_factory=list,
        description="List of document names currently available to the citizen"
    )
    profile: Optional[CitizenProfile] = Field(
        None,
        description="Optional citizen profile; fallback document source if citizen_documents is empty"
    )


class MappedDocument(BaseModel):
    """Normalized document requirement with scheme associations."""
    canonical_name: str = Field(..., description="Normalized standard name of the document")
    raw_names: List[str] = Field(default_factory=list, description="Original requirement strings from scheme catalog")
    schemes_requiring: List[str] = Field(default_factory=list, description="Scheme IDs that require this document")
    reusability_count: int = Field(..., description="Number of selected schemes requiring this document")
    status: str = Field(..., description="Availability status: 'available', 'missing', or 'needs_verification'")
    category: str = Field(..., description="Document category/type (e.g. Identity, Financial, Property)")


class ReadinessScore(BaseModel):
    """Transparent document readiness metric across selected schemes."""
    score_percentage: int = Field(..., ge=0, le=100, description="Readiness percentage score (0-100)")
    numerator: int = Field(..., description="Number of distinct required documents available")
    denominator: int = Field(..., description="Total unique required documents across selected schemes")
    formula: str = Field(..., description="Mathematical formula used to calculate score")
    disclaimer: str = Field(..., description="Statement clarifying score measures preparedness, not official eligibility")


class DocumentMappingResponse(BaseModel):
    """Complete cross-scheme document analysis response."""
    selected_scheme_ids: List[str] = Field(..., description="Scheme IDs analyzed")
    selected_schemes_summary: List[Dict[str, str]] = Field(..., description="ID and title of analyzed schemes")
    total_unique_required_documents: int = Field(..., description="Total distinct required documents")
    reusable_documents: List[MappedDocument] = Field(..., description="Documents required by 2 or more schemes")
    single_scheme_documents: List[MappedDocument] = Field(..., description="Documents required by exactly 1 scheme")
    available_documents: List[MappedDocument] = Field(..., description="Required documents citizen has available")
    missing_documents: List[MappedDocument] = Field(..., description="Required documents citizen still needs")
    unverified_requirements: List[str] = Field(default_factory=list, description="Schemes with incomplete document records")
    readiness_score: ReadinessScore = Field(..., description="Preparedness score computation")
    official_source_references: List[Dict[str, str]] = Field(..., description="Official government citations for requirements")


class PassportRequest(BaseModel):
    """Input payload for generating a downloadable SevAIQ Scheme Passport PDF."""
    scheme_ids: List[str] = Field(
        ...,
        min_length=1,
        description="List of unique scheme IDs to include in the passport (must not be empty)",
    )
    profile: CitizenProfile = Field(
        ...,
        description="Citizen demographic and socioeconomic profile for statutory evaluation",
    )
    citizen_documents: Optional[List[str]] = Field(
        None,
        description="Optional list of documents available to citizen; falls back to profile.available_documents",
    )
    notes: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional citizen or operator notes to include in report",
    )


class ChatMessage(BaseModel):
    """Single chat turn in conversation."""
    role: Literal["user", "assistant", "system"] = Field(..., description="Speaker role")
    content: str = Field(..., min_length=1, description="Message text content")


class ChatRequest(BaseModel):
    """Payload for citizen AI chatbot conversations."""
    messages: List[ChatMessage] = Field(..., min_length=1, description="Conversation history turns")
    language: Optional[str] = Field("en", description="Target response language ('en' or 'ta')")
    context_scheme_id: Optional[str] = Field(None, description="Optional scheme ID for focused context")
    citizen_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Controlled, sanitized citizen context (profile, matches, documents, tracking)",
    )


class ChatResponseSchema(BaseModel):
    """AI chatbot response returned to the frontend."""
    reply: str = Field(..., description="Assistant textual answer")
    provider: str = Field(..., description="AI Provider ID (e.g. 'gemini')")
    model: str = Field(..., description="Model identifier used")
    status: Literal["success", "error"] = Field(..., description="Resolution status")
    latency_ms: Optional[float] = Field(None, description="Inference latency in milliseconds")
    error_type: Optional[str] = Field(None, description="Classified error type if failed")
    error_message: Optional[str] = Field(None, description="User-facing error message")
    suggested_schemes: Optional[List[str]] = Field(default_factory=list, description="IDs of relevant schemes mentioned")


class ProviderStatusSchema(BaseModel):
    """Health and configuration status of an AI Provider."""
    provider_id: str = Field(..., description="Unique provider ID")
    display_name: str = Field(..., description="Provider display name")
    configured: bool = Field(..., description="Whether API credentials are configured")
    status: Literal["ready", "not_configured", "quota_exhausted", "error"] = Field(
        ..., description="Current operational readiness"
    )
    message: str = Field(..., description="Descriptive status note")

