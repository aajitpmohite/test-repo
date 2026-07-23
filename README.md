# DB Quest AI

A multi-team, full-stack app that gives every team a private **AI Digital Colleague**
(answers grounded in the team's own documents) and a set of **AI Escape Missions**
(compliance training as an interactive escape room).

It runs **fully offline in demo mode** — no API keys, no external services — and
transparently upgrades to a live LLM + embeddings when you configure a provider.

- **Backend:** Python · FastAPI · SQLModel (SQLite by default) · JWT auth
- **Frontend:** React 18 · Vite 5 · Tailwind CSS 3 · React Router 6

---

## Usage model (how a team uses it)

```
Register / demo login  ->  land in a Team (with a Role)  ->  Admin uploads docs
        ->  Members ask questions (answers cite those docs)  ->  Everyone plays
        missions (private scores)  ->  Admin sees anonymized Team Insights
```

- **Auth & identity:** email + password (JWT), plus a one-click *Continue as demo user*.
  All `/api` routes require a token except `/api/health` and `/api/auth/*`.
- **Teams / workspaces:** every user belongs to one or more teams. **All content
  (documents, chunks, missions, attempts) is scoped to a team** and isolation is enforced
  server-side. The top-bar team switcher changes which team's data you see.
- **Roles:**
  - **Admin** — upload documents, create missions, view aggregated team insights.
  - **Member** — ask questions, take onboarding, play missions.
  Admin-only UI is hidden from members and admin-only routes are blocked server-side.
- **Privacy:** mission answer keys never reach the browser (server-side grading);
  individual scores are private; the insights view shows **only anonymized aggregates**
  (e.g. "70% identified the red flag first try") — never rankings.

### Demo accounts (seeded on first run)

| Email | Password | Role |
|-------|----------|------|
| `demo-admin@dbquest.ai` | `demo123` | Admin |
| `demo-member@dbquest.ai` | `demo123` | Member |

*Continue as demo user* logs in as the demo admin.

---

## Architecture

```
                    +--------------------------- Browser (React) ---------------------------+
                    |  AuthContext (JWT + team)   ToastContext   Role-aware UI               |
                    |  api.js  -- Authorization: Bearer <jwt>,  X-Team-Id: <id> -------------|
                    +-----------------------------------+-----------------------------------+
                                        /api (Vite proxies :5173 -> :8000)
                    +-----------------------------------v-----------------------------------+
                    | FastAPI                                                                |
                    |  routers: auth . teams . documents . colleague . missions . insights   |
                    |  security.py  -> get_current_user (JWT) -> get_team_context (member)    |
                    |        |                 |                    |                         |
                    |   AIService         retrieval.py           SQLModel                     |
                    |  (mock <-> live)  (embeddings <-> TF-IDF)  User.Team.Membership.         |
                    |        |                 |               Document.Chunk.Mission.Attempt  |
                    |   ai_provider.py    per-team chunks --------> SQLite (backend/storage)   |
                    +------------------------------------------------------------------------+
```

### Data model

| Table | Purpose |
|-------|---------|
| `User` | account (email, hashed password) |
| `Team` | a workspace |
| `Membership` | links a user to a team **with a role** (admin/member) |
| `Document` | a team's document (full text persisted) |
| `Chunk` | a paragraph of a document, optional embedding vector |
| `Mission` | a team-scoped mission (full JSON incl. answer key) |
| `MissionAttempt` | one private run: score, grade, decisions (feeds insights) |

### Live vs demo mode

| Capability | Demo (default) | Live (configured) |
|-----------|----------------|-------------------|
| Auth persistence | yes — SQLite auto-created | yes — SQLite or Postgres |
| Q&A answers | mock synthesis | real LLM, grounded in team docs |
| Mission generation | deterministic archetypes | real LLM (coerced to schema) |
| Document search | TF-IDF (offline) | embeddings (OpenAI/Azure) |
| Grading / hints / scoring | deterministic (always) | deterministic (always) |

The live path always **falls back to mock on any error**, so the app never breaks.

---

## Run it

### Backend (Terminal 1)
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
First start auto-creates `backend/storage/dbquest.db` and seeds the demo team.

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Open **http://localhost:5173** and click **Continue as demo user**.

### Go live (optional)
Copy `backend/.env.example` -> `backend/.env`, set `AI_PROVIDER` + a key, and restart the
backend. Check `http://localhost:8000/api/health` -> `liveAi: true`.

---

## Deploy to Vercel

The repo ships a `vercel.json` that builds the Vite frontend as static assets and runs
FastAPI as a Python **Serverless Function**. Routing: `/api/*` -> FastAPI, everything
else -> the React SPA (`index.html`).

### Steps
1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New… → Project** and import the repo.
3. Set **Root Directory** to **`db-quest-ai-share`** (the folder that contains
   `vercel.json`, `frontend/`, and `backend/`). Leave the build/output settings on their
   defaults — `vercel.json` drives the build.
4. Add environment variables (Project → Settings → Environment Variables) as needed:
   - `JWT_SECRET` — a long random string (**required for production**).
   - `AI_PROVIDER` + the matching key (`OPENAI_API_KEY`, `AZURE_*`, or `GEMINI_API_KEY`)
     to enable live AI. Omit for offline mock mode.
   - `DATABASE_URL` — a managed Postgres URL for durable data (see the note below).
   - `VITE_API_URL` is **not** needed — the frontend calls the same-origin `/api`.
5. **Deploy.** When it's live, open `/api/health` to confirm the API responds.

### Serverless notes & limitations
- **Filesystem is read-only except `/tmp`.** The app auto-detects Vercel and writes the
  default SQLite file to `/tmp`, so it boots and seeds the demo with zero config.
- **`/tmp` is ephemeral and per-instance.** Uploaded documents and generated missions
  written to the default SQLite DB do **not** survive cold starts or scale-out. For real
  persistence set `DATABASE_URL` to a managed Postgres (Vercel Postgres / Neon / Supabase)
  and add `psycopg[binary]` to `backend/requirements.txt` — no code changes needed.
- **DB init is lazy + idempotent** (runs on the first request), so it works even though
  serverless bridges don't always run ASGI lifespan startup.
- No long-running/background tasks are used; each request completes within the function
  timeout.

### CI/CD (GitHub Actions)

`.github/workflows/vercel-deploy.yml` (at the **repo root**) runs on every push/PR:

1. **verify** — installs backend deps + runs an import/health smoke test (with `VERCEL=1`
   to exercise the serverless path), then `npm ci` + `npm run build` for the frontend.
2. **deploy** — uses the Vercel CLI. **Pull requests → Preview** deploy (the preview URL is
   commented on the PR); **push to `main` → Production** deploy.

**One-time setup** (so CLI deploys and the dashboard agree on the app folder):

```bash
# From the repo root, link the project once and grab its IDs:
npm i -g vercel
vercel link            # choose/create the project; set Root Directory = db-quest-ai-share
cat .vercel/project.json   # -> "orgId" and "projectId"
```

Then add three **GitHub repo secrets** (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → **Tokens** → create token |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

Set production env vars (`JWT_SECRET`, optional `AI_PROVIDER`/keys, optional `DATABASE_URL`)
in the Vercel dashboard — they apply to CLI deploys too. If you use the Actions pipeline,
disable Vercel's own Git integration for the project to avoid double deploys.

---

## Environment variables

| Var | Default | Meaning |
|-----|---------|---------|
| `AI_PROVIDER` | `mock` | `mock` \| `openai` \| `azure` \| `gemini` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` / `OPENAI_EMBEDDING_MODEL` | – | OpenAI chat + embeddings |
| `AZURE_API_KEY` / `AZURE_ENDPOINT` / `AZURE_DEPLOYMENT` / `AZURE_EMBEDDING_DEPLOYMENT` | – | Azure OpenAI |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | – | Gemini chat |
| `JWT_SECRET` | dev secret | JWT signing key (change in prod) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | token lifetime |
| `DATABASE_URL` | SQLite file | e.g. `postgresql+psycopg://...` for Postgres |
| `SEED_DEMO` | `true` | seed the demo team + content on first run |
| `CORS_ORIGINS` | `http://localhost:5173` | allowed frontend origins |

---

## Onboarding a new team

1. Click **Create one** on the login screen and register — you become the **admin** of a new team.
2. Go to **Documents** -> upload or paste your team's guides (they're chunked + indexed).
3. Invite teammates via the team members API (they register first, then you add them by email).
4. Members open **Ask** to query your docs, **Onboarding** to plan their ramp-up, and **Missions** to train.
5. As admin, watch **Team Insights** for anonymized progress.

Also see the in-app **How it works** page (sidebar -> Support).
