"""Database engine and session management.

Uses SQLModel (SQLAlchemy + Pydantic) over SQLite by default so the app runs with
zero setup. Point ``DATABASE_URL`` at Postgres to scale out — no code changes needed,
e.g. ``DATABASE_URL=postgresql+psycopg://user:pass@host/db``.
"""
from __future__ import annotations

from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

# check_same_thread=False lets FastAPI's threadpool share the SQLite connection safely.
_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=_connect_args)


def init_db() -> None:
    """Create all tables. Safe to call on every startup (no-op if they exist)."""
    # Importing db_models registers the table classes on SQLModel.metadata.
    from . import db_models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    """FastAPI dependency that yields a short-lived DB session per request."""
    with Session(engine) as session:
        yield session
