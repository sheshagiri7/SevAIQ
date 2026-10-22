"""Pydantic models for SevAIQ Backend API."""

from typing import Optional
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
