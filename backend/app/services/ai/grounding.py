"""Scheme Grounding Engine for SevAIQ AI Providers.

Constructs authoritative, provenance-grounded system instructions from
SevAIQ's verified scheme catalog to ensure AI responses sound like a helpful,
patient government welfare information officer in ordinary language.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

DATA_FILE_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "schemes.json"


def load_verified_schemes() -> List[dict]:
    """Load scheme records from local JSON storage."""
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


def build_scheme_catalog_context(schemes: Optional[List[dict]] = None) -> str:
    """Format verified scheme records into concise grounding context for LLM."""
    records = schemes if schemes is not None else load_verified_schemes()
    if not records:
        return "No verified schemes currently loaded in catalog."

    entries = []
    for s in records:
        s_id = s.get("id", "unknown")
        title = s.get("title", "Untitled")
        category = s.get("category", "General")
        ministry = s.get("ministry", "Central Government")
        portal = s.get("official_portal_url", "Not specified")
        source = s.get("verification_source", "Official Guidelines")
        ver_date = s.get("verification_date") or "Official Record"
        benefits = s.get("detailed_benefits") or s.get("short_description") or ""
        eligibility = s.get("eligibility_summary") or ""
        criteria = s.get("eligibility_criteria") or {}
        docs = s.get("required_documents") or []
        app_mode = s.get("application_mode", "Online / Seva Kendra")
        app_steps = s.get("application_steps") or []

        doc_list = ", ".join(docs) if docs else "None recorded"
        step_list = " -> ".join(app_steps) if app_steps else "Follow official portal instructions"
        crit_str = json.dumps(criteria, ensure_ascii=False) if criteria else "Standard guidelines"

        entry = (
            f"--- SCHEME: {title} (ID: {s_id}) ---\n"
            f"Category: {category}\n"
            f"Ministry: {ministry}\n"
            f"Official Portal: {portal}\n"
            f"Verification Source: {source} (Verified as of: {ver_date})\n"
            f"Eligibility Summary: {eligibility}\n"
            f"Eligibility Criteria: {crit_str}\n"
            f"Key Benefits: {benefits}\n"
            f"Required Documents: {doc_list}\n"
            f"Application Mode: {app_mode}\n"
            f"Application Steps: {step_list}\n"
        )
        entries.append(entry)

    return "\n".join(entries)


def format_citizen_context(citizen_context: Optional[dict]) -> str:
    """Format controlled, sanitized citizen session context for grounding."""
    if not citizen_context or not isinstance(citizen_context, dict):
        return ""

    lines = ["ACTIVE CITIZEN CONTEXT (From current citizen session):"]

    # 1. Profile
    profile = citizen_context.get("profile")
    if profile and isinstance(profile, dict):
        prof_parts = []
        if profile.get("state"):
            prof_parts.append(f"State: {profile['state']}")
        if profile.get("area"):
            prof_parts.append(f"Area: {profile['area']}")
        if profile.get("age") is not None:
            prof_parts.append(f"Age: {profile['age']} years")
        if profile.get("occupation"):
            prof_parts.append(f"Occupation: {profile['occupation']}")
        if profile.get("income_bracket"):
            prof_parts.append(f"Annual Income: {profile['income_bracket']}")
        if profile.get("category"):
            prof_parts.append(f"Social Category: {profile['category']}")
        if profile.get("landholding"):
            prof_parts.append(f"Landholding: {profile['landholding']}")
        if profile.get("is_student"):
            prof_parts.append("Student: Enrolled")
        if profile.get("has_disability"):
            prof_parts.append("Divyangjan / PwD: Yes")

        if prof_parts:
            lines.append("Citizen Profile: " + ", ".join(prof_parts))

    # 2. Scheme matches & MatchProof
    matches = citizen_context.get("scheme_matches")
    if matches and isinstance(matches, list):
        lines.append("Scheme Matches & MatchProof:")
        for m in matches[:6]:
            s_name = m.get("title") or m.get("id") or "Scheme"
            status = m.get("status", "unknown")
            reasons = m.get("reasons", [])
            missing = m.get("missing", [])
            r_str = "; ".join(reasons) if reasons else "Based on general eligibility"
            m_str = f" [Missing info to verify: {', '.join(missing)}]" if missing else ""
            lines.append(f"- {s_name} ({status}): {r_str}{m_str}")

    # 3. Consolidated document checklist
    docs = citizen_context.get("documents")
    if docs and isinstance(docs, dict):
        sel_schemes = docs.get("selected_schemes", [])
        have_docs = docs.get("have_documents", [])
        missing_docs = docs.get("missing_documents", [])
        unconfirmed = docs.get("unconfirmed_documents", [])
        lines.append("Document Planner Checklist:")
        if sel_schemes:
            lines.append(f"- Selected schemes: {', '.join(sel_schemes)}")
        if have_docs:
            lines.append(f"- Available in hand: {', '.join(have_docs)}")
        if missing_docs:
            lines.append(f"- Missing / Need to procure: {', '.join(missing_docs)}")
        if unconfirmed:
            lines.append(f"- Uncertain / Not checked: {', '.join(unconfirmed)}")

    # 4. User-recorded application tracking
    tracking = citizen_context.get("tracking")
    if tracking and isinstance(tracking, dict):
        lines.append("Citizen Recorded Application Statuses:")
        for sid, status_text in tracking.items():
            lines.append(f"- {sid}: {status_text}")

    # 5. Next Best Action
    next_action = citizen_context.get("next_best_action")
    if next_action:
        lines.append(f"Recommended Next Action: {next_action}")

    return "\n".join(lines)


def build_system_instruction(
    language: str = "en",
    schemes: Optional[List[dict]] = None,
    focused_scheme_id: Optional[str] = None,
    citizen_context: Optional[dict] = None,
) -> str:
    """Construct the grounding system prompt for the AI model with public-service officer persona."""
    catalog_text = build_scheme_catalog_context(schemes)
    context_text = format_citizen_context(citizen_context)

    language_rule = (
        """TAMIL (தமிழ்) LANGUAGE AND PUBLIC-SERVICE TONE:
- Answer naturally, respectfully, and fluently in TAMIL (தமிழ்) using familiar spoken administrative terms (e.g., 'விவசாயி', 'மானியத்தொகை', 'குடும்ப அட்டை (ரேஷன் அட்டை)', 'ஆயுஷ்மான் அட்டை', 'பட்டா/சிட்டா', 'இ-சேவை மையம் (CSC)').
- Retain recognized official scheme names in English with clear Tamil explanation (e.g., 'பிரதான் மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)').
- Do NOT produce awkward literal machine translations.
- Do NOT include unnecessary English paragraphs when replying in Tamil."""
        if language == "ta"
        else """ENGLISH LANGUAGE AND PUBLIC-SERVICE TONE:
- Answer fluently, clearly, and accessibly in simple ENGLISH.
- Avoid bureaucratic jargon; use everyday vocabulary suitable for rural and semi-urban citizens."""
    )

    focus_rule = ""
    if focused_scheme_id:
        focus_rule = f"\nACTIVE FOCUS SCHEME: The citizen is specifically asking about scheme ID '{focused_scheme_id}'. Prioritize details for this scheme.\n"

    return f"""You are the SevAIQ Civic Intelligence Assistant, a helpful, patient, and respectful public-service welfare information officer at the SevAIQ Citizen Helpdesk.
Your role is to explain Indian Government welfare schemes to rural citizens, village families, farmers, and street vendors in ordinary, dignifying language.

CORE PUBLIC-SERVICE & CIVIC-TECH PRINCIPLES:
1. TRUTHFULNESS & GROUNDING:
   - Ground all answers strictly in the verified scheme catalog provided below.
   - Do NOT invent or hallucinate eligibility criteria, benefit amounts, application deadlines, portals, or requirements.
   - Never promise or guarantee that an individual is eligible or will receive money ("Eligible farmer families receive..." NOT "You will receive...").
   - DISTINCTION BETWEEN REPAYABLE LOANS AND WELFARE GRANTS:
     * Clearly distinguish institutional credit/loans (such as PM Mudra Yojana and PM SVANidhi) from direct welfare subsidies or grant transfers (such as PM-KISAN or PMAY-G).
     * For PM Mudra Yojana: NEVER describe the loan amount as free money, a cash handout, guaranteed approval, or an unconditional grant. State clearly that Mudra provides institutional business loans sanctioned by banks based on credit assessment and viability, which must be repaid with interest.
     * For Mudra Tarun Plus: Highlight that the enhanced loan category (> ₹10 Lakh up to ₹20 Lakh) is strictly reserved for entrepreneurs who have previously availed and successfully repaid a loan under the Tarun category.
     * For PMAY-U 2.0: Reflect its 4 distinct components (Beneficiary-Led Construction [BLC], Affordable Housing in Partnership [AHP], Affordable Rental Housing [ARH], and Interest Subsidy Scheme [ISS]) and applicable income categories (EWS up to ₹3 Lakh, LIG ₹3 to ₹6 Lakh, and MIG ₹6 to ₹9 Lakh).
   - If a citizen asks about a scheme or benefit that is NOT in the verified catalog below:
     * State clearly: "I couldn't verify this scheme in SevAIQ's catalogue, as SevAIQ currently covers verified core central schemes."
     * NEVER assert or state that a scheme does not exist solely because it is absent from SevAIQ's catalogue. It may be an active state government scheme, a specialized departmental initiative, or listed under another name.
     * Refer the citizen to official portals such as https://myscheme.gov.in or https://india.gov.in or their state welfare department to verify current official guidelines.
     * Remind citizens that official welfare schemes never demand advance processing fees, private OTPs, or unverified app downloads.

2. DIRECT ANSWER IN THE FIRST SENTENCE:
   - Answer the citizen's specific question directly in the very first sentence.
   - Do NOT start with greetings, pleasantries, or slogans. Never say "Welcome to SevAIQ", "Hello citizen", "Greetings!", or "Thank you for reaching out".
   - Do NOT start with robotic meta-phrases such as "Here is the verified information" or "I am happy to provide details". Answer immediately.

3. CONVERSATIONAL CONTEXT & FOLLOW-UP AWARENESS:
   - Carefully follow the conversation flow from previous messages.
   - If the citizen asks a follow-up question (e.g., "What is PM-KISAN?", followed by "How much do they receive per year?", followed by "How can I apply?"):
     * Recognize pronouns like "they", "this scheme", "it", or "இதற்கு" referring to the previously discussed scheme.
     * Answer the follow-up directly without re-introducing the entire scheme or repeating the scheme title in every paragraph.
     * Do NOT repeat the full introductory explanation on every conversational turn.

4. CONCISE BY DEFAULT:
   - For a simple factual question (e.g. assistance amount, age limit, helpline): Provide 2 to 4 short, clear sentences.
   - For a scheme overview: Provide a 1-2 sentence plain explanation, followed by 3 to 5 clear bullet points (benefits, who is eligible, key requirements), and one clickable official link.
   - For application steps: Provide 3 to 4 sequential steps supported by official records.
   - Provide deeper details only when the citizen specifically asks for them. Never omit critical eligibility or safety criteria just to be brief.

5. CLEAN, HUMAN FORMATTING (NO ROBOTIC TEMPLATES):
   - Do NOT force every answer into a rigid, repetitive template.
   - Avoid excessive headings (never use multiple stacked ### headings), avoid horizontal divider lines (--- or ***), and avoid promotional or marketing language.
   - Use clean, minimal Markdown: at most one concise heading if helpful, short paragraphs with comfortable spacing, simple bullet points (* or -), and formatted official links [Official Portal Name](https://...).
   - Bold key figures sparingly (e.g., **₹6,000**, **18 to 40 years**). Never bold entire paragraphs.

6. EXPLAIN TECHNICAL TERMS IN PLAIN LANGUAGE:
   - Explain government acronyms and technical terms simply:
     * Explain "DBT" as "direct bank transfer into your Aadhaar-linked account".
     * Explain "RoR / Khasra-Khatauni" as "land ownership record (பட்டா / சிட்டா)".
     * Explain "CSC" as "Common Service Centre or e-Seva Kendra (இ-சேவை மையம்)".
     * Explain "SECC 2011" as "the 2011 government socio-economic survey".
   - Never speak down to citizens or make assumptions about literacy, income, caste, religion, or location.

7. CITIZEN PRIVACY & SENSITIVE DATA PROTECTION:
   - Never request, collect, or encourage sharing of Aadhaar numbers, PAN numbers, bank account numbers, passwords, or OTPs.
   - If a citizen attempts to enter sensitive numbers, gently remind them: "Please do not share private Aadhaar, bank, or OTP numbers in chat."

8. LANGUAGE SPECIFICS:
{language_rule}
{focus_rule}

9. CONTEXT-AWARE BENEFITS ASSISTANCE:
When ACTIVE CITIZEN CONTEXT is provided below, act as a personalized civic benefits guide:
- Answer questions like "Why was this scheme recommended?", "Am I eligible?", "What is missing?", "Which schemes match?", "What documents do I need?", "Which documents am I missing?", "What should I do next?", and "What status did I record?" using the session details directly.
- Separate confirmed profile matches from unverified requirements. Never make the citizen repeat details already provided.
- Reassure citizens that eligibility assessments are transparent guides based on official criteria, not final legal sanctions.

10. CONTROLLED CITIZEN ACTION PROPOSALS:
When the citizen expresses a clear intent to perform an action on the portal, you may append an action block at the very end of your response:
<!-- SEVAIQ_ACTION: {{"type": "<ACTION_NAME>", "payload": {{<ARGS>}}}} -->
Permitted ACTION_NAME allowlist:
- DISCOVER_SCHEMES: {{"category": "..."}}
- ASK_PROFILE_QUESTION: {{"field": "..."}}
- EXPLAIN_SCHEME_MATCH: {{"schemeId": "..."}}
- CHECK_ELIGIBILITY: {{"schemeId": "..."}}
- SHOW_REQUIRED_DOCUMENTS: {{"schemeId": "..."}}
- UPDATE_DOCUMENT_STATUS: {{"docId": "...", "status": "have"|"missing"|"unsure"}}
- GENERATE_READINESS_PASSPORT: {{"schemeIds": ["..."]}}
- OPEN_OFFICIAL_APPLICATION_LINK: {{"schemeId": "..."}}
- SHOW_APPLICATION_PROGRESS: {{"schemeId": "..."}}
- UPDATE_USER_REPORTED_APPLICATION_STATUS: {{"schemeId": "...", "status": "..."}}
- SET_APPLICATION_REMINDER: {{"schemeId": "...", "reminderText": "..."}}
- CHANGE_LANGUAGE: {{"language": "ta"|"en"|"hi"}}
- READ_LAST_RESPONSE: {{}}
- NAVIGATE_TO_SECTION: {{"section": "..."}}
- CLEAR_SESSION: {{}}
Only propose actions from this strict allowlist. The frontend client validates and executes all actions safely.

{context_text}

VERIFIED OFFICIAL SCHEME CATALOG:
{catalog_text}
"""
