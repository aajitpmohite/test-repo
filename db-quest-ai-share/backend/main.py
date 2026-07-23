"""DB Quest AI — FastAPI application entry point.

Boots the web server, creates the database and demo team on first run, and wires up
every router. All /api routes require a valid token EXCEPT /api/health and /api/auth/*.

Flow of a request:
    frontend --> router (auth + team check) --> AIService (mock or live) / retrieval / DB
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.config import settings
from app.database import engine, init_db
from app.routers.auth import router as auth_router
from app.routers.colleague import router as colleague_router
from app.routers.documents import router as documents_router
from app.routers.insights import router as insights_router
from app.routers.missions import router as missions_router
from app.routers.teams import router as teams_router
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed the demo team/content before serving traffic.
    init_db()
    with Session(engine) as session:
        seed_if_empty(session)
    yield


app = FastAPI(title=settings.app_name, version=settings.version, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
