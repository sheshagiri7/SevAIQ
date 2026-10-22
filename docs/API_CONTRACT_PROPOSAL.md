# Proposed API Contract Extension (v0.2.0 Proposal)
**Seva First Innovation Challenge 2026**  
**Author:** Developer 1 (Frontend & Integration Lead)  
**Target Recipient:** Developer 2 (Backend Lead)  
**Status:** PROPOSED FOR COORDINATION (NOT YET IMPLEMENTED IN BACKEND)

---

## 1. Overview & Motivation

The Task 1 project foundation implemented basic foundation endpoints:
- `GET /api/health`
- `GET /api/schemes` (returns an array of basic schemes)

During frontend Milestone 1 development (Scheme Discovery, Eligibility Engine, Document Mapper, and Scheme Readiness Passport), we identified metadata required for client-server consistency:
1. **Scheme Model Expansion**: Rich criteria specifications, document requirements, and verification dates.
2. **Server-Side Eligibility Validation**: `POST /api/eligibility/check` for dual verification.
3. **Master Document Catalog**: `GET /api/documents` to standardize document issuing authorities.
4. **Scheme Readiness Passport Validation**: `POST /api/passport/validate` for official tamper-proof verification.

> [!IMPORTANT]
> This document is a **collaborative proposal**. The active contract in `docs/API_CONTRACT.md` remains unchanged until Developer 2 reviews and approves these additions.

---

## 2. Wire Format & Normalization Convention

To preserve idiomatic backend Python/FastAPI conventions while maintaining clean TypeScript types:
- **Wire Format (JSON over HTTP)**: All request bodies, response payloads, query parameters, and error objects strictly use **`snake_case`**.
- **Frontend Domain Models (TypeScript)**: The client application uses **`camelCase`** properties internally.
- **Client-Side Adapter**: The frontend provides an adapter layer (`src/utils/schemaAdapter.ts`) to normalize `snake_case` wire payloads into `camelCase` models upon receipt.

### 2.1 Wire-to-Client Mapping Specification

| Wire Key (`snake_case`) | TypeScript Property (`camelCase`) | Type | Description |
| :--- | :--- | :--- | :--- |
| `min_age` | `minAge` | `number \| undefined` | Minimum applicant age |
| `max_age` | `maxAge` | `number \| undefined` | Maximum applicant age |
| `allowed_genders` | `allowedGenders` | `string[] \| undefined` | Allowed applicant genders: `Male`, `Female`, `Transgender`, `All` |
| `allowed_areas` | `allowedAreas` | `string[] \| undefined` | Allowed geographic areas: `Rural`, `Urban`, `All` |
| `allowed_occupations` | `allowedOccupations` | `string[] \| undefined` | Target occupational groups |
| `max_income_bracket_index` | `maxIncomeBracketIndex` | `number \| undefined` | Maximum income ceiling index (0:<1L, 1:1-2.5L, 2:2.5-5L, 3:5-8L, 4:>8L) |
| `allowed_categories` | `allowedCategories` | `string[] \| undefined` | Social categories: `General`, `OBC`, `SC`, `ST`, `EWS` |
| `allowed_landholding` | `allowedLandholding` | `string[] \| undefined` | Landholding thresholds |
| `must_be_student` | `mustBeStudent` | `boolean \| undefined` | Requires active educational enrollment |
| `requires_disability` | `requiresDisability` | `boolean \| undefined` | Specifically designated for Divyangjan / PwD |
| `required_documents` | `required_documents` | `string[] \| undefined` | Identifiers of required documents |
| `benefits_summary` | `benefits_summary` | `string \| undefined` | Summary of financial/welfare entitlement |
| `application_mode` | `application_mode` | `string \| undefined` | `Online`, `CSC / Seva Kendra`, or `Both` |
| `verification_date` | `verification_date` | `string \| undefined` | Date of guidelines verification (`YYYY-MM-DD`) |

---

## 3. Proposed Schema Enhancements

### 3.1 Backend Pydantic Models (`app/schemas.py` Proposal)

```python
from typing import List, Optional
from pydantic import BaseModel, Field

class SchemeEligibilityRule(BaseModel):
    min_age: Optional[int] = Field(None, ge=0, le=120, description="Minimum applicant age")
    max_age: Optional[int] = Field(None, ge=0, le=120, description="Maximum applicant age")
    allowed_genders: Optional[List[str]] = Field(None, description="Allowed genders: Male, Female, Transgender, All")
    allowed_areas: Optional[List[str]] = Field(None, description="Allowed areas: Rural, Urban, All")
    allowed_occupations: Optional[List[str]] = Field(None, description="Target occupations")
    max_income_bracket_index: Optional[int] = Field(None, ge=0, le=4, description="0:<1L, 1:1-2.5L, 2:2.5-5L, 3:5-8L, 4:>8L")
    allowed_categories: Optional[List[str]] = Field(None, description="General, OBC, SC, ST, EWS")
    allowed_landholding: Optional[List[str]] = Field(None, description="None, Marginal (< 1 ha), Small (1-2 ha), Medium/Large (> 2 ha)")
    must_be_student: Optional[bool] = Field(False, description="Requires active educational enrollment")
    requires_disability: Optional[bool] = Field(False, description="Designated for Divyangjan / PwD")

class ExtendedScheme(BaseModel):
    id: str = Field(..., description="Unique scheme identifier (slug or code)")
    title: str = Field(..., description="Official title of the scheme")
    short_description: str = Field(..., description="Concise summary of benefits")
    category: str = Field(..., description="Domain/Sector (e.g., Agriculture, Healthcare, Education)")
    ministry: str = Field(..., description="Governing Ministry or Department")
    beneficiary_type: Optional[str] = Field(None, description="Target demographic / beneficiary group")
    official_portal_url: Optional[str] = Field(None, description="Official government portal link")
    verified: bool = Field(default=True, description="Official verification status flag")
    verification_source: Optional[str] = Field(None, description="Citation or official gazette/portal reference")
    verification_date: Optional[str] = Field(None, description="Date of guidelines verification (YYYY-MM-DD)")
    rules: Optional[SchemeEligibilityRule] = Field(None, description="Eligibility evaluation rule set")
    required_documents: Optional[List[str]] = Field(default_factory=list, description="IDs of required documents")
    benefits_summary: Optional[str] = Field(None, description="Quick summary of financial/welfare entitlement")
    application_mode: Optional[str] = Field("Online", description="Online, CSC / Seva Kendra, or Both")
```

---

## 4. Proposed Endpoints & Wire Format Examples

### 4.1 Server-Side Eligibility Evaluation

- **Method**: `POST`
- **Path**: `/api/eligibility/check`
- **Purpose**: Validate citizen profile parameters against active government schemes server-side.

#### Request Body (`snake_case`)
```json
{
  "age": 38,
  "gender": "Female",
  "state": "Karnataka",
  "area": "Rural",
  "occupation": "Farmer / Cultivator",
  "income_bracket": "1 - 2.5 Lakh",
  "category": "OBC",
  "landholding": "Small (1-2 ha)",
  "is_student": false,
  "has_disability": false,
  "target_scheme_ids": ["pm-kisan", "ab-pmjay"]
}
```

#### Successful Response (`snake_case`, HTTP 200 OK)
```json
{
  "evaluated_at": "2026-10-22T21:00:00Z",
  "results": [
    {
      "scheme_id": "pm-kisan",
      "overall_status": "met",
      "met_count": 5,
      "total_criteria": 5,
      "criteria": [
        {
          "id": "age",
          "label": "Age Requirement",
          "status": "met",
          "explanation": "Age 38 is within 18-100 years."
        },
        {
          "id": "gender",
          "label": "Gender Eligibility",
          "status": "met",
          "explanation": "Open to all genders."
        },
        {
          "id": "occupation",
          "label": "Occupational Eligibility",
          "status": "met",
          "explanation": "Farmer / Cultivator matches eligible occupations."
        },
        {
          "id": "landholding",
          "label": "Landholding Threshold",
          "status": "met",
          "explanation": "Small (1-2 ha) is within eligible threshold."
        },
        {
          "id": "area",
          "label": "Geographic Area",
          "status": "met",
          "explanation": "Rural residence qualifies."
        }
      ]
    }
  ]
}
```

#### Error Response (HTTP 422 Unprocessable Entity)
```json
{
  "detail": [
    {
      "loc": ["body", "age"],
      "msg": "Input should be greater than or equal to 0",
      "type": "greater_than_equal"
    }
  ]
}
```

---

### 4.2 Master Civic Document Catalog

- **Method**: `GET`
- **Path**: `/api/documents`
- **Purpose**: Retrieve standardized document definitions, descriptions, and issuing authorities.

#### Successful Response (`snake_case`, HTTP 200 OK)
```json
[
  {
    "id": "income-certificate",
    "name": "Income Certificate",
    "description": "Official revenue document certifying total annual family income.",
    "issuing_authority": "Revenue Department / Tahsildar / Sub-Divisional Magistrate (SDM)",
    "applicable_schemes": ["ab-pmjay", "nsp-post-matric", "pmay-g"]
  },
  {
    "id": "land-records",
    "name": "Land Ownership Records (RoR / Khasra-Khatauni)",
    "description": "Record of Rights verifying cultivable agricultural land title in claimant's name.",
    "issuing_authority": "Revenue / Land Records Department / Patwari",
    "applicable_schemes": ["pm-kisan"]
  }
]
```

---

### 4.3 Readiness Passport Verification & Stamp

- **Method**: `POST`
- **Path**: `/api/passport/validate`
- **Purpose**: Server verifies eligibility findings and document checklists to sign an authentic digital readiness token.

#### Request Body (`snake_case`)
```json
{
  "passport_id": "SEVAIQ-2026-A8K2-9M4P",
  "scheme_ids": ["pm-kisan", "ab-pmjay"],
  "ready_document_ids": ["domicile-certificate", "land-records"],
  "missing_document_ids": ["ration-card"]
}
```

#### Successful Response (`snake_case`, HTTP 200 OK)
```json
{
  "passport_id": "SEVAIQ-2026-A8K2-9M4P",
  "verification_status": "certified",
  "digital_signature": "sha256-verified-token...",
  "readiness_score": 67,
  "action_items": [
    "Procure Ration Card from Food & Civil Supplies Department"
  ]
}
```

---

## 5. Privacy & Compliance Mandates for Backend

1. **Zero Personal Contact Storage**: Never persist names, phone numbers, Aadhaar numbers, or bank account numbers in any database tables.
2. **Deterministic Evaluation**: Criteria evaluation in `/api/eligibility/check` must match the transparent logic in the frontend engine.
3. **Verified Sources Only**: In `schemes.json`, each scheme record must provide authentic `verification_source` and `verification_date`.
