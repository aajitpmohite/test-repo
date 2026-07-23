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

On first boot the app seeds **three demo teams**, each with its own admin + member
(all passwords `demo123`):

| Email | Password | Team | Role |
|-------|----------|------|------|
| `demo-admin@dbquest.ai` | `demo123` | Deutsche Bank Demo Team | Admin |
| `demo-member@dbquest.ai` | `demo123` | Deutsche Bank Demo Team | Member |
| `atlas-admin@dbquest.ai` | `demo123` | Atlas Engineering Squad | Admin |
| `atlas-member@dbquest.ai` | `demo123` | Atlas Engineering Squad | Member |
| `nimbus-admin@dbquest.ai` | `demo123` | Nimbus Cloud Platform | Admin |
| `nimbus-member@dbquest.ai` | `demo123` | Nimbus Cloud Platform | Member |

*Continue as demo user* logs in as `demo-admin@dbquest.ai`, who is also an admin of
all three teams — use the top-bar team switcher to move between them and see each
team's isolated documents, missions, and insights.

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
Copy `backend/.env.example` -> `backend/.env`, set `AI_PROVIDER` + the matching
credentials, and **restart** the backend (env is read once at startup). Check
`http://localhost:8000/api/health` -> `liveAi: true`.

Provider-specific setup:

- **OpenAI** — `AI_PROVIDER=openai`, `OPENAI_API_KEY=sk-...`. Optional:
  `OPENAI_MODEL` (default `gpt-4o-mini`), `OPENAI_EMBEDDING_MODEL`
  (default `text-embedding-3-small`). Enables live answers **and** embeddings search.
- **Azure OpenAI** — `AI_PROVIDER=azure`, `AZURE_API_KEY`, and `AZURE_ENDPOINT`.
  - `AZURE_ENDPOINT` must be the **bare resource root** — e.g.
    `https://<resource>.openai.azure.com` — **without** any `/openai/v1` suffix
    (the code appends the `/openai/deployments/...` path itself).
  - `AZURE_DEPLOYMENT` / `AZURE_EMBEDDING_DEPLOYMENT` are your **deployment names**
    (the names you gave the models in Azure), not raw model ids.
  - `AZURE_API_VERSION` defaults to `2024-02-01`.
- **Gemini** — `AI_PROVIDER=gemini`, `GEMINI_API_KEY`. Optional `GEMINI_MODEL`
  (default `gemini-2.0-flash`). Chat only — document search stays on TF-IDF.

The live path always **falls back to the offline mock on any error**, so a bad key or
an unreachable model degrades gracefully instead of breaking the app.

---

## Deploy to Vercel

The repo ships a `vercel.json` that builds the Vite frontend as static assets and runs
FastAPI as a Python **Serverless Function**. Routing: `/api/*` -> FastAPI, everything
else -> the React SPA (`index.html`).

### Steps
1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New… → Project** and import the repo.
3. Leave **Root Directory** at the **repo root** — `vercel.json`, `frontend/`, and
   `backend/` all live there. Leave the build/output settings on their defaults;
   `vercel.json` drives the build.
4. Add environment variables (Project → Settings → Environment Variables) as needed:
   - `JWT_SECRET` — a long random string (**required for production**).
   - `AI_PROVIDER` + the matching credentials (`OPENAI_API_KEY`, the `AZURE_*` set,
     or `GEMINI_API_KEY`) to enable live AI. Omit for offline mock mode. See
     **Environment variables** below for the per-provider keys and the Azure endpoint
     format gotcha.
   - `DATABASE_URL` — a managed Postgres URL for durable data (see the note below).
     **Must** use the `postgresql+psycopg://` scheme (not plain `postgresql://`).
   - `VITE_API_URL` is **not** needed — the frontend calls the same-origin `/api`.
5. **Deploy.** When it's live, open `/api/health` to confirm the API responds
   (`liveAi: true` once a provider is configured).

> **Env vars only apply to *new* deployments.** After adding or changing any variable
> you must create a fresh deployment — Vercel binds env at deploy time, so clicking
> "Redeploy" on an existing (prebuilt) deployment will **not** pick up changes.

### Serverless notes & limitations
- **Filesystem is read-only except `/tmp`.** The app auto-detects Vercel and writes the
  default SQLite file to `/tmp`, so it boots and seeds the demo with zero config.
- **`/tmp` is ephemeral and per-instance.** Uploaded documents and generated missions
  written to the default SQLite DB do **not** survive cold starts or scale-out. For real
  persistence set `DATABASE_URL` to a managed Postgres (Vercel Postgres / Neon / Supabase).
  The `psycopg[binary]` driver is already in `backend/requirements.txt`, so no code
  changes are needed — just use the `postgresql+psycopg://user:pass@host/db?sslmode=require`
  scheme. On first boot the app auto-creates all tables and seeds the demo teams.
- **DB init is lazy + idempotent** (runs on the first request), so it works even though
  serverless bridges don't always run ASGI lifespan startup.
- No long-running/background tasks are used; each request completes within the function
  timeout.

### CI/CD (GitHub Actions)

`.github/workflows/vercel-deploy.yml` (at the **repo root**) runs on every push/PR to
`main` (and `Simple-design`):

1. **verify** — installs backend deps + runs an import/health smoke test (with `VERCEL=1`
   to exercise the serverless path), then `npm ci` + `npm run build` for the frontend.
2. **deploy** — runs `vercel deploy` so the build happens **remotely on Vercel**, which
   always uses the project's latest env vars and settings. **Pull requests → Preview**
   deploy (the preview URL is commented on the PR); **push to `main` → Production** deploy.

> The deploy step intentionally does **not** use `vercel build --prebuilt`. Remote builds
> run on Vercel's own builders (which ship the `uv` tool `@vercel/python` needs), avoid
> stale-env issues, and produce normal deployments you can redeploy from the dashboard.

**Two separate sets of credentials — don't mix them up:**

**(a) GitHub repo secrets** — let the workflow authenticate to Vercel and deploy.
Add them at *Settings → Secrets and variables → Actions*:

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → **Tokens** → create token |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` (run `vercel link` once to generate) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

These are **only** for deployment — they have nothing to do with the app's AI or database.

**(b) Vercel project environment variables** — what the *running app* reads at request
time. Set these in the **Vercel dashboard** (Project → Settings → Environment Variables),
**not** in GitHub:

| Variable | Notes |
|----------|-------|
| `JWT_SECRET` | long random string — required for production |
| `AI_PROVIDER` + provider keys | `openai` / `azure` / `gemini` + matching credentials (see below) |
| `DATABASE_URL` | managed Postgres, `postgresql+psycopg://...` — for durable data |

Vercel env vars apply to CLI **and** Actions deploys. If you rely on this Actions
pipeline, disable Vercel's own Git integration for the project to avoid double deploys.

---

## Environment variables

All are optional — with no config the app runs fully offline (mock AI + TF-IDF search +
auto-created SQLite). Set values in `backend/.env` locally, or in the Vercel dashboard for
deploys. See `backend/.env.example` for a copy-paste template.

| Var | Default | Meaning |
|-----|---------|---------|
| `AI_PROVIDER` | `mock` | `mock` \| `openai` \| `azure` \| `gemini` |
| **OpenAI** | | *(when `AI_PROVIDER=openai`)* |
| `OPENAI_API_KEY` | – | `sk-...` key — enables live chat **and** embeddings search |
| `OPENAI_MODEL` | `gpt-4o-mini` | chat model |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | embeddings model |
| **Azure OpenAI** | | *(when `AI_PROVIDER=azure`)* |
| `AZURE_API_KEY` | – | resource key |
| `AZURE_ENDPOINT` | – | **bare** resource root, e.g. `https://<res>.openai.azure.com` — **no** `/openai/v1` suffix |
| `AZURE_DEPLOYMENT` | `gpt-4o-mini` | your chat **deployment name** (not a model id) |
| `AZURE_EMBEDDING_DEPLOYMENT` | `text-embedding-3-small` | your embeddings **deployment name** |
| `AZURE_API_VERSION` | `2024-02-01` | API version |
| **Gemini** | | *(when `AI_PROVIDER=gemini`; chat only, search stays on TF-IDF)* |
| `GEMINI_API_KEY` | – | Google AI Studio key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | chat model |
| **Auth / DB / misc** | | |
| `JWT_SECRET` | dev secret | JWT signing key (**change in prod**) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | token lifetime (7 days) |
| `DATABASE_URL` | SQLite file (`/tmp` on Vercel) | Postgres via `postgresql+psycopg://user:pass@host/db?sslmode=require` |
| `SEED_DEMO` | `true` | seed the demo teams + content on first run |
| `CORS_ORIGINS` | `http://localhost:5173` | comma-separated allowed frontend origins (`*` for any) |

> **Two gotchas we hit in practice:** (1) `DATABASE_URL` must use `postgresql+psycopg://`
> — plain `postgresql://` selects the uninstalled psycopg2 driver and fails. (2) A
> reasoning-family Azure/OpenAI model (e.g. `gpt-5-mini`, `o1`) rejects a custom
> `temperature`; the provider client sends none, so those models work out of the box.

---

## Onboarding a new team

1. Click **Create one** on the login screen and register — you become the **admin** of a new team.
2. Go to **Documents** -> upload or paste your team's guides (they're chunked + indexed).
3. Invite teammates via the team members API (they register first, then you add them by email).
4. Members open **Ask** to query your docs, **Onboarding** to plan their ramp-up, and **Missions** to train.
5. As admin, watch **Team Insights** for anonymized progress.

Also see the in-app **How it works** page (sidebar -> Support).
