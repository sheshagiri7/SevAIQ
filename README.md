# SevAIQ — Civic Intelligence Platform

[![Challenge](https://img.shields.io/badge/Challenge-Seva%20First%20Innovation%20Challenge%202026-blue)](https://github.com/sheshagiri7/SevAIQ)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript%20%2B%20Vite-61dafb)](frontend/)
[![Backend](https://img.shields.io/badge/Backend-Python%20%2B%20FastAPI-009688)](backend/)
[![Data](https://img.shields.io/badge/Data-Verified%20Government%20Schemes-orange)](backend/app/data/)

**SevAIQ** is an AI-powered civic intelligence platform created for the **Seva First Innovation Challenge 2026**. It connects citizens to verified government welfare and development programs without hallucinations or fabricated data.

---

## 🏛️ Project Architecture

```
SevAIQ/
├── frontend/                # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/      # UI components (Header, Hero, SchemeDiscovery, Handshake, Footer)
│   │   ├── services/        # Configurable API client (api.ts)
│   │   ├── types/           # Shared TypeScript interfaces
│   │   ├── App.tsx          # Main application shell
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Tailwind directives
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/                 # Python 3.10+ + FastAPI Application
│   ├── app/
│   │   ├── data/
│   │   │   └── schemes.json # Scheme data (initially empty array until verified)
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI server with CORS & routes (/api/health, /api/schemes)
│   │   └── schemas.py       # Pydantic models (HealthResponse, Scheme)
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_api.py      # Pytest test suite
│   └── requirements.txt
├── docs/
│   └── API_CONTRACT.md      # Full API contract between Developer 1 and Developer 2
├── .env.example             # Placeholder environment template
├── .gitignore               # Ignored files (Python, Node.js, venv, PDFs, OS)
└── README.md                # Project documentation & macOS execution instructions
```

---

## 🚀 Quick Start Guide (macOS)

Frontend and backend run **independently** in separate terminal windows.

### Prerequisites on macOS
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (tested on Python 3.14)
- **Git**

---

### Step 1: Clone Repository

```bash
git clone https://github.com/sheshagiri7/SevAIQ.git
cd SevAIQ
```

---

### Step 2: Configure Environment Variables (Optional)

Create a local `.env` file if you wish to override default ports or URLs:

```bash
cp .env.example .env
```

Defaults:
- Frontend dev server: `http://localhost:5173`
- Backend API server: `http://localhost:8000`

---

### Step 3: Run the Backend (FastAPI)

Open **Terminal Tab 1**:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python3 -m venv .venv

# 3. Activate virtual environment
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start the FastAPI development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify backend in your browser:
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Schemes Endpoint: [http://localhost:8000/api/schemes](http://localhost:8000/api/schemes)
- Interactive OpenAPI Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

To run backend tests:
```bash
# From backend directory with .venv activated:
pytest tests/
```

---

### Step 4: Run the Frontend (React + Vite)

Open **Terminal Tab 2**:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install npm packages
npm install

# 3. Start Vite dev server
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173).

To run a production build check:
```bash
cd frontend
npm run build
```

---

## 📡 Active API Endpoints

See complete request/response specifications in [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

| Method | Endpoint | Description | Initial Behavior |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status | Returns `{"status":"healthy","service":"SevAIQ Backend","version":"0.1.0"}` |
| `GET` | `/api/schemes` | List verified government schemes | Returns `[]` (empty list until verified data is added) |
| `GET` | `/docs` | Swagger interactive documentation | Full OpenAPI specification |

---

## 🛡️ Zero Hallucination & Data Integrity

SevAIQ adheres strictly to civic tech integrity:
- **No synthetic schemes**: Data in `backend/app/data/schemes.json` will only contain schemes verified against official gazettes or ministries (e.g., `pmkisan.gov.in`, `india.gov.in`).
- **Graceful Empty State**: The UI accurately informs citizens that scheme data is undergoing official verification.

---

## 👥 Team Responsibilities

- **Developer 1**: Frontend development, UI/UX, civic design system, API integration.
- **Developer 2**: Backend development, scheme data verification, eligibility logic, database/storage.
