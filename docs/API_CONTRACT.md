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
- **Frontend Port**: `5173` (e.g., `http://localhost:5173`)
- **Interactive Documentation**: `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` (ReDoc)

### CORS (Cross-Origin Resource Sharing)
The backend must permit requests from the local frontend Vite dev server:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- Configurable via `CORS_ORIGINS` environment variable.

---

## 3. Active Endpoints (Task 1 Foundation)

### 3.1 Health Check

Returns the runtime health status of the backend service. Used by the frontend header indicator to display real-time API connectivity.

- **Method**: `GET`
- **Path**: `/api/health`
- **Authentication**: None
- **Query Parameters**: None

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

Retrieves all verified government schemes currently available in the system.

- **Method**: `GET`
- **Path**: `/api/schemes`
- **Authentication**: None
- **Query Parameters**: None (Filtering / pagination planned for subsequent tasks)

#### Initial Foundation Behavior
Until verified scheme data is ingested and verified from official government portals, this endpoint returns an **empty JSON list**:
```json
[]
```

#### Response Model (When Populated with Verified Schemes)
- **Status Code**: `200 OK`
- **Content-Type**: `application/json`

```json
[
  {
    "id": "pm-kisan",
    "title": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    "short_description": "Income support of ₹6,000 per year in three equal installments to all landholding farmer families.",
    "category": "Agriculture",
    "ministry": "Ministry of Agriculture and Farmers Welfare",
    "beneficiary_type": "Small and Marginal Farmers",
    "official_portal_url": "https://pmkisan.gov.in",
    "verified": true,
    "verification_source": "Official Portal pmkisan.gov.in"
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

## 5. Planned Endpoints for Future Tasks (Roadmap)

These endpoints are documented for architectural alignment between Developer 1 and Developer 2:

| Endpoint | Method | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `/api/schemes/{id}` | `GET` | Get full details, eligibility criteria & document requirements for a scheme | Planned |
| `/api/categories` | `GET` | List distinct verified scheme categories & counts | Planned |
| `/api/eligibility/check` | `POST` | Check citizen profile criteria against scheme eligibility rules | Planned |
| `/api/chat/query` | `POST` | Natural-language conversational query over verified schemes | Planned |

---

## 6. Data Verification Guidelines for Developer 2

When populating `backend/app/data/schemes.json`:
1. Every entry must include `official_portal_url` and `verification_source`.
2. Do not use synthetic or placeholder schemes in production data.
3. Validate each scheme against the `Scheme` Pydantic model.
