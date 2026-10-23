"""SevAIQ Cross-Scheme Document Mapper Service.

Analyzes document requirements across selected government schemes,
normalizes document names, identifies cross-scheme reusability,
and computes a transparent document-readiness score.
"""

from typing import Any, Dict, List, Set
from fastapi import HTTPException

from app.schemas import (
    CitizenProfile,
    DocumentMapperRequest,
    DocumentMappingResponse,
    MappedDocument,
    ReadinessScore,
)


def normalize_document_name(doc_name: str) -> Dict[str, str]:
    """Normalize a raw document requirement string into a canonical document name and category.
    
    Prevents false duplicates while accurately distinguishing document types
    even when secondary references exist (e.g. 'Bank Account Passbook (Aadhaar linked)'
    is categorized as Bank Account Passbook, not Aadhaar Card).
    """
    clean = doc_name.strip()
    lower = clean.lower()

    # 1. Bank Passbook (check before Aadhaar, as passbooks are often 'Aadhaar linked')
    if "passbook" in lower:
        return {
            "canonical_name": "Bank Account Passbook",
            "category": "Financial & Banking Records",
        }

    # 2. Bank Statement (6 months)
    if "bank statement" in lower or "statement for past" in lower or "statement (past" in lower:
        return {
            "canonical_name": "Bank Account Statement (6 Months)",
            "category": "Financial & Banking Records",
        }

    # 3. Mobile Number (check before Aadhaar, as numbers are often 'linked to Aadhaar')
    if "mobile" in lower or "phone" in lower:
        return {
            "canonical_name": "Active Mobile Number",
            "category": "Communications & OTP Verification",
        }

    # 4. Land Ownership / Records of Rights (RoR) / Khasra / Patta / Title Deed
    if (
        "land" in lower
        or "ror" in lower
        or "record of rights" in lower
        or "khasra" in lower
        or "patta" in lower
        or "title deed" in lower
        or "house site" in lower
    ):
        return {
            "canonical_name": "Land Ownership Document (RoR / Title Deed)",
            "category": "Property & Land Records",
        }

    # 5. Ration Card / Family ID
    if "ration" in lower or "family id" in lower or "nfsa" in lower:
        return {
            "canonical_name": "Ration Card / Family ID",
            "category": "Socioeconomic & Family Records",
        }

    # 6. Income Certificate / Form 16 / Salary Proof
    if "income certificate" in lower or "form 16" in lower or "salary" in lower or "income proof" in lower:
        return {
            "canonical_name": "Income Certificate / Proof of Income",
            "category": "Income & Tax Records",
        }

    # 7. PAN Card (standalone PAN, not composite ID)
    if "pan card" in lower or lower == "pan":
        return {
            "canonical_name": "PAN Card",
            "category": "Tax & Financial Identity",
        }

    # 8. MGNREGA Job Card
    if "mgnrega" in lower or "job card" in lower:
        return {
            "canonical_name": "MGNREGA Job Card",
            "category": "Rural Employment Records",
        }

    # 9. Street Vending Certificate / ID / Recommendation (CoV / LoR)
    if "vending" in lower or "cov" in lower or "recommendation" in lower or "lor" in lower:
        return {
            "canonical_name": "Certificate of Vending (CoV) / ULB Recommendation",
            "category": "Trade & Occupational Identity",
        }

    # 10. Business Address / Registration / Udyam
    if "udyam" in lower or "business address" in lower or "establishment" in lower:
        return {
            "canonical_name": "Business Address & Establishment Registration",
            "category": "Enterprise & Business Records",
        }

    # 11. Traditional Trade Self-Declaration
    if "self-declaration" in lower and ("trade" in lower or "artisan" in lower or "craft" in lower):
        return {
            "canonical_name": "Self-Declaration of Traditional Trade",
            "category": "Occupational Declarations",
        }

    # 12. Housing Affidavit (No pucca house)
    if "pucca house" in lower or "affidavit" in lower:
        return {
            "canonical_name": "Affidavit of No Pucca House Ownership",
            "category": "Housing Declarations",
        }

    # 13. Passport Photographs
    if "photo" in lower:
        return {
            "canonical_name": "Passport-size Photographs",
            "category": "Photographs",
        }

    # 14. Aadhaar / Primary National Identity
    if "aadhaar" in lower or "aadhar" in lower or "uid" in lower or "proof of identity" in lower:
        return {
            "canonical_name": "Aadhaar Card",
            "category": "Identity & Address Proof",
        }

    # Fallback to normalized title case
    return {
        "canonical_name": clean.title(),
        "category": "Supporting Documentation",
    }



def map_scheme_documents(
    schemes_data: List[Dict[str, Any]], request: DocumentMapperRequest
) -> DocumentMappingResponse:
    """Analyze and map documents required across a requested list of schemes."""
    # 1. Validate empty scheme_ids
    if not request.scheme_ids or len(request.scheme_ids) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one scheme ID must be provided for document mapping.",
        )

    # 2. Validate duplicate scheme_ids
    seen_ids: Set[str] = set()
    duplicate_ids: List[str] = []
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

    # 3. Resolve schemes and validate unknown IDs
    scheme_catalog = {s.get("id", "").strip().lower(): s for s in schemes_data}
    resolved_schemes: List[Dict[str, Any]] = []

    for sid in request.scheme_ids:
        norm_sid = sid.strip().lower()
        if norm_sid not in scheme_catalog:
            raise HTTPException(
                status_code=404,
                detail=f"Scheme with ID '{sid}' was not found in the verified catalog.",
            )
        resolved_schemes.append(scheme_catalog[norm_sid])

    # 4. Resolve citizen's available documents
    raw_user_docs = list(request.citizen_documents)
    if not raw_user_docs and request.profile and request.profile.available_documents:
        raw_user_docs = list(request.profile.available_documents)

    # Map citizen documents to canonical names for matching
    user_canonical_docs: Set[str] = set()
    for doc in raw_user_docs:
        norm = normalize_document_name(doc)
        user_canonical_docs.add(norm["canonical_name"])

    # 5. Extract and normalize required documents across resolved schemes
    canonical_docs_dict: Dict[str, Dict[str, Any]] = {}
    unverified_requirements: List[str] = []

    for scheme in resolved_schemes:
        sid = scheme.get("id")
        req_docs = scheme.get("required_documents")

        if not req_docs or not isinstance(req_docs, list) or len(req_docs) == 0:
            unverified_requirements.append(
                f"Scheme '{sid}' ({scheme.get('title')}) has no verified required documents indexed in the catalog."
            )
            continue

        for doc_str in req_docs:
            norm_info = normalize_document_name(doc_str)
            cname = norm_info["canonical_name"]

            if cname not in canonical_docs_dict:
                canonical_docs_dict[cname] = {
                    "canonical_name": cname,
                    "raw_names": set(),
                    "schemes_requiring": set(),
                    "category": norm_info["category"],
                }

            canonical_docs_dict[cname]["raw_names"].add(doc_str)
            canonical_docs_dict[cname]["schemes_requiring"].add(sid)

    # 6. Build MappedDocument items
    all_mapped_documents: List[MappedDocument] = []
    for cname, data in canonical_docs_dict.items():
        # Check if citizen has document either via canonical match or raw substring match
        is_available = cname in user_canonical_docs
        if not is_available:
            for raw_u in raw_user_docs:
                u_lower = raw_u.strip().lower()
                if any(u_lower in r.lower() or r.lower() in u_lower for r in data["raw_names"]):
                    is_available = True
                    break

        status = "available" if is_available else "missing"

        all_mapped_documents.append(
            MappedDocument(
                canonical_name=cname,
                raw_names=sorted(list(data["raw_names"])),
                schemes_requiring=sorted(list(data["schemes_requiring"])),
                reusability_count=len(data["schemes_requiring"]),
                status=status,
                category=data["category"],
            )
        )

    # Sort documents: highest reusability count first, then alphabetical by canonical name
    all_mapped_documents.sort(key=lambda d: (-d.reusability_count, d.canonical_name))

    # Segment documents
    reusable_documents = [d for d in all_mapped_documents if d.reusability_count >= 2]
    single_scheme_documents = [d for d in all_mapped_documents if d.reusability_count == 1]
    available_documents = [d for d in all_mapped_documents if d.status == "available"]
    missing_documents = [d for d in all_mapped_documents if d.status == "missing"]

    # 7. Compute readiness score using transparent formula
    # Denominator: Count of distinct unique required documents
    # Numerator: Count of distinct required documents available to citizen
    denominator = len(all_mapped_documents)
    numerator = len(available_documents)

    if denominator > 0:
        score_percentage = round((numerator / denominator) * 100)
    else:
        score_percentage = 100

    readiness = ReadinessScore(
        score_percentage=score_percentage,
        numerator=numerator,
        denominator=denominator,
        formula="(Available Distinct Required Documents / Total Unique Required Documents) * 100",
        disclaimer=(
            "This readiness score measures document preparedness based on unique required documents across the selected schemes. "
            "It does not evaluate citizen statutory eligibility or guarantee government benefit approval."
        ),
    )

    # 8. Build scheme summaries and official references
    scheme_summaries = [
        {"id": s.get("id"), "title": s.get("title")} for s in resolved_schemes
    ]
    official_references = [
        {
            "scheme_id": s.get("id"),
            "scheme_title": s.get("title"),
            "official_portal_url": s.get("official_portal_url"),
            "verification_source": s.get("verification_source"),
        }
        for s in resolved_schemes
    ]

    return DocumentMappingResponse(
        selected_scheme_ids=request.scheme_ids,
        selected_schemes_summary=scheme_summaries,
        total_unique_required_documents=denominator,
        reusable_documents=reusable_documents,
        single_scheme_documents=single_scheme_documents,
        available_documents=available_documents,
        missing_documents=missing_documents,
        unverified_requirements=unverified_requirements,
        readiness_score=readiness,
        official_source_references=official_references,
    )
