# SevAIQ Chatbot Action Layer API Contract (v1.0.0)

**Document Version:** 1.0.0  
**Ownership:** Backend / API Agent  
**Consumer:** Frontend Agent & Client Application  
**Status:** Approved & Implemented  

---

## 1. Executive Summary & Core Principles

The SevAIQ Chatbot Action Layer turns the conversational AI assistant into a functional, typed, action-capable government welfare guide. Citizens can converse in ordinary **English** or **Tamil (தமிழ்)**, and the backend deterministically retrieves official scheme records, evaluates statutory eligibility, maps cross-scheme document checklists, generates printable Scheme Readiness Passports, and guides application steps.

### Architectural Principles
1. **Deterministic Ground Truth**: The AI language model (Google Gemini) is used strictly for conversational phrasing, natural-language intent recognition, and bilingual explanations. All scheme records, eligibility evaluations, document reusability mappings, official portal URLs, and PDF generation are executed by deterministic, zero-trust backend Python services.
2. **Three-Valued Eligibility Logic**:
   - `meets_known_criteria`: All statutory criteria defined for the scheme are satisfied by the citizen profile.
   - `does_not_meet_known_criteria`: Disqualified by one or more verified statutory rules.
   - `needs_verification`: The citizen satisfies evaluated rules, but missing profile information or pending documentation prevents confirmation.
   - **Crucial Rule**: Missing citizen profile values are **NEVER** assumed to be negative answers or disqualifications. The system returns missing fields and prompts the citizen with a follow-up `next_question`.
   - **Crucial Rule**: The system **NEVER** claims official government approval or guaranteed monetary sanctions.
3. **Preserve Existing Chat API**: The existing `/api/chat` endpoint remains 100% backward-compatible. Clients can send existing message payloads, or include action requests. A dedicated `/api/chat/action` endpoint is also provided for direct, low-latency UI button and workflow triggers.
4. **Explicit Action Allowlist**: Only explicitly registered, typed actions may be executed. Arbitrary commands, code execution, or unvalidated model proposals are rejected with structured error objects.
5. **Clear Separation of Server vs. Frontend Actions**:
   - **Server Actions**: Scheme discovery, eligibility checks, scheme details retrieval, cross-scheme document mapping, passport generation, and verified application guidance.
   - **Frontend-Only Actions**: Tab navigation, UI language switching, text-to-speech audio playback, and kiosk local-storage purging. The backend proposes or flags these actions, but marks them as `execution: "client_side"`.
6. **Privacy & Public Kiosk Minimization**: The API does not persist citizen profiles, Aadhaar numbers, PAN numbers, or bank accounts to any database. In-memory data is processed ephemerally and discarded immediately after response transmission.

---

## 2. API Endpoints

| Method | Endpoint | Description | Auth / Key |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat` | Conversational turn with optional action execution and AI grounding | None / Backend Key |
| `POST` | `/api/chat/action` | Direct deterministic action execution (zero-latency UI invocation) | None |
| `GET` | `/api/chat/actions` | Returns catalog of registered actions, schemas, and requirements | None |

---

## 3. Data Schemas & Pydantic Definitions

### 3.1 Structured Action Result (`ChatActionResultSchema`)

Every action execution returns the standard schema:

```json
{
  "success": true,
  "action": "check_eligibility",
  "summary": "You meet the known criteria for PM-KISAN, but landholding status is missing.",
  "data": {
    "scheme_id": "pm-kisan",
    "outcome": "needs_verification",
    "missing_information": [
      "Cultivable agricultural landholding status is required for this scheme."
    ]
  },
  "sources": [
    {
      "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "url": "https://pmkisan.gov.in",
      "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)",
      "verification_date": "2024-02-28"
    }
  ],
  "requires_confirmation": false,
  "next_question": "Do you own cultivable agricultural land?",
  "error": null
}
```

#### Field Specifications:
- `success` (`bool`, required): `true` if the action completed without validation or execution error; `false` otherwise.
- `action` (`str`, required): Name of the invoked action (e.g. `discover_schemes`, `check_eligibility`).
- `summary` (`str`, required): Natural-language, citizen-facing summary formatted in the requested language (`en` or `ta`).
- `data` (`dict`, required): Structured verified outcome payload specific to the action.
- `sources` (`list[dict]`, required): Array of official government source references containing `title`, `url`, `verification_source`, and `verification_date`.
- `requires_confirmation` (`bool`, default `false`): `true` if this action entails consequential side-effects (e.g., `clear_session`).
- `next_question` (`str | null`, optional): The most relevant follow-up question to ask the citizen to fill missing profile details.
- `error` (`dict | null`, optional): Error details if `success` is `false`. Contains `code`, `message`, and optional `details`.

---

### 3.2 Chat Request (`ChatRequest`)

Extends the existing conversation request to support explicit action execution:

```typescript
interface ChatRequest {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  language?: "en" | "ta"; // Default: "en"
  context_scheme_id?: string;
  citizen_context?: CitizenContext;
  action?: string; // Optional: Explicit action name to invoke
  action_params?: Record<string, any>; // Optional: Parameters for explicit action
}
```

### 3.3 Chat Response (`ChatResponseSchema`)

```typescript
interface ChatResponseSchema {
  reply: string; // Grounded conversational explanation in requested language
  provider: string; // e.g., "gemini" or "deterministic-action-layer"
  model: string; // e.g., "gemini-2.5-flash"
  status: "success" | "error";
  latency_ms?: number;
  error_type?: string;
  error_message?: string;
  suggested_schemes?: string[];
  action_result?: ChatActionResultSchema; // Populated when an action is executed
}
```

---

### 3.4 Direct Action Request (`ChatActionRequest`)

```typescript
interface ChatActionRequest {
  action: string; // Action name from allowlist
  payload?: Record<string, any>; // Action arguments
  language?: "en" | "ta"; // Default: "en"
  citizen_context?: CitizenContext;
}
```

---

## 4. Controlled Action Registry

### 4.1 Server-Side Actions

#### 1. `discover_schemes`
- **Purpose**: Discovers verified schemes matching a citizen's goal or domain request (e.g. "farming assistance", "housing", "education loan", "pension").
- **Parameters**:
  - `query` (`string`, optional): Search query (e.g. "farm", "pension", "housing").
  - `category` (`string`, optional): Filter category (e.g. "Agriculture", "Social Security", "Healthcare").
  - `profile` (`CitizenProfile`, optional): Citizen demographics for pre-matching.
- **Validation**: Accepts empty query (returns all verified schemes). Rejects non-string queries.
- **Data Returned**:
  - `schemes`: Array of matching scheme summaries (`id`, `title`, `category`, `ministry`, `short_description`, `official_portal_url`, `verification_source`).
  - `match_count`: Total schemes matched.

#### 2. `check_eligibility`
- **Purpose**: Evaluates citizen profile against statutory criteria using the deterministic three-valued logic engine.
- **Parameters**:
  - `scheme_id` (`string`, optional): Specific scheme ID to evaluate (e.g. `pm-kisan`). If omitted, evaluates all schemes in catalog.
  - `profile` (`CitizenProfile`, required): Demographics (`age`, `state`, `residence_type`, `occupation`, `annual_income`, `owns_cultivable_land`, `owns_pucca_house`, `is_tax_payer`, `is_government_employee`).
- **Validation**:
  - Validates `scheme_id` against verified catalog. Returns 404/error if unknown.
  - Validates `profile` types and constraints (`age` 0-130, `annual_income` >= 0).
- **Rules Enforced**:
  - Never interprets missing fields as negative answers.
  - Generates clear `next_question` targeting the first missing criterion.
- **Data Returned**:
  - `scheme_id`: Identifier.
  - `scheme_title`: Title.
  - `outcome`: `"meets_known_criteria" | "does_not_meet_known_criteria" | "needs_verification"`.
  - `reasons`: Array of human-readable rationale strings.
  - `criteria_matched`: Array of satisfied rules.
  - `criteria_not_met`: Array of failed rules.
  - `missing_information`: Array of missing fields needed to confirm eligibility.

#### 3. `get_scheme_details`
- **Purpose**: Retrieves full verified details, benefits, eligibility criteria, and required documents for a single scheme.
- **Parameters**:
  - `scheme_id` (`string`, required): Unique scheme ID (e.g. `pmay-g`).
- **Validation**:
  - Scheme ID must exist in verified catalog.
- **Data Returned**:
  - Full `SchemeDetail` object (`id`, `title`, `category`, `ministry`, `nodal_agency`, `detailed_benefits`, `eligibility_summary`, `eligibility_criteria`, `required_documents`, `application_mode`, `application_steps`, `official_portal_url`, `verification_source`, `verification_date`).

#### 4. `map_documents`
- **Purpose**: Compares document requirements across multiple schemes, detects cross-scheme reusability, and calculates citizen document readiness score.
- **Parameters**:
  - `scheme_ids` (`list[string]`, required): List of 1 or more scheme IDs.
  - `citizen_documents` (`list[string]`, optional): Documents the citizen currently has in hand.
  - `profile` (`CitizenProfile`, optional): Alternative source for available documents.
- **Validation**:
  - `scheme_ids` must not be empty.
  - Every scheme ID must exist in the verified catalog.
- **Data Returned**:
  - `total_unique_required_documents`: Total distinct documents.
  - `reusable_documents`: Documents required by 2+ selected schemes.
  - `single_scheme_documents`: Documents required by only 1 selected scheme.
  - `available_documents`: Required documents citizen already has.
  - `missing_documents`: Required documents citizen needs to procure.
  - `readiness_score`: `{ score_percentage, numerator, denominator, formula, disclaimer }`.

#### 5. `generate_passport`
- **Purpose**: Prepares and validates a downloadable SevAIQ Scheme Readiness Passport PDF for selected schemes.
- **Parameters**:
  - `scheme_ids` (`list[string]`, required, non-empty, unique).
  - `profile` (`CitizenProfile`, required).
  - `citizen_documents` (`list[string]`, optional).
  - `notes` (`string`, optional, max 500 chars).
- **Validation**:
  - Scheme list cannot be empty.
  - Duplicate scheme IDs are rejected.
  - All schemes must exist.
  - PDF generation must succeed before returning `success: true`.
- **Data Returned**:
  - `filename`: `"SevAIQ_Scheme_Passport.pdf"`.
  - `download_endpoint`: `"/api/passport/pdf"`.
  - `schemes_included`: List of scheme IDs included.
  - `readiness_percentage`: Computed document preparedness score.
  - `generation_timestamp`: ISO timestamp.
  - `pdf_base64`: Base64 encoded string of generated PDF for direct client preview / download.
- **Frontend Download Integration**:
  - The frontend MUST render a clickable download mechanism (e.g. "Download Passport (PDF)") linking to `download_endpoint` or saving the `pdf_base64` blob.
  - The frontend MUST NEVER render the raw base64 string as chat text or message content.

#### 6. `get_application_guidance`
- **Purpose**: Provides official application channels, step-by-step guidance, and portal links. Incorporates citizen-recorded progress without claiming live government portal integration.
- **Parameters**:
  - `scheme_id` (`string`, required).
- **Validation**:
  - Scheme ID must exist.
- **Data Returned**:
  - `scheme_title`: Title.
  - `application_mode`: e.g. "Online / CSC (Common Service Centre)".
  - `application_steps`: Array of official verified steps.
  - `official_portal_url`: Verified official government URL.
  - `user_recorded_status`: User-recorded tracking state (e.g. "Draft prepared") or "Not yet recorded".
  - `portal_status_notice`: Clarification that user-recorded status represents citizen notes, not official backend portal tracking.

---

### 4.2 Frontend-Only Actions (Executed by Client)

When the chatbot detects user intent that requires a client-side interaction, it returns an action result with `data.execution = "client_side"`:

#### 7. `navigate_to`
- **Target**: `"schemes" | "eligibility" | "documents" | "passport" | "tracking"`.
- **Backend Response**:
  - `summary`: "Navigating to the Scheme Directory..." (or Tamil equivalent).
  - `data`: `{ "target": "schemes", "execution": "client_side" }`.

#### 8. `set_language`
- **Target**: `"en" | "ta"`.
- **Backend Response**:
  - `summary`: "Language switched to Tamil (தமிழ்)."
  - `data`: `{ "language": "ta", "execution": "client_side" }`.

#### 9. `clear_session`
- **Requires Confirmation**: `true`.
- **Backend Response**:
  - `summary`: "Please confirm if you want to clear all personal profile data and reset the session."
  - `data`: `{ "action": "clear_session", "execution": "client_side" }`.

#### 10. `speak_text`
- **Parameters**: `text` (`string`), `language` (`string`).
- **Backend Response**:
  - `data`: `{ "text": "...", "language": "ta", "execution": "client_side" }`.

---

## 5. Request & Response Examples

### Example 1: `discover_schemes` (English)
**Request**:
```http
POST /api/chat/action
Content-Type: application/json

{
  "action": "discover_schemes",
  "payload": {
    "query": "farming"
  },
  "language": "en"
}
```

**Response**:
```json
{
  "success": true,
  "action": "discover_schemes",
  "summary": "Found 1 verified scheme matching 'farming': Pradhan Mantri Kisan Samman Nidhi (PM-KISAN).",
  "data": {
    "match_count": 1,
    "schemes": [
      {
        "id": "pm-kisan",
        "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "category": "Agriculture & Farmer Welfare",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "short_description": "Financial benefit of ₹6,000 per year in three equal installments for landholding farmer families.",
        "official_portal_url": "https://pmkisan.gov.in",
        "verification_source": "pmkisan.gov.in official operational guidelines"
      }
    ]
  },
  "sources": [
    {
      "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "url": "https://pmkisan.gov.in",
      "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)",
      "verification_date": "2024-02-28"
    }
  ],
  "requires_confirmation": false,
  "next_question": null,
  "error": null
}
```

---

### Example 2: `check_eligibility` (Tamil with Missing Field)
**Request**:
```http
POST /api/chat/action
Content-Type: application/json

{
  "action": "check_eligibility",
  "payload": {
    "scheme_id": "pm-kisan",
    "profile": {
      "age": 42,
      "state": "Tamil Nadu",
      "occupation": "farmer",
      "annual_income": 120000
    }
  },
  "language": "ta"
}
```

**Response**:
```json
{
  "success": true,
  "action": "check_eligibility",
  "summary": "PM-KISAN திட்டத்திற்கான அறியப்பட்ட தகுதிகளைச் சரிபார்க்க நில உரிமை விவரம் தேவைப்படுகிறது.",
  "data": {
    "scheme_id": "pm-kisan",
    "scheme_title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    "category": "Agriculture & Farmer Welfare",
    "outcome": "needs_verification",
    "criteria_matched": [
      "Age (42) satisfies minimum age requirement of 18 years.",
      "Occupation 'farmer' matches eligible occupations."
    ],
    "criteria_not_met": [],
    "missing_information": [
      "Cultivable agricultural landholding status is required for this scheme.",
      "Income tax payer status is required to verify non-taxpayer exclusion.",
      "Government employee status is required to verify public servant exclusion."
    ]
  },
  "sources": [
    {
      "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "url": "https://pmkisan.gov.in",
      "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)",
      "verification_date": "2024-02-28"
    }
  ],
  "requires_confirmation": false,
  "next_question": "உங்களிடம் பயிரிடக்கூடிய விவசாய நிலம் உள்ளதா?",
  "error": null
}
```

---

### Example 3: `map_documents` (English)
**Request**:
```http
POST /api/chat/action
Content-Type: application/json

{
  "action": "map_documents",
  "payload": {
    "scheme_ids": ["pm-kisan", "pm-jay"],
    "citizen_documents": ["Aadhaar Card", "Bank Account Passbook"]
  },
  "language": "en"
}
```

**Response**:
```json
{
  "success": true,
  "action": "map_documents",
  "summary": "Analyzed requirements across 2 schemes. Found 4 unique required documents, including 2 reusable documents.",
  "data": {
    "selected_scheme_ids": ["pm-kisan", "pm-jay"],
    "total_unique_required_documents": 4,
    "reusable_documents": [
      {
        "canonical_name": "Aadhaar Card",
        "category": "Identity & Citizenship",
        "schemes_requiring": ["pm-kisan", "pm-jay"],
        "reusability_count": 2,
        "status": "available"
      },
      {
        "canonical_name": "Active Mobile Number",
        "category": "Communications & OTP Verification",
        "schemes_requiring": ["pm-kisan", "pm-jay"],
        "reusability_count": 2,
        "status": "missing"
      }
    ],
    "readiness_score": {
      "score_percentage": 50,
      "numerator": 2,
      "denominator": 4,
      "formula": "Readiness Score = (Unique Required Documents Available / Total Unique Required Documents) * 100",
      "disclaimer": "This score reflects document preparedness across selected schemes, not statutory or legal eligibility."
    }
  },
  "sources": [
    {
      "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "url": "https://pmkisan.gov.in",
      "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)",
      "verification_date": "2024-02-28"
    },
    {
      "title": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
      "url": "https://pmjay.gov.in",
      "verification_source": "National Health Authority (NHA) Scheme Guidelines & Ayushman Bharat Senior Citizen (70+) Expansion (pmjay.gov.in)",
      "verification_date": "2024-09-11"
    }
  ],
  "requires_confirmation": false,
  "next_question": null,
  "error": null
}
```

---

### Example 4: Conversational `/api/chat` with Natural Language Action
**Request**:
```http
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Am I eligible for PM Kisan? I am a 35 year old farmer with 2 acres of land."
    }
  ],
  "language": "en",
  "citizen_context": {
    "profile": {
      "age": 35,
      "occupation": "farmer",
      "owns_cultivable_land": true
    }
  }
}
```

**Response**:
```json
{
  "reply": "Based on official guidelines, you satisfy the age and agricultural landholding criteria for PM-KISAN. To confirm eligibility, we need to verify whether you pay income tax or work in a government department.",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "status": "success",
  "suggested_schemes": ["pm-kisan"],
  "action_result": {
    "success": true,
    "action": "check_eligibility",
    "summary": "Evaluated PM-KISAN for 35 year old farmer with cultivable land. Requires verification of non-taxpayer and non-government status.",
    "data": {
      "scheme_id": "pm-kisan",
      "outcome": "needs_verification",
      "criteria_matched": [
        "Age (35) satisfies minimum age requirement of 18 years.",
        "Occupation 'farmer' matches eligible occupations.",
        "Citizen holds cultivable agricultural land as required."
      ],
      "criteria_not_met": [],
      "missing_information": [
        "Income tax payer status is required to verify non-taxpayer exclusion.",
        "Government employee status is required to verify public servant exclusion."
      ]
    },
    "sources": [
      {
        "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "url": "https://pmkisan.gov.in",
        "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)",
        "verification_date": "2024-02-28"
      }
    ],
    "requires_confirmation": false,
    "next_question": "Are you or anyone in your household an income tax payer or government employee?",
    "error": null
  }
}
```

---

### Example 5: `generate_passport`
**Request**:
```http
POST /api/chat/action
Content-Type: application/json

{
  "action": "generate_passport",
  "payload": {
    "scheme_ids": ["pm-kisan"],
    "profile": {
      "age": 42,
      "occupation": "farmer",
      "annual_income": 120000,
      "owns_cultivable_land": true
    },
    "citizen_documents": ["Aadhaar Card", "Bank Account Passbook"],
    "notes": "Verified at local CSC."
  },
  "language": "en"
}
```

**Response**:
```json
{
  "success": true,
  "action": "generate_passport",
  "summary": "SevAIQ Scheme Passport PDF successfully generated for 1 scheme(s). You can download your official passport using the download button below.",
  "data": {
    "filename": "SevAIQ_Scheme_Passport.pdf",
    "download_endpoint": "/api/passport/pdf",
    "schemes_included": [
      "pm-kisan"
    ],
    "readiness_percentage": 67,
    "generation_timestamp": "2024-10-24T16:55:00Z",
    "pdf_base64": "JVBERi0xLjQKJ0xJTkUtQ0hFQ0tTCg==",
    "file_size_bytes": 14520
  },
  "sources": [
    {
      "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "url": "https://pmkisan.gov.in",
      "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)",
      "verification_date": "2024-02-28"
    }
  ],
  "requires_confirmation": false,
  "next_question": null,
  "error": null
}
```

---

## 6. Error Handling & Standard Codes

When an action fails or parameters are invalid, the endpoint responds with `HTTP 200` and `success: false` (or standard HTTP 4xx for malformed JSON):

```json
{
  "success": false,
  "action": "get_scheme_details",
  "summary": "Scheme with ID 'unknown-scheme-xyz' was not found in the verified catalog.",
  "data": {},
  "sources": [],
  "requires_confirmation": false,
  "next_question": null,
  "error": {
    "code": "SCHEME_NOT_FOUND",
    "message": "Scheme 'unknown-scheme-xyz' was not found in the verified catalog.",
    "details": {
      "requested_scheme_id": "unknown-scheme-xyz"
    }
  }
}
```

### Standard Error Codes:
- `SCHEME_NOT_FOUND`: The requested scheme ID is not present in the verified catalog.
- `INVALID_ARGUMENTS`: Required arguments are missing or violating constraints (e.g. negative income).
- `EMPTY_SCHEME_LIST`: At least one scheme ID is required for document mapping or passport generation.
- `DUPLICATE_SCHEME_IDS`: Multiple instances of the same scheme ID were provided.
- `UNSUPPORTED_ACTION`: The requested action is not in the controlled allowlist.
- `GENERATION_FAILED`: PDF generator or ReportLab encountered an internal failure.
- `AI_PROVIDER_ERROR`: Upstream Gemini error or timeout. Fallback explanation is returned.

---

## 7. Frontend Agent Implementation Guide

1. **How to call actions directly**:
   - For UI buttons (e.g. "Check Eligibility", "Generate Passport", "Map Documents"), call `POST /api/chat/action` with `{ action, payload, language }`.
   - Inspect `response.success`:
     - If `true`, render the structured data card from `response.data`.
     - If `false`, display `response.error.message` with a retry option.
2. **How to handle conversational actions**:
   - When calling `POST /api/chat`, inspect `response.action_result`.
   - If present, render the action result widget (e.g., scheme preview card, eligibility checklist, or document readiness bar) immediately below the assistant's message bubble.
3. **Handling `requires_confirmation`**:
   - If `action_result.requires_confirmation === true`, display a confirmation dialog before executing the client-side state change (e.g. clearing Kiosk session storage).
4. **Handling `next_question`**:
   - If `action_result.next_question` is present, display it as a suggested quick-reply chip to guide the citizen.
5. **Handling Passport Downloads**:
   - When `generate_passport` succeeds, render a primary "Download Passport (PDF)" button pointing to `data.download_endpoint` or triggering a file download using `data:application/pdf;base64,...`.
   - Never render `data.pdf_base64` as message text or markdown content.

---

## 8. Deployment & Vercel Serverless Architecture

- **Serverless Entrypoint**: Vercel executes `backend/index.py`, which exposes `app` imported from `app.main`.
- **Registered Routes**: All chat and action endpoints (`/api/chat`, `/api/chat/action`, `/api/chat/actions`) are registered directly on `app.main.app`.
- **Stateless & Ephemeral**: PDF generation and document mapping execute strictly in-memory using `io.BytesIO`. No temporary files or citizen PII are written to the filesystem, adhering to Vercel's read-only serverless architecture.

