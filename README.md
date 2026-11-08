# RunwayPulse AI — Autonomous Startup Runway & Liquidity Intelligence

**RunwayPulse AI** is an AI-augmented, enterprise-grade financial health analytics cockpit and liquidity runway intelligence platform built for tech startup founders, venture boards, and fractional CFOs. 

It provides real-time scenario simulation, bi-directional collaborator synchronization via WebSockets, multi-tenant database isolation, multi-currency reporting, and an autonomous AI CFO copilot powered by `@google/genai` (`gemini-2.5-flash`) with deterministic heuristic fallbacks.

---

## ⚡ Core Architecture & Upgrades

```
┌────────────────────────────────────────────────────────┐
│             RunwayPulse Executive Frontend              │
│       Cyber-Glassmorphism UI • React 19 • Recharts     │
└───────────────▲────────────────────────▲───────────────┘
                │ HTTP / REST            │ WebSocket Sync
                │ (JWT Bearer Token)     │ (Socket.io)
┌───────────────▼────────────────────────▼───────────────┐
│               Node.js / Express API Engine             │
│        Port 5002 • CORS Guarded • verifyToken Gate     │
└───────┬────────────────────────┬───────────────┬───────┘
        │                        │               │
        ▼                        ▼               ▼
┌──────────────┐         ┌──────────────┐ ┌──────────────┐
│  Multi-Tenant│         │  AI CFO Gate │ │ Socket Engine│
│   MySQL 8.0  │         │@google/genai │ │ Live State   │
│ (user_id FK) │         │ (Gemini 2.5) │ │ Broadcast    │
└──────────────┘         └──────────────┘ └──────────────┘
```

### 1. Modern Visual Interface (Cyber-Glassmorphism)
- **Deep Midnight Radial Palette:** `radial-gradient(circle at 15% 15%, #0f172a 0%, #030712 100%)`
- **Frosted Glass Panels:** Translucent frosted containers (`rgba(15, 23, 42, 0.75)`, `backdrop-filter: blur(16px)`, `1px solid rgba(255, 255, 255, 0.08)`).
- **Controls & Sliders:** Glowing neon cyan (`#38bdf8`), violet (`#a855f7`), and amber (`#f59e0b`) range levers.
- **One-Click Strategic Presets:**
  - 🛡️ **Austerity:** 70% Hiring | 70% Marketing | 1.0% Yield
  - ⚖️ **Baseline:** 100% Hiring | 100% Marketing | 1.5% Yield
  - 🚀 **Hypergrowth:** 150% Hiring | 140% Marketing | 2.5% Yield
- **Multi-Currency Formatting:** Instant USD ($) / INR (₹) toggle with regional thousand-separator formatting (`en-US` and `en-IN`).
- **High Data-Ink Ratio:** Telemetry deck covering Algorithmic Runway, Terminal Monthly Burn, Treasury Cash, and Baseline MRR with zero visual noise.

### 2. Autonomous AI CFO Copilot
- **Route:** `POST /api/ai/analyze` (Guarded by `verifyToken`).
- **Google GenAI SDK:** Leverages `@google/genai` with model `gemini-2.5-flash` via `process.env.GEMINI_API_KEY`.
- **Intelligent Heuristic Fallback:** Built-in deterministic risk-scoring engine that guarantees 100% uptime with actionable advice even without an API key or during network disruptions.
- **Audit Deliverable:** Formatted liquidity risk analysis, default vulnerability diagnosis, and 2 concrete strategic action points.

### 3. Multi-Tenant User Isolation & Schema Integrity
- **Database Tables:**
  - `users`: Authenticated user credentials with hashed/verified access keys.
  - `company_financials`: Foreign key `user_id REFERENCES users(id) ON DELETE CASCADE`.
  - `funding_milestones`: Foreign key `user_id REFERENCES users(id) ON DELETE CASCADE`.
- **Multi-Tenant Protection:** Every `SELECT`, `INSERT`, and `DELETE` query is strictly guarded by `WHERE user_id = req.user.id`.
- **Auto-Provisioning:** Registration (`POST /api/auth/register`) captures `result.insertId`, issues a 24-hour signed JWT `{ id, email }`, and provisions a baseline `$1,000,000` capital profile automatically.

### 4. Real-Time Collaboration & Bulk Ingestion
- **WebSocket Broadcast:** Collaborative scenario modeling where adjustments to headcount or marketing sliders broadcast live across connected devices.
- **CSV Ingestion:** Ingest bulk spreadsheets (`POST /api/milestones/bulk`) with downloadable sample template.

---

## 🛠️ Port Bindings & Services

| Service | Port | Status | Access URL |
| :--- | :--- | :--- | :--- |
| **Backend API Engine** | `5002` | `RUNNING` | `http://localhost:5002` |
| **Frontend Web App** | `5173` | `RUNNING` | `http://localhost:5173` |
| **MySQL Database** | `3306` | `RUNNING` | `runway_pulse_db` |

---

## 🚀 Running the Project

### 1. Backend (`backend/`)
```bash
cd backend
npm install
npm run dev # Starts on port 5002
```

### 2. Frontend (`frontend/`)
```bash
cd frontend
npm install
npm run dev # Starts on port 5173
```

### 3. Seed Institutional Demo Account
```bash
cd backend
node seed.js
```
Default credentials:
- **Email:** `admin@enterprise.com`
- **Password:** `admin123`
