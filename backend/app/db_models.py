"""Database tables (SQLModel).

The persistent data model behind the whole product:

    User  --< Membership >--  Team
                                |--< Document --< Chunk
                                |--< Mission
                                |--< MissionAttempt (private per user)

Everything that is team content (documents, chunks, missions, attempts) carries a
``team_id`` so the API can enforce strict team isolation. Missions and attempts store
their rich payloads as JSON text to reuse the existing mission/scoring shapes.
"""
from __future__ import annotations

from datetime import datetime

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.utcnow()


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    full_name: str = ""
    is_demo: bool = False
    created_at: datetime = Field(default_factory=_utcnow)


class Team(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    slug: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=_utcnow)


class Membership(SQLModel, table=True):
    """Links a user to a team with a role ("admin" or "member")."""

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    team_id: int = Field(index=True, foreign_key="team.id")
    role: str = "member"  # "admin" | "member"
    created_at: datetime = Field(default_factory=_utcnow)


class Document(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    team_id: int = Field(index=True, foreign_key="team.id")
    title: str
    source: str = "upload"  # "seed" | "upload" | "paste"
    filename: str | None = None
    content: str = ""  # full text — persisted so uploads survive restarts
    uploaded_by: int | None = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=_utcnow)


class Chunk(SQLModel, table=True):
    """A paragraph-sized slice of a document, optionally with an embedding vector.

    ``embedding`` is a JSON-encoded list[float] when an embedding provider is
    configured; otherwise it stays null and retrieval falls back to TF-IDF.
    """

    id: int | None = Field(default=None, primary_key=True)
    document_id: int = Field(index=True, foreign_key="document.id")
    team_id: int = Field(index=True, foreign_key="team.id")
    chunk_index: int = 0
    text: str = ""
    embedding: str | None = None  # JSON list[float] or None


class Mission(SQLModel, table=True):
    """A mission scoped to a team. ``data`` is the full mission JSON (incl. answer key)."""

    id: int | None = Field(default=None, primary_key=True)
    team_id: int = Field(index=True, foreign_key="team.id")
    slug: str = Field(index=True)  # stable public id used in URLs, e.g. "mission-1"
    title: str = ""
    topic: str = ""
    difficulty: str = ""
    generated: bool = False
    data: str = "{}"  # JSON blob of the complete mission
    created_by: int | None = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=_utcnow)


class MissionAttempt(SQLModel, table=True):
    """A private record of one user's mission run. Feeds anonymized team insights."""

    id: int | None = Field(default=None, primary_key=True)
    team_id: int = Field(index=True, foreign_key="team.id")
    user_id: int = Field(index=True, foreign_key="user.id")
    mission_slug: str = Field(index=True)
    score: int = 0
    grade: str = ""
    hints_used: int = 0
    duration_seconds: int = 0
    decisions: str = "[]"  # JSON list of {stepId, correct, risk}
    created_at: datetime = Field(default_factory=_utcnow)
