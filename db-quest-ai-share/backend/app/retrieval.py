"""Per-team document retrieval.

This is the "R" in RAG. It keeps documents searchable *per team* so the Digital
Colleague can only ever answer from the current team's knowledge base.

Two interchangeable strategies behind one ``search()`` call:

1. Embeddings (when an OpenAI/Azure key is configured): each chunk is stored with a
   vector; queries are embedded and ranked by cosine similarity. This is the
   "pluggable vector store" — vectors live in the SQLite ``chunk`` table, and the
   same interface could be pointed at pgvector/Chroma later.
2. TF-IDF (offline fallback): a dependency-free keyword ranking used whenever no
   embedding provider is available. Guarantees the demo works with zero setup.
"""
from __future__ import annotations

import json
import math
import re
from collections import Counter

from sqlmodel import Session, select

from .config import settings
from .db_models import Chunk, Document
from .knowledge import _tokenize  # reuse the shared tokenizer


def chunk_text(text: str) -> list[str]:
    """Split a document into paragraph-sized chunks (blank-line separated)."""
    parts = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    return parts or ([text.strip()] if text.strip() else [])


def _make_provider():
    # Local import avoids a circular import (ai_service imports retrieval indirectly).
    from .ai_provider import AIProvider

    return AIProvider(settings.ai_provider, {
        "api_key": (
            settings.openai_api_key if settings.ai_provider == "openai"
            else settings.azure_api_key if settings.ai_provider == "azure"
            else ""
        ),
        "endpoint": settings.azure_endpoint,
        "openai_embedding_model": settings.openai_embedding_model,
        "azure_embedding_deployment": settings.azure_embedding_deployment,
        "azure_api_version": settings.azure_api_version,
    })


def _embed(texts: list[str]) -> list[list[float]] | None:
    """Embed texts via the provider, or return None to signal the TF-IDF fallback."""
    if not settings.embeddings_configured:
        return None
    try:
        vectors = _make_provider().embed(texts)
        return vectors or None
    except Exception:
        return None


def index_document(session: Session, document: Document) -> int:
    """Chunk a document and persist its chunks (with embeddings when available).

    Returns the number of chunks created. Safe to call again after re-upload:
    callers should delete existing chunks first if re-indexing.
    """
    texts = chunk_text(document.content)
    vectors = _embed(texts)
    for index, text in enumerate(texts):
        embedding = json.dumps(vectors[index]) if vectors and index < len(vectors) else None
        session.add(Chunk(
            document_id=document.id,
            team_id=document.team_id,
            chunk_index=index,
            text=text,
            embedding=embedding,
        ))
    session.commit()
    return len(texts)


# ---- ranking helpers ---------------------------------------------------------

def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def _tfidf_rank(query: str, chunks: list[Chunk], k: int) -> list[tuple[float, Chunk]]:
    docs_tokens = [_tokenize(c.text) for c in chunks]
    total = len(chunks)
    df: Counter[str] = Counter()
    for tokens in docs_tokens:
        for term in set(tokens):
            df[term] += 1
    idf = {term: math.log((total + 1) / (freq + 1)) + 1.0 for term, freq in df.items()}

    def vec(tokens: list[str]) -> dict[str, float]:
        if not tokens:
            return {}
        counts = Counter(tokens)
        length = len(tokens)
        raw = {t: (c / length) * idf.get(t, 0.0) for t, c in counts.items()}
        norm = math.sqrt(sum(v * v for v in raw.values())) or 1.0
        return {t: v / norm for t, v in raw.items()}

    qvec = vec(_tokenize(query))
    if not qvec:
        return []
    scored: list[tuple[float, Chunk]] = []
    for tokens, chunk in zip(docs_tokens, chunks):
        cvec = vec(tokens)
        score = sum(w * cvec.get(t, 0.0) for t, w in qvec.items())
        if score > 0:
            scored.append((score, chunk))
    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[:k]


def search(session: Session, team_id: int, query: str, k: int = 4) -> list[dict]:
    """Return the top-k chunks for a query, restricted to one team's documents.

    Output shape matches the legacy retriever so downstream code is unchanged:
    ``[{documentId, title, text, chunkId, score}]``.
    """
    chunks = session.exec(select(Chunk).where(Chunk.team_id == team_id)).all()
    if not chunks:
        return []

    # Map document id -> title for friendly source labels.
    doc_ids = {c.document_id for c in chunks}
    titles = {
        d.id: d.title
        for d in session.exec(select(Document).where(Document.id.in_(doc_ids))).all()
    }

    ranked: list[tuple[float, Chunk]]
    embedded = [c for c in chunks if c.embedding]
    query_vec = _embed([query]) if embedded else None
    if embedded and query_vec:
        qv = query_vec[0]
        scored = []
        for chunk in embedded:
            try:
                score = _cosine(qv, json.loads(chunk.embedding))
            except (ValueError, TypeError):
                score = 0.0
            if score > 0:
                scored.append((score, chunk))
        scored.sort(key=lambda item: item[0], reverse=True)
        ranked = scored[:k]
    else:
        ranked = _tfidf_rank(query, chunks, k)

    return [
        {
            "documentId": chunk.document_id,
            "title": titles.get(chunk.document_id, "Document"),
            "text": chunk.text,
            "chunkId": f"{chunk.document_id}-{chunk.chunk_index}",
            "score": float(score),
        }
        for score, chunk in ranked
    ]
