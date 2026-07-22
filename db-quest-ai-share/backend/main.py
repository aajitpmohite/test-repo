"""DB Quest AI — FastAPI application entrypoint.

Run with:  uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.ai_service import ai
from app.config import settings
from app.content import content
from app.knowledge import store
from app.models import HealthResponse
from app.routers import colleague, documents, missions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load seed content + documents on startup so the demo works instantly.
    content.load()
    store.load_seed_documents()
    yield


app = FastAPI(
    title="DB Quest AI",
    description="AI Digital Colleague + Escape Missions for Deutsche Bank FutureReady.",
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(missions.router)
app.include_router(colleague.router)
app.include_router(documents.router)


@app.get("/api/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        aiProvider=settings.ai_provider,
        liveAi=ai.live,
        missions=len(content.list_missions()),
        documents=len(store.documents),
        version=__version__,
    )


@app.get("/", tags=["system"])
async def root() -> dict:
    return {
        "name": "DB Quest AI",
        "tagline": "Learn faster. Work smarter. Stay compliant — with an AI Digital Colleague.",
        "docs": "/docs",
        "health": "/api/health",
    }
