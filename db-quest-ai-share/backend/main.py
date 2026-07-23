"""DB Quest AI — FastAPI application entry point.

Boots the web server, creates the database and demo team on first run, and wires up
every router. All /api routes require a valid token EXCEPT /api/health and /api/auth/*.

Flow of a request:
    frontend --> router (auth + team check) --> AIService (mock or live) / retrieval / DB
"""
from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager
from typing import Any

# Ensure the backend directory is importable so ``from app...`` works no matter what
# the working directory is. This matters on Vercel, where the serverless function is
# invoked with the project root as the CWD rather than backend/.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from sqlmodel import Session  # noqa: E402

from app.config import settings  # noqa: E402
from app.database import engine, init_db  # noqa: E402
from app.routers.auth import router as auth_router  # noqa: E402
from app.routers.colleague import router as colleague_router  # noqa: E402
from app.routers.documents import router as documents_router  # noqa: E402
from app.routers.insights import router as insights_router  # noqa: E402
from app.routers.missions import router as missions_router  # noqa: E402
from app.routers.teams import router as teams_router  # noqa: E402
from app.seed import seed_if_empty  # noqa: E402

_initialized = False


def ensure_initialized() -> None:
    """Create tables and seed demo content once per process (idempotent).

    Called both from the ASGI lifespan (local ``uvicorn``) and lazily on the first
    request. Serverless bridges do not always run lifespan startup, so the lazy path
    guarantees the schema exists before any query runs on a cold start.
    """
    global _initialized
    if _initialized:
        return
    init_db()
    with Session(engine) as session:
        seed_if_empty(session)
    _initialized = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_initialized()
    yield


app = FastAPI(title=settings.app_name, version=settings.version, lifespan=lifespan)

# Same-origin in production, so CORS is mostly a no-op there. A wildcard ("*") origin
# cannot legally be combined with credentials, so we drop credentials in that case.
if settings.cors_allow_all:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def _init_on_first_request(request, call_next):
    ensure_initialized()
    return await call_next(request)

app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(missions_router)
app.include_router(colleague_router)
app.include_router(documents_router)
app.include_router(insights_router)


@app.get("/api/health")
def health() -> dict[str, Any]:
    """Public status check — also tells the UI whether live AI is active."""
    return {
        "status": "ok",
        "aiProvider": settings.ai_provider,
        "liveAi": settings.provider_configured,
        "embeddings": settings.embeddings_configured,
        "authRequired": True,
        "version": settings.version,
    }


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "DB Quest AI API is running. See /docs for the API reference."}
