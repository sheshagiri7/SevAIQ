# SevAIQ API Contract (v0.1.0)
**Seva First Innovation Challenge 2026**  
**Document Version:** 0.1.0  
**Ownership:** Shared Contract between Frontend (Developer 1) and Backend (Developer 2)

---

## 1. Overview & Principles

SevAIQ is a civic intelligence platform designed to empower citizens by discovering and matching them with government welfare and development schemes.

### Core Principles
1. **Zero Hallucination / Verified Data Only**: No schemes may be fabricated or simulated. Every scheme record in the backend must originate from an official government source (e.g., official ministry portals, gazette notifications, India.gov.in, state portals).
2. **Decoupled Architecture**: Frontend (React + TypeScript + Vite) and Backend (Python + FastAPI) are independently runnable and communicate strictly over RESTful JSON APIs.
3. **Graceful Fallbacks**: The frontend must handle empty states, loading states, and backend connectivity outages with clear user feedback.

---

## 2. Server & Environment Configuration

### Local Base URL
- **Backend Port**: `8000` (e.g., `http://localhost:8000` or `http://127.0.0.1:8000`)
- **Frontend Port**: `5173` (e.g., `http://localhost:5173` or `http://127.0.0.1:5173`)
- **Interactive Documentation**: `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` (ReDoc)

### CORS (Cross-Origin Resource Sharing)
The backend permits requests from the local frontend Vite dev server:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- Configurable via `CORS_ORIGINS` environment variable.

### Local Integration Setup (Step-by-Step)

#### Step A: Run FastAPI Backend (Terminal 1)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Verify backend connectivity:
```bash
curl http://localhost:8000/api/health
```

#### Step B: Run React Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. The frontend automatically queries `http://localhost:8000/api/health` and displays the real-time API connection badge in the header.

---

## 3. Active Endpoints (Currently Implemented)

### 3.1 Service Health Check

Returns the runtime health status of the backend service. Used by the frontend header indicator and DeveloperHandshake component.

- **Method**: `GET`
- **Path**: `/api/health`
- **Authentication**: None
- **Query Parameters**: None

#### Example Request (cURL)
```bash
curl -X GET "http://localhost:8000/api/health" \
  -H "Accept: application/json"
```

#### Example Request (Frontend TypeScript / Fetch)
```typescript
const response = await fetch('http://localhost:8000/api/health', {
  headers: { 'Accept': 'application/json' },
});
const data: HealthResponse = await response.json();
```

#### Successful Response (200 OK)
```json
{
  "status": "healthy",
  "service": "SevAIQ Backend",
  "version": "0.1.0"
}
```

#### TypeScript Interface
```typescript
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
}
```

---

### 3.2 List Government Schemes

Retrieves verified government schemes available in the system with optional search and category filtering.

- **Method**: `GET`
- **Path**: `/api/schemes`
- **Authentication**: None
- **Query Parameters**:
  - `category` (optional, string): Case-insensitive category filter (e.g. `Healthcare`, `Agriculture`)
  - `q` (optional, string): Search term matched against title, short description, or ministry

#### Example Request (cURL)
```bash
curl -X GET "http://localhost:8000/api/schemes?category=Healthcare" \
  -H "Accept: application/json"
```

#### Example Request (Frontend TypeScript / Fetch)
```typescript
const response = await fetch('http://localhost:8000/api/schemes', {
  headers: { 'Accept': 'application/json' },
});
const data: Scheme[] = await response.json();
```

#### Populated Response Model (200 OK)
Returns verified schemes (8 active central schemes):
```json
[
  {
    "id": "pm-kisan",
    "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    "short_description": "Income support of ₹6,000 per year in three equal four-monthly installments of ₹2,000 directly to landholding farmer families.",
    "category": "Agriculture & Rural",
    "ministry": "Ministry of Agriculture and Farmers Welfare",
    "beneficiary_type": "Small and Marginal Landholding Farmers",
    "official_portal_url": "https://pmkisan.gov.in",
    "verified": true,
    "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)"
  }
]
```

#### TypeScript Interface
```typescript
export interface Scheme {
  id: string;
  title: string;
  short_description: string;
  category: string;
  ministry: string;
  beneficiary_type?: string | null;
  official_portal_url?: string | null;
  verified: boolean;
  verification_source?: string | null;
}
```

---

### 3.3 Scheme Details by ID

Retrieves verified full details, granular eligibility criteria, required documents, and step-by-step application instructions for a specific scheme.

- **Method**: `GET`
- **Path**: `/api/schemes/{id}` (e.g. `/api/schemes/pm-kisan`)
- **Authentication**: None

#### Successful Response (200 OK)
```json
{
  "id": "pm-kisan",
  "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
  "short_description": "Income support of ₹6,000 per year in three equal four-monthly installments of ₹2,000 directly to landholding farmer families.",
  "category": "Agriculture & Rural",
  "ministry": "Ministry of Agriculture and Farmers Welfare",
  "beneficiary_type": "Small and Marginal Landholding Farmers",
  "official_portal_url": "https://pmkisan.gov.in",
  "verified": true,
  "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)",
  "verification_date": "2026-10-22",
  "nodal_agency": "Department of Agriculture & Farmers Welfare (DA&FW)",
  "detailed_benefits": "Direct financial benefit of ₹6,000 per annum per eligible farmer family...",
  "eligibility_summary": "All landholding farmer families having cultivable landholding in their names...",
  "eligibility_criteria": {
    "min_age": 18,
    "occupations": ["farmer", "agriculturalist"],
    "land_ownership_required": true,
    "tax_payer_allowed": false
  },
  "required_documents": [
    "Aadhaar Card",
    "Land Ownership Record / Record of Rights (RoR) / Khasra-Khatauni",
    "Bank Account Passbook (Aadhaar linked with NPCI mapper)",
    "Active Mobile Number"
  ],
  "application_mode": "Online self-registration on pmkisan.gov.in or in-person via Common Service Centres (CSCs)",
  "application_steps": [
    "Visit pmkisan.gov.in and click on 'New Farmer Registration'",
    "Enter Aadhaar number and select state...",
    "Fill landholding details...",
    "Submit application for verification by State Nodal Officer"
  ]
}
```

#### Error Response (404 Not Found)
If the scheme ID does not exist in the verified catalog:
```json
{
  "detail": "Scheme with ID 'unknown-id' was not found in the verified catalog."
}
```

---

### 3.4 Distinct Scheme Categories & Counts

Retrieves distinct scheme categories and their verified scheme counts for frontend filter pills.

- **Method**: `GET`
- **Path**: `/api/categories`
- **Authentication**: None

#### Successful Response (200 OK)
```json
[
  { "category": "Housing & Infrastructure", "count": 2 },
  { "category": "Financial Inclusion & Livelihood", "count": 2 },
  { "category": "Agriculture & Rural", "count": 1 },
  { "category": "Healthcare & Wellness", "count": 1 },
  { "category": "Social Security & Pensions", "count": 1 },
  { "category": "Skill Development & Livelihood", "count": 1 }
]
```

---

### 3.5 Explainable Scheme Eligibility Check

Evaluates a citizen's profile against all verified government schemes using transparent three-valued logic (`meets_known_criteria`, `does_not_meet_known_criteria`, `needs_verification`).

- **Method**: `POST`
- **Path**: `/api/eligibility/check`
- **Content-Type**: `application/json`
- **Authentication**: None

#### Example Request Body (`CitizenProfile`)
```json
{
  "age": 42,
  "state": "Karnataka",
  "residence_type": "rural",
  "occupation": "farmer",
  "annual_income": 120000,
  "owns_cultivable_land": true,
  "owns_pucca_house": false,
  "is_tax_payer": false,
  "is_government_employee": false,
  "available_documents": ["Aadhaar Card", "Bank Account Passbook"]
}
```

#### Example Request (cURL)
```bash
curl -X POST "http://localhost:8000/api/eligibility/check" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 42,
    "residence_type": "rural",
    "occupation": "farmer",
    "owns_cultivable_land": true,
    "is_tax_payer": false
  }'
```

#### Example Successful Response (200 OK — `EligibilityCheckResponse`)
```json
{
  "total_schemes_evaluated": 8,
  "summary": {
    "meets_known_criteria": 3,
    "does_not_meet_known_criteria": 2,
    "needs_verification": 3
  },
  "schemes": [
    {
      "scheme_id": "pm-kisan",
      "scheme_title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "category": "Agriculture & Rural",
      "outcome": "meets_known_criteria",
      "reasons": [
        "Citizen satisfies all 4 verified statutory eligibility criteria defined for this scheme.",
        "Age (42) satisfies minimum age requirement of 18 years.",
        "Occupation 'farmer' matches eligible occupations.",
        "Citizen holds cultivable agricultural land as required.",
        "Citizen is not an income tax payer, meeting statutory exclusion requirement."
      ],
      "criteria_matched": [
        "Age (42) satisfies minimum age requirement of 18 years.",
        "Occupation 'farmer' matches eligible occupations.",
        "Citizen holds cultivable agricultural land as required.",
        "Citizen is not an income tax payer, meeting statutory exclusion requirement."
      ],
      "criteria_not_met": [],
      "missing_information": [],
      "official_portal_url": "https://pmkisan.gov.in",
      "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)"
    },
    {
      "scheme_id": "atal-pension-yojana",
      "scheme_title": "Atal Pension Yojana (APY)",
      "category": "Social Security & Pensions",
      "outcome": "does_not_meet_known_criteria",
      "reasons": [
        "Disqualified: Age (42) exceeds the maximum eligible age limit of 40 years."
      ],
      "criteria_matched": [
        "Age (42) satisfies minimum age requirement of 18 years.",
        "Citizen is not an income tax payer, meeting statutory exclusion requirement."
      ],
      "criteria_not_met": [
        "Age (42) exceeds the maximum eligible age limit of 40 years."
      ],
      "missing_information": [],
      "official_portal_url": "https://www.npscra.nsdl.co.in",
      "verification_source": "Pension Fund Regulatory and Development Authority (PFRDA) APY Rules (npscra.nsdl.co.in)"
    }
  ]
}
```

---

### 3.6 Cross-Scheme Document Mapper

Analyzes document requirements across selected government schemes, normalizes document names, identifies cross-scheme reusability, and calculates a transparent citizen document-readiness score.

- **Method**: `POST`
- **Path**: `/api/documents/mapper`
- **Content-Type**: `application/json`
- **Authentication**: None

#### Document Readiness Score Formula
$$\text{Readiness Score (\%)} = \text{round}\left(\frac{\text{Available Distinct Required Documents}}{\text{Total Unique Required Documents}} \times 100\right)$$

*Clarity Note: The readiness score measures document preparedness across the selected schemes based on distinct required documents without double-counting shared documents. It does not evaluate statutory eligibility, verify document authenticity, or guarantee government benefit approval.*

#### Example Request Body (`DocumentMapperRequest`)
```json
{
  "scheme_ids": ["pm-kisan", "pm-jay", "atal-pension-yojana"],
  "citizen_documents": ["Aadhaar Card", "Bank Account Passbook"]
}
```

#### Example Successful Response (200 OK — `DocumentMappingResponse`)
```json
{
  "selected_scheme_ids": ["pm-kisan", "pm-jay", "atal-pension-yojana"],
  "selected_schemes_summary": [
    {"id": "pm-kisan", "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)"},
    {"id": "pm-jay", "title": "Ayushman Bharat - PM-JAY"},
    {"id": "atal-pension-yojana", "title": "Atal Pension Yojana (APY)"}
  ],
  "total_unique_required_documents": 5,
  "reusable_documents": [
    {
      "canonical_name": "Aadhaar Card",
      "raw_names": ["Aadhaar Card"],
      "schemes_requiring": ["atal-pension-yojana", "pm-jay", "pm-kisan"],
      "reusability_count": 3,
      "status": "available",
      "category": "Identity & Address Proof"
    },
    {
      "canonical_name": "Active Mobile Number",
      "raw_names": ["Active Mobile Number"],
      "schemes_requiring": ["atal-pension-yojana", "pm-jay", "pm-kisan"],
      "reusability_count": 3,
      "status": "missing",
      "category": "Communications & OTP Verification"
    },
    {
      "canonical_name": "Bank Account Passbook",
      "raw_names": [
        "Bank Account Passbook (Aadhaar linked with NPCI mapper)",
        "Savings Bank Account Passbook with Auto-Debit facility"
      ],
      "schemes_requiring": ["atal-pension-yojana", "pm-kisan"],
      "reusability_count": 2,
      "status": "available",
      "category": "Financial & Banking Records"
    }
  ],
  "single_scheme_documents": [
    {
      "canonical_name": "Land Ownership Document (RoR / Title Deed)",
      "raw_names": ["Land Ownership Record / Record of Rights (RoR) / Khasra-Khatauni"],
      "schemes_requiring": ["pm-kisan"],
      "reusability_count": 1,
      "status": "missing",
      "category": "Property & Land Records"
    },
    {
      "canonical_name": "Ration Card / Family ID",
      "raw_names": ["Ration Card / Family ID / NFSA Card"],
      "schemes_requiring": ["pm-jay"],
      "reusability_count": 1,
      "status": "missing",
      "category": "Socioeconomic & Family Records"
    }
  ],
  "available_documents": [
    {
      "canonical_name": "Aadhaar Card",
      "status": "available",
      "reusability_count": 3
    },
    {
      "canonical_name": "Bank Account Passbook",
      "status": "available",
      "reusability_count": 2
    }
  ],
  "missing_documents": [
    {
      "canonical_name": "Active Mobile Number",
      "status": "missing",
      "reusability_count": 3
    },
    {
      "canonical_name": "Land Ownership Document (RoR / Title Deed)",
      "status": "missing",
      "reusability_count": 1
    },
    {
      "canonical_name": "Ration Card / Family ID",
      "status": "missing",
      "reusability_count": 1
    }
  ],
  "unverified_requirements": [],
  "readiness_score": {
    "score_percentage": 40,
    "numerator": 2,
    "denominator": 5,
    "formula": "(Available Distinct Required Documents / Total Unique Required Documents) * 100",
    "disclaimer": "This readiness score measures document preparedness based on unique required documents across the selected schemes. It does not evaluate citizen statutory eligibility or guarantee government benefit approval."
  },
  "official_source_references": [
    {
      "scheme_id": "pm-kisan",
      "scheme_title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "official_portal_url": "https://pmkisan.gov.in",
      "verification_source": "Official Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)"
    }
  ]
}
```

#### Error Handling
- **400 Bad Request**: If `scheme_ids` is empty (`"At least one scheme ID must be provided."`) or contains duplicates (`"Duplicate scheme IDs provided: [...]"`).
- **404 Not Found**: If any requested scheme ID does not exist in the verified catalog.
- **422 Unprocessable Entity**: Malformed request structure.

---

### 3.7 SevAIQ Scheme Passport PDF Generator

Generates and downloads a printable, professional SevAIQ Scheme Passport PDF consolidating citizen demographic summary, explainable statutory scheme match outcomes, cross-scheme document mapping (reusable vs. single-scheme), available vs. missing documents checklist, transparent document-readiness score, official government portal links, verified source citations, and actionable application next steps.

- **Method**: `POST`
- **Path**: `/api/passport/pdf`
- **Request Content-Type**: `application/json`
- **Response Content-Type**: `application/pdf`
- **Response Header**: `Content-Disposition: attachment; filename="SevAIQ_Scheme_Passport.pdf"`
- **Authentication**: None

#### Privacy & Security Architecture
1. **Zero Disk Persistence**: Generated entirely in-memory using ReportLab and streaming bytes. No citizen PII or report PDFs are persisted to disk.
2. **PII Masking**: Only relevant demographic criteria indicators (age, state, residence type, occupation, landholding) are included in the report. Biometrics, Aadhaar numbers, and banking details are never stored or displayed.
3. **Internal Zero-Trust Computation**: Eligibility outcomes and document-readiness metrics are computed strictly by the backend engine; client-supplied scores are ignored.
4. **Statutory Non-Government Advisory**: Prominent legal disclaimers clarify that the passport is an informational readiness assessment and does not constitute a government application or guarantee of approval.

#### Request Schema (`PassportRequest`)
```json
{
  "scheme_ids": ["pm-kisan", "pm-jay", "atal-pension-yojana"],
  "profile": {
    "age": 42,
    "state": "Karnataka",
    "residence_type": "rural",
    "occupation": "farmer",
    "annual_income": 120000,
    "owns_cultivable_land": true,
    "owns_pucca_house": false,
    "is_tax_payer": false,
    "is_government_employee": false,
    "available_documents": ["Aadhaar Card", "Bank Account Passbook"]
  },
  "citizen_documents": ["Aadhaar Card", "Bank Account Passbook"],
  "notes": "Assisted submission via Gram Panchayat Seva Kendra"
}
```

#### TypeScript Interface
```typescript
export interface PassportRequest {
  scheme_ids: string[];
  profile: CitizenProfile;
  citizen_documents?: string[];
  notes?: string;
}
```

#### Example cURL Request (Downloading PDF)
```bash
curl -X POST "http://localhost:8000/api/passport/pdf" \
  -H "Content-Type: application/json" \
  -d '{
    "scheme_ids": ["pm-kisan", "pm-jay"],
    "profile": {
      "age": 42,
      "state": "Karnataka",
      "residence_type": "rural",
      "occupation": "farmer",
      "owns_cultivable_land": true,
      "is_tax_payer": false,
      "available_documents": ["Aadhaar Card", "Bank Account Passbook"]
    }
  }' \
  --output SevAIQ_Scheme_Passport.pdf
```

#### PDF Report Sections
1. **SevAIQ Header & Branding**: Platform title, Seva First Innovation Challenge 2026 tag, generated timestamp, reference ID.
2. **Statutory Advisory & Disclaimer**: Prominent legal warning that report is an advisory assessment, not a government grant or submission.
3. **Citizen Profile Summary**: Demographic indicators relevant to statutory evaluation (age, residence, state, occupation, landholding, tax status).
4. **Document Readiness Scorecard**: Large percentage badge, formula breakdown, numerator, denominator, and reusability count.
5. **Scheme Evaluation Breakdown**: Card for each scheme with outcome badge (`meets_known_criteria`, `needs_verification`, `does_not_meet_known_criteria`), plain-English reasons, matched rules, criteria needing verification, official portal URL, and source citation.
6. **Cross-Scheme Document Mapping**:
   - 4A. Reusable Documents (required by 2+ schemes) with status badges `[ ✓ AVAILABLE ]` / `[ ✗ MISSING ]`
   - 4B. Scheme-Specific Documents (required by 1 scheme)
   - 4C. Priority Action Items (missing documents checklist unblocking schemes)
7. **Actionable Next Steps**: 5-step roadmap covering document procurement, verification, CSC assisted submission, acknowledgment retention, and anti-fraud awareness.
8. **Running Headers & Footers**: Dynamic page numbering ("Page X of Y") and confidentiality notices via two-pass canvas.

#### Error Responses
- **400 Bad Request**: If `scheme_ids` is empty or contains duplicate IDs.
- **404 Not Found**: If any requested scheme ID does not exist in the verified catalog.
- **422 Unprocessable Entity**: Malformed request payload.
- **500 Internal Server Error**: PDF rendering failure.

---

### 3.8 Service Root Discovery

Returns service metadata and endpoint pointers.

- **Method**: `GET`
- **Path**: `/`
- **Response (200 OK)**:
```json
{
  "service": "SevAIQ Backend API",
  "challenge": "Seva First Innovation Challenge 2026",
  "docs": "/docs",
  "health": "/api/health",
  "schemes": "/api/schemes",
  "categories": "/api/categories",
  "eligibility_check": "/api/eligibility/check",
  "document_mapper": "/api/documents/mapper",
  "passport_pdf": "/api/passport/pdf"
}
```

---

## 4. Error Handling Standard

All non-2xx responses from the FastAPI backend follow standard FastAPI error envelope:

```json
{
  "detail": "Descriptive error message"
}
```

HTTP Status Codes:
- `200 OK`: Request succeeded.
- `400 Bad Request`: Invalid request parameters or body.
- `404 Not Found`: Requested resource does not exist.
- `422 Unprocessable Entity`: Validation failure on request parameters or payload.
- `500 Internal Server Error`: Server-side unhandled exception.

---

## 5. Endpoints Status & Technical Roadmap

| Endpoint | Method | Purpose | Status | Target Delivery |
| :--- | :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Service runtime health status | **Active (Verified)** | Task 1 |
| `/api/schemes` | `GET` | List verified government schemes (with search/filters) | **Active (Verified)** | Task 1 & 2 |
| `/api/schemes/{id}` | `GET` | Full details, eligibility criteria & documents for a scheme | **Active (Verified)** | Task 2 |
| `/api/categories` | `GET` | Distinct scheme categories & verified counts | **Active (Verified)** | Task 2 |
| `/api/eligibility/check` | `POST` | Evaluate citizen profile against verified criteria with explanations | **Active (Verified)** | Task 3 |
| `/api/documents/mapper` | `POST` | Identify reusable documents across schemes & readiness score | **Active (Verified)** | Task 4 |
| `/api/passport/pdf` | `POST` | Downloadable SevAIQ Scheme Passport PDF generator | **Active (Verified)** | Task 5 |




---

### 5.1 Planned Endpoint Specifications

#### A. `/api/schemes/{id}` (GET)
- **Path Parameter**: `id` (e.g., `pm-kisan`)
- **Response (200 OK)**:
```json
{
  "id": "pm-kisan",
  "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
  "short_description": "Income support of ₹6,000 per year in three equal installments.",
  "category": "Agriculture",
  "ministry": "Ministry of Agriculture and Farmers Welfare",
  "beneficiary_type": "Small and Marginal Farmers",
  "official_portal_url": "https://pmkisan.gov.in",
  "verified": true,
  "verification_source": "Official Portal pmkisan.gov.in",
  "detailed_benefits": "Financial benefit of ₹6,000 per annum per family payable in three 4-monthly installments.",
  "eligibility_criteria": {
    "min_age": 18,
    "occupation": ["farmer"],
    "land_ownership_required": true
  },
  "required_documents": [
    "Aadhaar Card",
    "Land Ownership Document (Record of Rights / Khasra-Khatauni)",
    "Bank Account Passbook (Aadhaar linked)"
  ],
  "application_mode": "Online via pmkisan.gov.in or CSC centers"
}
```

#### B. `/api/eligibility/check` (POST)
- **Request Body (`CitizenProfile`)**:
```json
{
  "age": 42,
  "gender": "male",
  "occupation": "farmer",
  "annual_income": 180000,
  "owns_land": true,
  "state": "Karnataka",
  "residence_type": "rural",
  "social_category": "General",
  "available_documents": ["Aadhaar Card", "Bank Account Passbook"]
}
```
- **Response (`EligibilityResult`)**:
```json
{
  "total_schemes_evaluated": 10,
  "eligible_schemes": [
    {
      "scheme_id": "pm-kisan",
      "scheme_title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "status": "eligible",
      "match_score": 100,
      "reasons": [
        "Age (42) meets minimum requirement (18+)",
        "Occupation is farmer/agriculturalist",
        "Owns cultivable land as required"
      ],
      "missing_documents": ["Land Ownership Document (Record of Rights / Khasra-Khatauni)"]
    }
  ],
  "ineligible_schemes": [
    {
      "scheme_id": "sukanya-samriddhi-yojana",
      "scheme_title": "Sukanya Samriddhi Yojana",
      "status": "ineligible",
      "reasons": [
        "Requires female beneficiary under 10 years of age"
      ]
    }
  ]
}
```

#### C. `/api/documents/mapper` (POST)
- **Request Body**:
```json
{
  "scheme_ids": ["pm-kisan", "pm-jay", "atal-pension-yojana"],
  "citizen_documents": ["Aadhaar Card", "Bank Account Passbook"]
}
```
- **Response**:
```json
{
  "total_schemes": 3,
  "overall_readiness_score": 66,
  "reusable_documents": [
    {
      "document_name": "Aadhaar Card",
      "used_in_schemes": ["pm-kisan", "pm-jay", "atal-pension-yojana"],
      "reusability_count": 3,
      "status": "available"
    },
    {
      "document_name": "Bank Account Passbook",
      "used_in_schemes": ["pm-kisan", "atal-pension-yojana"],
      "reusability_count": 2,
      "status": "available"
    }
  ],
  "missing_documents": [
    {
      "document_name": "Land Ownership Document (Record of Rights)",
      "required_by": ["pm-kisan"],
      "priority": "high"
    },
    {
      "document_name": "Ration Card / Income Certificate",
      "required_by": ["pm-jay"],
      "priority": "medium"
    }
  ]
}
```

#### D. `/api/passport/pdf` (POST)
- **Content-Type**: `application/json` (input) -> `application/pdf` (output)
- **Header**: `Content-Disposition: attachment; filename="SevAIQ_Scheme_Passport.pdf"`
- Generates a branded, printable Scheme Passport PDF summarizing the citizen's eligible schemes, document checklist, and step-by-step application guidance.

#### E. `/api/chat` (POST)
- **Purpose**: Civic-grounded AI Chatbot powered by Google Gemini (with modular multi-provider routing).
- **Request Body (`ChatRequest`)**:
```json
{
  "messages": [
    { "role": "user", "content": "How much financial assistance does PM-KISAN offer?" }
  ],
  "language": "en",
  "context_scheme_id": null
}
```
- **Response (`200 OK`, `ChatResponseSchema`)**:
```json
{
  "reply": "Under PM-KISAN, eligible small and marginal farmer families receive income support of ₹6,000 per year...",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "status": "success",
  "latency_ms": 320.5,
  "suggested_schemes": ["pm-kisan"]
}
```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or unauthorized Gemini API credentials (`auth_error`).
  - `429 Too Many Requests`: Gemini rate limit or project quota reached (`quota_exhausted`).
  - `503 Service Unavailable`: Unconfigured server or transient failure (`configuration_error`, `transient_error`).
  - `504 Gateway Timeout`: Upstream AI request timed out (`timeout`).

#### F. `/api/chat/providers` (GET)
- **Purpose**: List registered AI providers and their operational readiness status.
- **Response (`200 OK`)**:
```json
[
  {
    "provider_id": "gemini",
    "display_name": "Google Gemini",
    "configured": true,
    "status": "ready",
    "message": "Gemini provider configured using model gemini-2.5-flash."
  }
]
```

---

## 6. Data Verification Guidelines for Developer 2

When populating `backend/app/data/schemes.json`:
1. Every entry must include `official_portal_url` and `verification_source`.
2. Do not use synthetic or placeholder schemes in production data.
3. Validate each scheme against the `Scheme` Pydantic model.

