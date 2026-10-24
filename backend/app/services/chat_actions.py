"""SevAIQ Controlled Chatbot Action Layer and Registry.

Provides typed, deterministic execution for government welfare chatbot actions:
- Scheme discovery
- Statutory eligibility evaluation (3-valued logic, no false negatives)
- Scheme detail retrieval
- Cross-scheme document mapping & readiness scoring
- Scheme Readiness Passport PDF generation
- Verified official application guidance & progress tracking
- Frontend-only action proposals (navigation, language, kiosk session purge)

Civic intelligence principle: All scheme data, rules, documents, and links are
strictly sourced from verified government records; LLMs are used solely for
conversational phrasing and bilingual communication.
"""

import base64
import datetime
import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from pydantic import ValidationError

from app.schemas import (
    ChatActionResultSchema,
    CitizenProfile,
    DocumentMapperRequest,
    PassportRequest,
    SchemeDetail,
)
from app.services.document_mapper import map_scheme_documents
from app.services.eligibility_engine import evaluate_all_schemes, evaluate_single_scheme
from app.services.passport_generator import generate_scheme_passport_pdf

logger = logging.getLogger("sevaiq.chat_actions")

DATA_FILE_PATH = Path(__file__).resolve().parent.parent / "data" / "schemes.json"

SERVER_ACTIONS: Set[str] = {
    "discover_schemes",
    "check_eligibility",
    "get_scheme_details",
    "map_documents",
    "generate_passport",
    "get_application_guidance",
}

FRONTEND_ACTIONS: Set[str] = {
    "navigate_to",
    "set_language",
    "clear_session",
    "speak_text",
}

ALL_ACTIONS: Set[str] = SERVER_ACTIONS | FRONTEND_ACTIONS

SCHEME_ALIASES: Dict[str, str] = {
    "pm-kisan": "pm-kisan",
    "pmkisan": "pm-kisan",
    "kisan": "pm-kisan",
    "pm kisan": "pm-kisan",
    "கிசான்": "pm-kisan",
    "pm-jay": "pm-jay",
    "pmjay": "pm-jay",
    "ayushman": "pm-jay",
    "ayushman bharat": "pm-jay",
    "pm jay": "pm-jay",
    "ஆயுஷ்மான்": "pm-jay",
    "pmay-g": "pmay-g",
    "pmay gramin": "pmay-g",
    "awaas gramin": "pmay-g",
    "கிராமின்": "pmay-g",
    "pmay-u": "pmay-u",
    "pmay urban": "pmay-u",
    "awaas urban": "pmay-u",
    "நகர்ப்புற": "pmay-u",
    "atal-pension-yojana": "atal-pension-yojana",
    "atal pension": "atal-pension-yojana",
    "apy": "atal-pension-yojana",
    "பென்ஷன்": "atal-pension-yojana",
    "pm-mudra-yojana": "pm-mudra-yojana",
    "mudra": "pm-mudra-yojana",
    "pm mudra": "pm-mudra-yojana",
    "முத்ரா": "pm-mudra-yojana",
    "pm-vishwakarma": "pm-vishwakarma",
    "vishwakarma": "pm-vishwakarma",
    "pm vishwakarma": "pm-vishwakarma",
    "விஸ்வகர்மா": "pm-vishwakarma",
    "pm-svanidhi": "pm-svanidhi",
    "svanidhi": "pm-svanidhi",
    "pm svanidhi": "pm-svanidhi",
    "ஸ்வநிதி": "pm-svanidhi",
    "nsp-post-matric": "nsp-post-matric",
    "nsp": "nsp-post-matric",
    "scholarship": "nsp-post-matric",
    "post matric": "nsp-post-matric",
    "கல்வி உதவி": "nsp-post-matric",
}


def load_verified_schemes() -> List[Dict[str, Any]]:
    """Load verified government schemes from backend storage."""
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
    except Exception as e:
        logger.error("Failed to load verified schemes: %s", e)
        return []


def get_scheme_by_id(scheme_id: str, schemes: Optional[List[Dict[str, Any]]] = None) -> Optional[Dict[str, Any]]:
    """Resolve a scheme by exact or normalized ID."""
    catalog = schemes if schemes is not None else load_verified_schemes()
    norm = scheme_id.strip().lower()
    for s in catalog:
        if s.get("id", "").strip().lower() == norm:
            return s
    return None


def get_registered_actions_metadata() -> List[Dict[str, Any]]:
    """Return descriptive catalog of registered actions for API introspection."""
    return [
        {
            "action": "discover_schemes",
            "type": "server",
            "description": "Discover verified welfare schemes based on natural language query, sector category, or profile.",
            "parameters": {
                "query": {"type": "string", "required": False, "description": "Goal or sector keyword (e.g. farming, housing, pension)"},
                "category": {"type": "string", "required": False, "description": "Specific sector filter"},
                "profile": {"type": "CitizenProfile", "required": False, "description": "Optional demographics for pre-matching"},
            },
        },
        {
            "action": "check_eligibility",
            "type": "server",
            "description": "Evaluate statutory eligibility using explainable 3-valued deterministic logic.",
            "parameters": {
                "scheme_id": {"type": "string", "required": False, "description": "Scheme ID to evaluate. Evaluates all schemes if omitted."},
                "profile": {"type": "CitizenProfile", "required": True, "description": "Citizen profile demographic parameters"},
            },
        },
        {
            "action": "get_scheme_details",
            "type": "server",
            "description": "Retrieve full verified benefits, criteria, and official source citations for a single scheme.",
            "parameters": {
                "scheme_id": {"type": "string", "required": True, "description": "Unique scheme identifier"},
            },
        },
        {
            "action": "map_documents",
            "type": "server",
            "description": "Analyze cross-scheme document requirements, reusability, and calculate readiness score.",
            "parameters": {
                "scheme_ids": {"type": "list[string]", "required": True, "description": "List of selected scheme IDs"},
                "citizen_documents": {"type": "list[string]", "required": False, "description": "Documents citizen currently possesses"},
            },
        },
        {
            "action": "generate_passport",
            "type": "server",
            "description": "Generate a downloadable, in-memory SevAIQ Scheme Readiness Passport PDF.",
            "parameters": {
                "scheme_ids": {"type": "list[string]", "required": True, "description": "Unique scheme IDs to include in passport"},
                "profile": {"type": "CitizenProfile", "required": True, "description": "Citizen demographic profile"},
                "citizen_documents": {"type": "list[string]", "required": False, "description": "Citizen available documents"},
                "notes": {"type": "string", "required": False, "description": "Citizen notes (max 500 chars)"},
            },
        },
        {
            "action": "get_application_guidance",
            "type": "server",
            "description": "Retrieve verified official application steps and portal links, reflecting user-recorded status.",
            "parameters": {
                "scheme_id": {"type": "string", "required": True, "description": "Target scheme identifier"},
            },
        },
        {
            "action": "navigate_to",
            "type": "client_side",
            "description": "Request UI tab or screen navigation on frontend.",
            "parameters": {
                "target": {"type": "string", "required": True, "description": "Target UI section ('schemes', 'eligibility', 'documents', 'passport', 'tracking')"},
            },
        },
        {
            "action": "set_language",
            "type": "client_side",
            "description": "Request UI language switch ('en' or 'ta').",
            "parameters": {
                "language": {"type": "string", "required": True, "description": "Target language code ('en' or 'ta')"},
            },
        },
        {
            "action": "clear_session",
            "type": "client_side",
            "description": "Request kiosk session reset and local storage purge (requires confirmation).",
            "parameters": {
                "force": {"type": "boolean", "required": False, "description": "Bypass confirmation prompt if true"},
            },
        },
        {
            "action": "speak_text",
            "type": "client_side",
            "description": "Trigger client-side text-to-speech audio playback.",
            "parameters": {
                "text": {"type": "string", "required": True, "description": "Text to read aloud"},
                "language": {"type": "string", "required": False, "description": "Voice language code"},
            },
        },
    ]


# ---------------------------------------------------------------------------
# Server Action Handlers
# ---------------------------------------------------------------------------

def handle_discover_schemes(
    payload: Dict[str, Any],
    language: str = "en",
    citizen_context: Optional[Dict[str, Any]] = None,
) -> ChatActionResultSchema:
    """Discover schemes matching query, category, or profile."""
    query = payload.get("query")
    category = payload.get("category")

    if query is not None and not isinstance(query, str):
        return ChatActionResultSchema(
            success=False,
            action="discover_schemes",
            summary="Invalid search query provided.",
            data={},
            sources=[],
            error={"code": "INVALID_ARGUMENTS", "message": "Search query must be a string."},
        )

    schemes = load_verified_schemes()
    if not schemes:
        msg = "No verified schemes are currently loaded in the catalog." if language == "en" else "சரிபார்க்கப்பட்ட திட்டங்கள் தற்போது பட்டியலில் இல்லை."
        return ChatActionResultSchema(
            success=True,
            action="discover_schemes",
            summary=msg,
            data={"match_count": 0, "schemes": []},
            sources=[],
        )

    matched = schemes
    if category and isinstance(category, str):
        cat_lower = category.strip().lower()
        matched = [s for s in matched if cat_lower in s.get("category", "").lower()]

    if query and isinstance(query, str):
        q_lower = query.strip().lower()
        # Keyword mapping for common concepts
        keyword_targets: Dict[str, List[str]] = {
            "farm": ["pm-kisan"],
            "kisan": ["pm-kisan"],
            "விவசாய": ["pm-kisan"],
            "health": ["pm-jay"],
            "hospital": ["pm-jay"],
            "மருத்துவ": ["pm-jay"],
            "காப்பீடு": ["pm-jay"],
            "house": ["pmay-g", "pmay-u"],
            "housing": ["pmay-g", "pmay-u"],
            "வீடு": ["pmay-g", "pmay-u"],
            "pension": ["atal-pension-yojana"],
            "முதியோர்": ["atal-pension-yojana"],
            "loan": ["pm-mudra-yojana", "pm-svanidhi"],
            "credit": ["pm-mudra-yojana", "pm-svanidhi"],
            "கடன்": ["pm-mudra-yojana", "pm-svanidhi"],
            "artisan": ["pm-vishwakarma"],
            "craft": ["pm-vishwakarma"],
            "கைவினைஞர்": ["pm-vishwakarma"],
            "vendor": ["pm-svanidhi"],
            "street": ["pm-svanidhi"],
            "வியாபாரி": ["pm-svanidhi"],
            "student": ["nsp-post-matric"],
            "scholarship": ["nsp-post-matric"],
            "கல்வி": ["nsp-post-matric"],
        }
        boosted_ids = set()
        for kw, s_ids in keyword_targets.items():
            if kw in q_lower:
                boosted_ids.update(s_ids)

        filtered = []
        for s in matched:
            sid = s.get("id", "").lower()
            title = s.get("title", "").lower()
            desc = s.get("short_description", "").lower()
            cat = s.get("category", "").lower()
            minst = s.get("ministry", "").lower()

            if sid in boosted_ids or q_lower in title or q_lower in desc or q_lower in cat or q_lower in minst:
                filtered.append(s)

        matched = filtered

    sources: List[Dict[str, str]] = []
    summary_schemes = []
    for s in matched:
        summary_schemes.append({
            "id": s.get("id"),
            "title": s.get("title"),
            "category": s.get("category"),
            "ministry": s.get("ministry"),
            "short_description": s.get("short_description"),
            "official_portal_url": s.get("official_portal_url"),
            "verification_source": s.get("verification_source"),
        })
        if s.get("official_portal_url"):
            sources.append({
                "title": s.get("title", "Scheme Source"),
                "url": s.get("official_portal_url", ""),
                "verification_source": s.get("verification_source") or "Official Guidelines",
                "verification_date": s.get("verification_date") or "Official Record",
            })

    titles_str = ", ".join(s.get("title", "") for s in matched[:3])
    count = len(matched)

    if count == 0:
        if language == "ta":
            summary = (
                f"'{query}' தொடர்பான திட்டங்கள் SevAIQ-ல் காணப்படவில்லை. SevAIQ முக்கிய மத்திய திட்டங்களை மட்டுமே கொண்டுள்ளது. "
                "மேலும் திட்டங்களை https://myscheme.gov.in தளத்தில் சரிபார்க்கலாம்."
            )
        else:
            summary = (
                f"No verified schemes found matching '{query}'. SevAIQ currently indexes core verified welfare schemes. "
                "You can verify state or departmental initiatives at https://myscheme.gov.in."
            )
    else:
        if language == "ta":
            summary = (
                f"{count} சரிபார்க்கப்பட்ட திட்டம்(கள்) கண்டறியப்பட்டன: {titles_str}."
                if count <= 3
                else f"{count} சரிபார்க்கப்பட்ட திட்டங்கள் கண்டறியப்பட்டன (எ.கா: {titles_str} மற்றும் பல)."
            )
        else:
            summary = (
                f"Found {count} verified scheme(s): {titles_str}."
                if count <= 3
                else f"Found {count} verified scheme(s) (including {titles_str} and more)."
            )

    return ChatActionResultSchema(
        success=True,
        action="discover_schemes",
        summary=summary,
        data={
            "match_count": count,
            "schemes": summary_schemes,
        },
        sources=sources,
        requires_confirmation=False,
        next_question=None,
    )


def _format_next_question(missing_field: str, language: str) -> str:
    """Generate localized, polite follow-up question for missing profile field."""
    low = missing_field.lower()
    if "age" in low:
        return "உங்கள் வயது என்ன?" if language == "ta" else "What is your age in completed years?"
    if "land" in low or "landholding" in low:
        return "உங்களிடம் பயிரிடக்கூடிய விவசாய நிலம் உள்ளதா?" if language == "ta" else "Do you or your family hold cultivable agricultural land?"
    if "income" in low:
        return "உங்கள் குடும்பத்தின் தோராயமான ஆண்டு வருமானம் என்ன?" if language == "ta" else "What is your approximate annual household income?"
    if "rural" in low or "urban" in low or "area" in low or "location" in low:
        return "நீங்கள் கிராமப்புறத்தில் வசிக்கிறீர்களா அல்லது நகர்ப்புறத்திலா?" if language == "ta" else "Do you reside in a rural or urban area?"
    if "occupation" in low:
        return "உங்கள் முதன்மை தொழில் என்ன?" if language == "ta" else "What is your primary occupation or livelihood?"
    if "pucca" in low or "house" in low:
        return "உங்களுக்கு இந்தியாவில் சொந்தமாக கான்கிரீட் (பக்கா) வீடு உள்ளதா?" if language == "ta" else "Do you or your family own a permanent pucca house anywhere in India?"
    if "tax" in low:
        return "நீங்கள் அல்லது உங்கள் குடும்பத்தினர் வருமான வரி செலுத்துபவரா?" if language == "ta" else "Are you or anyone in your household an income tax payer?"
    if "employee" in low or "government" in low:
        return "நீங்கள் அல்லது உங்கள் குடும்பத்தினர் அரசு ஊழியரா?" if language == "ta" else "Are you or your spouse currently a government employee?"
    return f"தயவுசெய்து பின்வரும் விவரத்தை வழங்கவும்: {missing_field}" if language == "ta" else f"Please provide: {missing_field}"


def handle_check_eligibility(
    payload: Dict[str, Any],
    language: str = "en",
    citizen_context: Optional[Dict[str, Any]] = None,
) -> ChatActionResultSchema:
    """Evaluate eligibility deterministically using three-valued logic."""
    raw_profile = payload.get("profile")
    if raw_profile is None and citizen_context and "profile" in citizen_context:
        raw_profile = citizen_context["profile"]

    if raw_profile is None:
        profile = CitizenProfile()
    elif isinstance(raw_profile, CitizenProfile):
        profile = raw_profile
    elif isinstance(raw_profile, dict):
        try:
            profile = CitizenProfile(**raw_profile)
        except ValidationError as e:
            return ChatActionResultSchema(
                success=False,
                action="check_eligibility",
                summary="Invalid profile parameters provided." if language == "en" else "தவறான பயனர் விவரங்கள் வழங்கப்பட்டன.",
                data={},
                sources=[],
                error={"code": "INVALID_ARGUMENTS", "message": str(e)},
            )
    else:
        return ChatActionResultSchema(
            success=False,
            action="check_eligibility",
            summary="Citizen profile must be a structured object.",
            data={},
            sources=[],
            error={"code": "INVALID_ARGUMENTS", "message": "Expected profile dictionary."},
        )

    schemes = load_verified_schemes()
    scheme_id = payload.get("scheme_id")

    if scheme_id:
        target_scheme = get_scheme_by_id(scheme_id, schemes)
        if not target_scheme:
            return ChatActionResultSchema(
                success=False,
                action="check_eligibility",
                summary=f"Scheme with ID '{scheme_id}' was not found in the verified catalog.",
                data={},
                sources=[],
                error={
                    "code": "SCHEME_NOT_FOUND",
                    "message": f"Scheme '{scheme_id}' not found in verified catalog.",
                    "details": {"requested_scheme_id": scheme_id},
                },
            )

        res = evaluate_single_scheme(target_scheme, profile)
        next_q = None
        if res.missing_information:
            next_q = _format_next_question(res.missing_information[0], language)

        sources = []
        if target_scheme.get("official_portal_url"):
            sources.append({
                "title": target_scheme.get("title", "Official Source"),
                "url": target_scheme.get("official_portal_url", ""),
                "verification_source": target_scheme.get("verification_source") or "Official Scheme Guidelines",
                "verification_date": target_scheme.get("verification_date") or "Official Record",
            })

        title = target_scheme.get("title", scheme_id)
        if res.outcome == "meets_known_criteria":
            summary = (
                f"வழங்கப்பட்ட பதில்களின்படி, நீங்கள் {title} திட்டத்திற்கான அறியப்பட்ட சட்டப்பூர்வ தகுதிகளைப் பூர்த்தி செய்கிறீர்கள். "
                "(இது உத்தியோகபூர்வ ஒப்புதல் அல்ல, ஆரம்ப வழிகாட்டுதல் மட்டுமே)."
                if language == "ta"
                else f"Based on your answers, you meet all known statutory criteria for {title}. "
                "Please note this indicates application preparedness, not guaranteed official approval."
            )
        elif res.outcome == "does_not_meet_known_criteria":
            first_fail = res.criteria_not_met[0] if res.criteria_not_met else "Unmet statutory condition"
            summary = (
                f"சரிபார்க்கப்பட்ட விதிகளின்படி, நீங்கள் {title} திட்டத்தின் தகுதிகளைப் பூர்த்தி செய்யவில்லை: {first_fail}."
                if language == "ta"
                else f"Based on verified statutory guidelines, you do not meet the criteria for {title}: {first_fail}."
            )
        else:
            missing_preview = ", ".join(res.missing_information[:2])
            summary = (
                f"{title} திட்டத்திற்கான அறியப்பட்ட விதிகள் பொருந்துகின்றன, ஆனால் முழுமையான தகுதியை உறுதிப்படுத்த கூடுதல் தகவல்கள் தேவைப்படுகின்றன: {missing_preview}."
                if language == "ta"
                else f"You satisfy evaluated rules for {title}, but additional information is required to confirm eligibility: {missing_preview}."
            )

        return ChatActionResultSchema(
            success=True,
            action="check_eligibility",
            summary=summary,
            data=res.model_dump(),
            sources=sources,
            requires_confirmation=False,
            next_question=next_q,
        )

    # Evaluate across all schemes if no specific scheme ID was supplied
    all_res = evaluate_all_schemes(schemes, profile)
    meets_cnt = all_res.summary.get("meets_known_criteria", 0)
    needs_cnt = all_res.summary.get("needs_verification", 0)

    if language == "ta":
        summary = f"மொத்தம் {all_res.total_schemes_evaluated} திட்டங்கள் மதிப்பீடு செய்யப்பட்டன. {meets_cnt} திட்டங்களுக்கு தகுதி பொருந்துகிறது, {needs_cnt} திட்டங்களுக்கு கூடுதல் விவரங்கள் தேவை."
    else:
        summary = f"Evaluated {all_res.total_schemes_evaluated} schemes. {meets_cnt} scheme(s) meet known criteria, {needs_cnt} scheme(s) require additional verification."

    next_q = None
    for s_res in all_res.schemes:
        if s_res.missing_information:
            next_q = _format_next_question(s_res.missing_information[0], language)
            break

    sources = [
        {
            "title": s.get("title", ""),
            "url": s.get("official_portal_url", ""),
            "verification_source": s.get("verification_source", "Official Guidelines"),
            "verification_date": s.get("verification_date", "Official Record"),
        }
        for s in schemes if s.get("official_portal_url")
    ]

    return ChatActionResultSchema(
        success=True,
        action="check_eligibility",
        summary=summary,
        data=all_res.model_dump(),
        sources=sources[:5],
        requires_confirmation=False,
        next_question=next_q,
    )


def handle_get_scheme_details(
    payload: Dict[str, Any],
    language: str = "en",
    citizen_context: Optional[Dict[str, Any]] = None,
) -> ChatActionResultSchema:
    """Retrieve full verified details of a scheme."""
    scheme_id = payload.get("scheme_id")
    if not scheme_id or not isinstance(scheme_id, str):
        return ChatActionResultSchema(
            success=False,
            action="get_scheme_details",
            summary="Scheme ID must be specified.",
            data={},
            sources=[],
            error={"code": "INVALID_ARGUMENTS", "message": "Missing required 'scheme_id'."},
        )

    target_scheme = get_scheme_by_id(scheme_id)
    if not target_scheme:
        return ChatActionResultSchema(
            success=False,
            action="get_scheme_details",
            summary=f"Scheme '{scheme_id}' was not found in the verified catalog.",
            data={},
            sources=[],
            error={"code": "SCHEME_NOT_FOUND", "message": f"Scheme '{scheme_id}' not found."},
        )

    title = target_scheme.get("title", scheme_id)
    ministry = target_scheme.get("ministry", "Central Government")
    benefits = target_scheme.get("detailed_benefits") or target_scheme.get("short_description") or ""

    if language == "ta":
        summary = f"{title} ({ministry}): {benefits}"
    else:
        summary = f"{title} governed by {ministry}. Key Benefits: {benefits}"

    sources = []
    if target_scheme.get("official_portal_url"):
        sources.append({
            "title": title,
            "url": target_scheme.get("official_portal_url", ""),
            "verification_source": target_scheme.get("verification_source") or "Official Portal",
            "verification_date": target_scheme.get("verification_date") or "Official Record",
        })

    return ChatActionResultSchema(
        success=True,
        action="get_scheme_details",
        summary=summary,
        data=target_scheme,
        sources=sources,
        requires_confirmation=False,
        next_question=None,
    )


def handle_map_documents(
    payload: Dict[str, Any],
    language: str = "en",
    citizen_context: Optional[Dict[str, Any]] = None,
) -> ChatActionResultSchema:
    """Map document requirements across selected schemes."""
    scheme_ids = payload.get("scheme_ids")
    if not scheme_ids or not isinstance(scheme_ids, list):
        return ChatActionResultSchema(
            success=False,
            action="map_documents",
            summary="At least one scheme ID must be provided to map documents.",
            data={},
            sources=[],
            error={"code": "EMPTY_SCHEME_LIST", "message": "scheme_ids list cannot be empty."},
        )

    schemes = load_verified_schemes()
    scheme_map = {s.get("id", "").lower(): s for s in schemes}

    missing_ids = [sid for sid in scheme_ids if sid.strip().lower() not in scheme_map]
    if missing_ids:
        return ChatActionResultSchema(
            success=False,
            action="map_documents",
            summary=f"Unknown scheme ID(s): {', '.join(missing_ids)}.",
            data={},
            sources=[],
            error={"code": "SCHEME_NOT_FOUND", "message": f"Schemes not in catalog: {missing_ids}."},
        )

    user_docs = payload.get("citizen_documents")
    if user_docs is None and citizen_context and "documents" in citizen_context:
        user_docs = citizen_context["documents"].get("have_documents", [])
    if user_docs is None:
        user_docs = []

    profile_data = payload.get("profile") or (citizen_context.get("profile") if citizen_context else None)
    profile = None
    if profile_data:
        try:
            profile = CitizenProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
        except Exception:
            profile = None

    doc_request = DocumentMapperRequest(
        scheme_ids=scheme_ids,
        citizen_documents=user_docs,
        profile=profile,
    )

    mapping_res = map_scheme_documents(schemes, doc_request)

    num_schemes = len(scheme_ids)
    num_req = mapping_res.total_unique_required_documents
    num_reusable = len(mapping_res.reusable_documents)
    score = mapping_res.readiness_score.score_percentage

    if language == "ta":
        summary = (
            f"{num_schemes} திட்டங்களுக்கான ஆவணங்கள் பகுப்பாய்வு செய்யப்பட்டன. மொத்தம் {num_req} தனிப்பட்ட ஆவணங்கள் தேவைப்படுகின்றன "
            f"({num_reusable} ஆவணங்கள் பல திட்டங்களுக்குப் பயன்படும்). தற்போதைய தயார்நிலை: {score}%."
        )
    else:
        summary = (
            f"Analyzed {num_schemes} scheme(s) requiring {num_req} unique document(s), including {num_reusable} reusable document(s). "
            f"Current document readiness score: {score}%."
        )

    return ChatActionResultSchema(
        success=True,
        action="map_documents",
        summary=summary,
        data=mapping_res.model_dump(),
        sources=mapping_res.official_source_references,
        requires_confirmation=False,
        next_question=None,
    )


def handle_generate_passport(
    payload: Dict[str, Any],
    language: str = "en",
    citizen_context: Optional[Dict[str, Any]] = None,
) -> ChatActionResultSchema:
    """Generate in-memory Scheme Readiness Passport PDF."""
    scheme_ids = payload.get("scheme_ids")
    if not scheme_ids or not isinstance(scheme_ids, list):
        return ChatActionResultSchema(
            success=False,
            action="generate_passport",
            summary="At least one scheme ID is required to generate a Scheme Passport.",
            data={},
            sources=[],
            error={"code": "EMPTY_SCHEME_LIST", "message": "scheme_ids list cannot be empty."},
        )

    seen = set()
    duplicates = []
    for sid in scheme_ids:
        norm = sid.strip().lower()
        if norm in seen:
            duplicates.append(sid)
        seen.add(norm)

    if duplicates:
        return ChatActionResultSchema(
            success=False,
            action="generate_passport",
            summary=f"Duplicate scheme IDs provided: {duplicates}.",
            data={},
            sources=[],
            error={"code": "DUPLICATE_SCHEME_IDS", "message": f"Duplicate scheme IDs: {duplicates}."},
        )

    schemes = load_verified_schemes()
    scheme_map = {s.get("id", "").lower(): s for s in schemes}

    resolved_schemes = []
    for sid in scheme_ids:
        norm = sid.strip().lower()
        if norm not in scheme_map:
            return ChatActionResultSchema(
                success=False,
                action="generate_passport",
                summary=f"Scheme '{sid}' was not found in the verified catalog.",
                data={},
                sources=[],
                error={"code": "SCHEME_NOT_FOUND", "message": f"Scheme '{sid}' not in catalog."},
            )
        resolved_schemes.append(scheme_map[norm])

    raw_profile = payload.get("profile") or (citizen_context.get("profile") if citizen_context else None)
    if not raw_profile:
        return ChatActionResultSchema(
            success=False,
            action="generate_passport",
            summary="A citizen demographic profile is required to generate a Scheme Passport.",
            data={},
            sources=[],
            error={"code": "INVALID_ARGUMENTS", "message": "profile is required."},
        )

    try:
        profile = CitizenProfile(**raw_profile) if isinstance(raw_profile, dict) else raw_profile
    except ValidationError as e:
        return ChatActionResultSchema(
            success=False,
            action="generate_passport",
            summary="Citizen profile validation failed.",
            data={},
            sources=[],
            error={"code": "INVALID_ARGUMENTS", "message": str(e)},
        )

    user_docs = payload.get("citizen_documents")
    if user_docs is None and citizen_context and "documents" in citizen_context:
        user_docs = citizen_context["documents"].get("have_documents", [])
    if user_docs is None:
        user_docs = profile.available_documents

    notes = payload.get("notes")
    if notes and len(str(notes)) > 500:
        notes = str(notes)[:500]

    # Evaluate eligibility internally
    eligibility_results = [evaluate_single_scheme(s, profile) for s in resolved_schemes]

    # Compute document mapping internally
    doc_request = DocumentMapperRequest(
        scheme_ids=scheme_ids,
        citizen_documents=user_docs,
        profile=profile,
    )
    doc_mapping = map_scheme_documents(schemes, doc_request)

    try:
        pdf_buffer = generate_scheme_passport_pdf(
            schemes=resolved_schemes,
            profile=profile,
            eligibility_results=eligibility_results,
            document_mapping=doc_mapping,
            notes=notes,
        )
    except Exception as e:
        logger.error("Failed to generate passport PDF: %s", e)
        return ChatActionResultSchema(
            success=False,
            action="generate_passport",
            summary="Scheme Passport PDF generation failed due to an internal rendering error.",
            data={},
            sources=[],
            error={"code": "GENERATION_FAILED", "message": str(e)},
        )

    pdf_bytes = pdf_buffer.getvalue()
    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if language == "ta":
        summary = f"{len(scheme_ids)} திட்டங்களுக்கான SevAIQ திட்ட பாஸ்போர்ட் PDF வெற்றிகரமாக உருவாக்கப்பட்டது."
    else:
        summary = f"SevAIQ Scheme Passport PDF successfully generated for {len(scheme_ids)} scheme(s)."

    sources = [
        {
            "title": s.get("title", ""),
            "url": s.get("official_portal_url", ""),
            "verification_source": s.get("verification_source", "Official Guidelines"),
            "verification_date": s.get("verification_date", "Official Record"),
        }
        for s in resolved_schemes if s.get("official_portal_url")
    ]

    return ChatActionResultSchema(
        success=True,
        action="generate_passport",
        summary=summary,
        data={
            "filename": "SevAIQ_Scheme_Passport.pdf",
            "download_endpoint": "/api/passport/pdf",
            "schemes_included": scheme_ids,
            "readiness_percentage": doc_mapping.readiness_score.score_percentage,
            "generation_timestamp": now_iso,
            "pdf_base64": pdf_base64,
            "file_size_bytes": len(pdf_bytes),
        },
        sources=sources,
        requires_confirmation=False,
        next_question=None,
    )


def handle_get_application_guidance(
    payload: Dict[str, Any],
    language: str = "en",
    citizen_context: Optional[Dict[str, Any]] = None,
) -> ChatActionResultSchema:
    """Retrieve verified application guidance and separate user-recorded tracking."""
    scheme_id = payload.get("scheme_id")
    if not scheme_id or not isinstance(scheme_id, str):
        return ChatActionResultSchema(
            success=False,
            action="get_application_guidance",
            summary="Scheme ID must be specified.",
            data={},
            sources=[],
            error={"code": "INVALID_ARGUMENTS", "message": "Missing required 'scheme_id'."},
        )

    target_scheme = get_scheme_by_id(scheme_id)
    if not target_scheme:
        return ChatActionResultSchema(
            success=False,
            action="get_application_guidance",
            summary=f"Scheme '{scheme_id}' was not found in the verified catalog.",
            data={},
            sources=[],
            error={"code": "SCHEME_NOT_FOUND", "message": f"Scheme '{scheme_id}' not found."},
        )

    title = target_scheme.get("title", scheme_id)
    app_mode = target_scheme.get("application_mode", "Online portal and CSC / e-Seva Kendra")
    steps = target_scheme.get("application_steps") or [
        "Visit the official government scheme portal",
        "Authenticate using Aadhaar or mobile OTP",
        "Fill the prescribed application form and upload mandatory documents",
        "Submit and retain the acknowledgment receipt number for verification",
    ]
    portal_url = target_scheme.get("official_portal_url")

    # Read user-recorded tracking if supplied in session context
    user_status = None
    if citizen_context and "tracking" in citizen_context and isinstance(citizen_context["tracking"], dict):
        user_status = citizen_context["tracking"].get(scheme_id) or citizen_context["tracking"].get(target_scheme.get("id"))

    if user_status:
        tracking_notice = (
            f"Citizen-recorded status in current session: '{user_status}'. "
            "(Note: This reflects your own session notes, not live backend government portal data)."
        )
    else:
        tracking_notice = "No application status has been recorded in this session."

    if language == "ta":
        summary = (
            f"{title} திட்டத்திற்கான விண்ணப்ப முறை: {app_mode}. "
            f"அதிகாரப்பூர்வ தளம்: {portal_url or 'அரசு தளம்'}."
        )
    else:
        summary = (
            f"Application guidance for {title}. Mode: {app_mode}. "
            f"Official portal: {portal_url or 'Official Portal'}."
        )

    sources = []
    if portal_url:
        sources.append({
            "title": f"{title} Application Portal",
            "url": portal_url,
            "verification_source": target_scheme.get("verification_source") or "Official Portal",
            "verification_date": target_scheme.get("verification_date") or "Official Record",
        })

    return ChatActionResultSchema(
        success=True,
        action="get_application_guidance",
        summary=summary,
        data={
            "scheme_id": target_scheme.get("id"),
            "scheme_title": title,
            "application_mode": app_mode,
            "application_steps": steps,
            "official_portal_url": portal_url,
            "user_recorded_status": user_status,
            "portal_status_notice": tracking_notice,
        },
        sources=sources,
        requires_confirmation=False,
        next_question=None,
    )


# ---------------------------------------------------------------------------
# Frontend-Only Action Proposals
# ---------------------------------------------------------------------------

def handle_navigate_to(payload: Dict[str, Any], language: str = "en") -> ChatActionResultSchema:
    """Propose UI section navigation on client."""
    target = payload.get("target", "schemes")
    valid_targets = {"schemes", "eligibility", "documents", "passport", "tracking"}
    if target not in valid_targets:
        target = "schemes"

    if language == "ta":
        summary = f"{target} பகுதிக்கு செல்ல வழிகாட்டப்படுகிறது."
    else:
        summary = f"Navigating to {target} section."

    return ChatActionResultSchema(
        success=True,
        action="navigate_to",
        summary=summary,
        data={"target": target, "execution": "client_side"},
        sources=[],
        requires_confirmation=False,
    )


def handle_set_language(payload: Dict[str, Any], language: str = "en") -> ChatActionResultSchema:
    """Propose UI language change on client."""
    new_lang = payload.get("language", "en")
    if new_lang not in ("en", "ta"):
        new_lang = "en"

    summary = "Language switched to Tamil (தமிழ்)." if new_lang == "ta" else "Language switched to English."
    return ChatActionResultSchema(
        success=True,
        action="set_language",
        summary=summary,
        data={"language": new_lang, "execution": "client_side"},
        sources=[],
        requires_confirmation=False,
    )


def handle_clear_session(payload: Dict[str, Any], language: str = "en") -> ChatActionResultSchema:
    """Propose Kiosk session reset on client (requires confirmation)."""
    if language == "ta":
        summary = "உங்கள் சுயவிவரம் மற்றும் அமர்வுத் தரவை அழிக்க விரும்புகிறீர்களா என்பதை உறுதிப்படுத்தவும்."
    else:
        summary = "Please confirm that you wish to clear all citizen profile data and reset the kiosk session."

    return ChatActionResultSchema(
        success=True,
        action="clear_session",
        summary=summary,
        data={"action": "clear_session", "execution": "client_side"},
        sources=[],
        requires_confirmation=True,
    )


def handle_speak_text(payload: Dict[str, Any], language: str = "en") -> ChatActionResultSchema:
    """Propose client-side text-to-speech audio."""
    text = payload.get("text", "")
    return ChatActionResultSchema(
        success=True,
        action="speak_text",
        summary="Playing audio..." if language == "en" else "ஆடியோ இயக்கப்படுகிறது...",
        data={"text": text, "language": language, "execution": "client_side"},
        sources=[],
        requires_confirmation=False,
    )


# ---------------------------------------------------------------------------
# Central Dispatcher
# ---------------------------------------------------------------------------

ACTION_ALIASES: Dict[str, str] = {
    # Server actions
    "discover_schemes": "discover_schemes",
    "discover-schemes": "discover_schemes",
    "discover": "discover_schemes",
    "check_eligibility": "check_eligibility",
    "check-eligibility": "check_eligibility",
    "eligibility": "check_eligibility",
    "get_scheme_details": "get_scheme_details",
    "scheme_details": "get_scheme_details",
    "explain_scheme_match": "get_scheme_details",
    "map_documents": "map_documents",
    "map-documents": "map_documents",
    "show_required_documents": "map_documents",
    "required_documents": "map_documents",
    "generate_passport": "generate_passport",
    "generate-passport": "generate_passport",
    "generate_readiness_passport": "generate_passport",
    "readiness_passport": "generate_passport",
    "passport": "generate_passport",
    "get_application_guidance": "get_application_guidance",
    "application_guidance": "get_application_guidance",
    "open_official_application_link": "get_application_guidance",
    "show_application_progress": "get_application_guidance",
    # Frontend actions
    "navigate_to": "navigate_to",
    "navigate_to_section": "navigate_to",
    "navigate": "navigate_to",
    "set_language": "set_language",
    "change_language": "set_language",
    "clear_session": "clear_session",
    "speak_text": "speak_text",
    "read_last_response": "speak_text",
    "ask_profile_question": "check_eligibility",
}


def normalize_payload_args(payload: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Normalize camelCase frontend arguments to canonical snake_case."""
    if not payload or not isinstance(payload, dict):
        return {}
    res = dict(payload)
    if "schemeId" in res and "scheme_id" not in res:
        res["scheme_id"] = res["schemeId"]
    if "schemeIds" in res and "scheme_ids" not in res:
        res["scheme_ids"] = res["schemeIds"]
    if "scheme_id" in res and "scheme_ids" not in res:
        res["scheme_ids"] = [res["scheme_id"]]
    if "section" in res and "target" not in res:
        res["target"] = res["section"]
    return res


def execute_chat_action(
    action: str,
    payload: Optional[Dict[str, Any]] = None,
    language: str = "en",
    citizen_context: Optional[Dict[str, Any]] = None,
) -> ChatActionResultSchema:
    """Execute a registered action with explicit validation and typed response."""
    raw_action = action.strip().lower().replace("-", "_")
    norm_action = ACTION_ALIASES.get(raw_action, raw_action)
    norm_lang = "ta" if language and language.strip().lower().startswith("ta") else "en"
    args = normalize_payload_args(payload)

    if norm_action not in ALL_ACTIONS:
        return ChatActionResultSchema(
            success=False,
            action=action,
            summary=f"Action '{action}' is not supported." if norm_lang == "en" else f"'{action}' செயல் ஆதரிக்கப்படவில்லை.",
            data={},
            sources=[],
            error={
                "code": "UNSUPPORTED_ACTION",
                "message": f"Action '{action}' is not in the allowlist of supported actions.",
                "details": {"supported_actions": sorted(list(ALL_ACTIONS))},
            },
        )

    try:
        if norm_action == "discover_schemes":
            return handle_discover_schemes(args, norm_lang, citizen_context)
        elif norm_action == "check_eligibility":
            return handle_check_eligibility(args, norm_lang, citizen_context)
        elif norm_action == "get_scheme_details":
            return handle_get_scheme_details(args, norm_lang, citizen_context)
        elif norm_action == "map_documents":
            return handle_map_documents(args, norm_lang, citizen_context)
        elif norm_action == "generate_passport":
            return handle_generate_passport(args, norm_lang, citizen_context)
        elif norm_action == "get_application_guidance":
            return handle_get_application_guidance(args, norm_lang, citizen_context)
        elif norm_action == "navigate_to":
            return handle_navigate_to(args, norm_lang)
        elif norm_action == "set_language":
            return handle_set_language(args, norm_lang)
        elif norm_action == "clear_session":
            return handle_clear_session(args, norm_lang)
        elif norm_action == "speak_text":
            return handle_speak_text(args, norm_lang)
        else:
            return ChatActionResultSchema(
                success=False,
                action=action,
                summary=f"Unimplemented action '{action}'.",
                data={},
                sources=[],
                error={"code": "UNIMPLEMENTED_ACTION", "message": f"Handler not defined for '{action}'."},
            )
    except Exception as e:
        logger.exception("Error executing action '%s': %s", action, e)
        return ChatActionResultSchema(
            success=False,
            action=action,
            summary="An internal error occurred while executing this action." if norm_lang == "en" else "செயலை செயல்படுத்துவதில் பிழை ஏற்பட்டது.",
            data={},
            sources=[],
            error={"code": "INTERNAL_ERROR", "message": str(e)},
        )


# ---------------------------------------------------------------------------
# Natural Language Intent Recognition
# ---------------------------------------------------------------------------

def detect_scheme_in_text(text: str) -> Optional[str]:
    """Detect mentioned scheme ID in free-form natural language text."""
    t_lower = text.lower()
    for alias, s_id in SCHEME_ALIASES.items():
        if alias in t_lower:
            return s_id
    return None


def detect_action_intent(
    message: str,
    focused_scheme_id: Optional[str] = None,
    citizen_context: Optional[Dict[str, Any]] = None,
) -> Optional[Tuple[str, Dict[str, Any]]]:
    """Detect high-confidence intent for a citizen's natural language message."""
    t = message.strip().lower()
    detected_scheme = detect_scheme_in_text(t) or focused_scheme_id

    # 1. Eligibility Check
    elig_patterns = [
        "eligible", "eligibility", "am i eligible", "check eligibility", "can i get",
        "qualify", "qualified", "தகுதி", "தகுதியுள்ளவனா", "தகுதி உள்ளதா", "பொருந்துமா",
    ]
    if any(p in t for p in elig_patterns):
        payload = {}
        if detected_scheme:
            payload["scheme_id"] = detected_scheme
        if citizen_context and "profile" in citizen_context:
            payload["profile"] = citizen_context["profile"]
        return ("check_eligibility", payload)

    # 2. Document Checklist / Mapping
    doc_patterns = [
        "document", "documents", "certificate", "certificates", "what documents",
        "documents needed", "checklist", "ஆவணம்", "ஆவணங்கள்", "சான்றிதழ்", "தேவையான ஆவணங்கள்",
    ]
    if any(p in t for p in doc_patterns):
        scheme_ids = [detected_scheme] if detected_scheme else []
        if not scheme_ids and citizen_context and "documents" in citizen_context:
            scheme_ids = citizen_context["documents"].get("selected_schemes", [])
        if scheme_ids:
            return ("map_documents", {"scheme_ids": scheme_ids})

    # 3. Application Guidance / Steps
    app_patterns = [
        "how to apply", "application steps", "apply online", "how can i apply",
        "application procedure", "எப்படி விண்ணப்பிப்பது", "விண்ணப்பிக்கும் முறை",
    ]
    if any(p in t for p in app_patterns) and detected_scheme:
        return ("get_application_guidance", {"scheme_id": detected_scheme})

    # 4. Scheme Passport Generation
    passport_patterns = [
        "passport", "scheme passport", "download passport", "generate passport",
        "readiness passport", "பாஸ்போர்ட்",
    ]
    if any(p in t for p in passport_patterns):
        scheme_ids = [detected_scheme] if detected_scheme else []
        if not scheme_ids and citizen_context and "documents" in citizen_context:
            scheme_ids = citizen_context["documents"].get("selected_schemes", [])
        if scheme_ids and citizen_context and "profile" in citizen_context:
            return ("generate_passport", {
                "scheme_ids": scheme_ids,
                "profile": citizen_context["profile"],
            })

    # 5. Clear Session
    clear_patterns = ["clear session", "clear my data", "reset session", "அமர்வு அழிக்க", "தரவு அழிக்க"]
    if any(p in t for p in clear_patterns):
        return ("clear_session", {})

    # 6. Scheme Discovery
    discover_patterns = [
        "schemes for", "find scheme", "what schemes", "list schemes", "help me with",
        "farming schemes", "pension schemes", "housing schemes", "கல்வி உதவி",
        "விவசாய திட்டம்", "திட்டங்கள்", "உதவி திட்டங்கள்",
    ]
    if any(p in t for p in discover_patterns):
        # Extract query topic
        q = t
        for p in discover_patterns:
            q = q.replace(p, "").strip()
        q = q or message
        return ("discover_schemes", {"query": q})

    # 7. Specific Scheme Details
    if detected_scheme and any(k in t for k in ["tell me about", "details", "what is", "விவரங்கள்", "பற்றி"]):
        return ("get_scheme_details", {"scheme_id": detected_scheme})

    return None
