# Clarity — Community Deliberation Platform

Clarity is a case-grounded deliberation platform designed to transition linguistic data governance from an individualistic "notice and consent" model to a collective, stake-weighted system. Built for the [Mozilla Common Voice](https://commonvoice.mozilla.org/) ecosystem, it anchors civic influence in real-world dataset contributions so that those with the highest expressed stake lead governance decisions.

> **Live Platform:** [info-deliberation-tooling-prod.web.app](https://info-deliberation-tooling-prod.web.app)

---

## Architecture Overview

```
┌─────────────────────┐      HTTPS      ┌──────────────────────────────┐
│   React Frontend    │ ◄─────────────► │   FastAPI Backend (Cloud Run) │
│  Firebase Hosting   │                 │   SQLite · google-genai SDK   │
└─────────────────────┘                 └──────────────────────────────┘
```

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS v4, Vite, React Router v7 |
| Backend | FastAPI (Python), SQLAlchemy ORM, SQLite |
| AI | Google Gemini 2.5 Flash via `google-genai` SDK |
| Hosting | Firebase Hosting (frontend) · Google Cloud Run (backend) |
| Auth | Custom email/password with bcrypt — no Firebase Auth dependency |

---

## Deliberation Lifecycle

### 1. Case Creation
Administrators propose new policy dilemmas via the admin dashboard. When a case is saved, the backend calls Gemini **once** to generate a tailored opening question — stored in the DB and displayed to every participant who enters that case.

### 2. Socratic Intake (Position Hardening)
Before voting, each user engages in a structured dialogue with the Socratic AI facilitator:
- Asks one focused question per turn, pushing the user to clarify and defend their stance
- Tracks a **Clarity Score** (0–100) reflecting how well-reasoned the stance is
- Extracts core values (e.g., "Linguistic Diversity", "Open Data") as structured metadata
- Progressive urgency injection at turns 4, 6, and 7 guides the user toward a concrete conclusion
- Users must reach ≥80% clarity before proceeding to vote (admin override available for testing)

### 3. Quadratic Voting
After the Socratic phase, the user's stance is locked and they enter the voting allocation screen:
- **Quadratic cost:** `credits_spent = votes_cast²` — prevents large stakeholders from dominating while allowing intensity signaling
- Users can update their vote at any time before the case closes
- Deleting a case refunds all credits to voters

### 4. Consensus Reveal
Post-voting consensus synthesis is a **planned future feature**. The current Audit page is clearly marked as a placeholder.

---

## Admin Dashboard

Accessible at `/admin-dashboard` — admin accounts only (no deliberation participation).

| Feature | Description |
|---|---|
| Active Citizens | View all registered users with credit balances |
| Credit Management | Set exact credit amounts per user (direct input) |
| User Deletion | Remove users and their voting history |
| Case Management | View all active cases, delete with automatic credit refund |

Admin credentials are seeded at startup (`admin@example.com` / `password`) — **change these before any production use.**

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key (free tier works for development)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Create your local env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

uvicorn main:app --reload --port 8000
```

The backend starts at `http://localhost:8000`. On first run it creates `clarity_v2.db` and seeds the admin account automatically.

### Seeding Cases

Cases are NOT seeded at startup (to ensure real LLM-generated opening messages). After the backend is running, seed the baseline cases via the API:

```bash
python seed_cases.py
# Or against a live backend:
python seed_cases.py https://your-backend-url.run.app
```

### Frontend Setup

```bash
cd frontend
npm install

# Create your local env file
cp .env.example .env.live
# Edit .env.live — set VITE_API_URL=http://localhost:8000 for local dev

npm run dev
```

The frontend starts at `http://localhost:5173`.

---

## Deployment

### Backend → Google Cloud Run

```bash
gcloud run deploy clarity-backend \
  --source ./backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=your_key_here,DB_DIR=/tmp" \
  --memory 512Mi \
  --project your-gcp-project-id
```

> **Note on persistence:** `DB_DIR=/tmp` means the SQLite database resets on every Cloud Run cold start. For a persistent deployment, mount a Cloud Storage bucket via Cloud Storage FUSE and set `DB_DIR=/mnt/your-bucket`.

### Frontend → Firebase Hosting

```bash
cd frontend

# Build for the live authenticated environment
npm run build:live

# Deploy
npx firebase-tools deploy --project your-firebase-project-id --only hosting
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `DB_DIR` | No | Directory for SQLite DB file (default: `.`) |
| `COMMUNITY_NAME` | No | Display name of the community (default: "The Kinyarwanda Language Resource Group") |

### Frontend (`frontend/.env.live`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Base URL of the FastAPI backend |
| `VITE_MOCK_AUTH` | ✅ | `false` for live, `true` for demo/mock mode |
| `VITE_APP_MODE` | ✅ | `auth` for live, `demo` for mock mode |

---

## Project Structure

```
deliberation-platform/
├── backend/
│   ├── main.py              # FastAPI app — all API endpoints
│   ├── database.py          # SQLAlchemy models (User, CommunityCase, CaseVote, ChatSession)
│   ├── llm_service.py       # Gemini integration — Socratic facilitator + opening context
│   ├── seed_users.py        # Seeds admin + demo accounts on startup
│   ├── seed_cases.py        # One-time case seeding script (run manually via API)
│   ├── policies/            # Optional community policy markdown files (injected into LLM context)
│   ├── Dockerfile           # Cloud Run container definition
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Cases.jsx          # Active cases listing
│   │   │   ├── Intake.jsx         # Socratic AI chat interface
│   │   │   ├── Voting.jsx         # Quadratic vote allocation
│   │   │   ├── Waiting.jsx        # Post-vote confirmation screen
│   │   │   ├── Audit.jsx          # Consensus reveal (placeholder)
│   │   │   ├── AdminDashboard.jsx # Admin governance panel
│   │   │   ├── Profile.jsx        # User profile + self-deletion
│   │   │   ├── Auth.jsx           # Login / signup
│   │   │   └── CreateCase.jsx     # Case proposal form
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Top navigation
│   │   │   └── ProtectedRoute.jsx # Auth guard with return-to redirect
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   └── App.jsx                # Route definitions
│   ├── .env.example               # Environment variable template
│   ├── firebase.json              # Firebase Hosting config
│   └── .firebaserc                # Firebase project aliases
└── README.md
```

---

## Security Notes

- **API keys** are loaded from environment variables only — never hardcoded. See `.env.example` files.
- **Passwords** are hashed with bcrypt before storage. Plain-text passwords are never persisted.
- **Admin accounts** cannot participate in deliberation — strict role separation is enforced at the route and API level.
- **CORS** is currently set to `allow_origins=["*"]` for development convenience. Restrict this to your frontend domain before wider production rollout.
- The `admin@example.com` / `password` seed credentials are for development only — delete or change them before sharing access with external users.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Copy `.env.example` files and configure your local environment
4. Run locally and test your changes
5. Open a pull request with a clear description

**Never commit** `.env`, `.env.live`, `.env.demo`, or any file containing real API keys, passwords, or project IDs.
