"""Lightweight, dependency-free knowledge retrieval over uploaded documents.

For a hackathon we avoid heavy vector databases. This implements a compact
TF-IDF style scorer over document chunks, which is fast, explainable and works
completely offline. The interface (``search``) is intentionally shaped so a
real embedding store (FAISS/Chroma) can be dropped in later without touching
the routers.
"""
from __future__ import annotations

import math
import os
import re
import uuid
from collections import Counter
from dataclasses import dataclass, field

from .config import settings

_STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "is", "are",
    "was", "were", "be", "with", "as", "by", "at", "from", "that", "this",
    "it", "its", "into", "we", "you", "they", "he", "she", "i", "our", "your",
    "will", "should", "can", "if", "how", "what", "who", "when", "where",
    "which", "do", "does", "about", "please", "me", "my",
}


def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z0-9]+", text.lower())
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 1]


@dataclass
class Chunk:
    document_id: str
    title: str
    source: str
    text: str
    tokens: Counter = field(default_factory=Counter)


@dataclass
class Document:
    id: str
    title: str
    source: str
    text: str
    chunks: list[Chunk] = field(default_factory=list)


class KnowledgeStore:
    """In-memory document store with TF-IDF chunk retrieval."""

    def __init__(self) -> None:
        self.documents: dict[str, Document] = {}
        self._idf: dict[str, float] = {}

    # --------------------------------------------------------------- ingest
    def add_document(self, title: str, source: str, text: str, doc_id: str | None = None) -> Document:
        doc_id = doc_id or f"doc_{uuid.uuid4().hex[:8]}"
        chunks = self._chunk(doc_id, title, source, text)
        doc = Document(id=doc_id, title=title, source=source, text=text, chunks=chunks)
        self.documents[doc_id] = doc
        self._reindex()
        return doc

    def _chunk(self, doc_id: str, title: str, source: str, text: str) -> list[Chunk]:
        # Split on blank lines / headings into semantic-ish paragraphs.
        raw = re.split(r"\n\s*\n", text.strip())
        chunks: list[Chunk] = []
        buffer = ""
        for para in raw:
            para = para.strip()
            if not para:
                continue
            buffer = f"{buffer}\n\n{para}".strip() if buffer else para
            if len(buffer) >= 320:
                chunks.append(self._make_chunk(doc_id, title, source, buffer))
                buffer = ""
        if buffer:
            chunks.append(self._make_chunk(doc_id, title, source, buffer))
        return chunks

    @staticmethod
    def _make_chunk(doc_id: str, title: str, source: str, text: str) -> Chunk:
        return Chunk(
            document_id=doc_id,
            title=title,
            source=source,
            text=text,
            tokens=Counter(_tokenize(text)),
        )

    def _reindex(self) -> None:
        all_chunks = [c for d in self.documents.values() for c in d.chunks]
        n = len(all_chunks) or 1
        df: Counter = Counter()
        for chunk in all_chunks:
            for term in chunk.tokens:
                df[term] += 1
        self._idf = {term: math.log((n + 1) / (freq + 1)) + 1.0 for term, freq in df.items()}

    # --------------------------------------------------------------- search
    def search(self, query: str, k: int = 4) -> list[tuple[Chunk, float]]:
        q_tokens = _tokenize(query)
        if not q_tokens:
            return []
        q_counter = Counter(q_tokens)
        scored: list[tuple[Chunk, float]] = []
        for doc in self.documents.values():
            for chunk in doc.chunks:
                score = 0.0
                for term, qf in q_counter.items():
                    tf = chunk.tokens.get(term, 0)
                    if tf:
                        idf = self._idf.get(term, 1.0)
                        score += (1 + math.log(tf)) * idf * qf
                if score > 0:
                    length_norm = 1.0 + math.log(1 + sum(chunk.tokens.values()))
                    scored.append((chunk, score / length_norm))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:k]

    # --------------------------------------------------------------- helpers
    def get(self, doc_id: str) -> Document | None:
        return self.documents.get(doc_id)

    def list_meta(self) -> list[dict]:
        return [
            {
                "id": d.id,
                "title": d.title,
                "source": d.source,
                "chars": len(d.text),
                "chunks": len(d.chunks),
            }
            for d in self.documents.values()
        ]

    def load_seed_documents(self) -> None:
        """Load bundled sample documents so the demo works immediately."""
        docs_dir = os.path.join(settings.data_dir, "documents")
        if not os.path.isdir(docs_dir):
            return
        titles = {
            "onboarding_guide.md": "Onboarding Guide - Payments Modernization",
            "release_notes.md": "Release Notes - Q1 2026",
            "architecture_summary.md": "Architecture Summary - Payments Platform",
            "support_guide.md": "Support & Incident Guide",
            "deployment_checklist.md": "Production Deployment Checklist",
        }
        for filename in sorted(os.listdir(docs_dir)):
            if not filename.endswith((".md", ".txt")):
                continue
            path = os.path.join(docs_dir, filename)
            with open(path, "r", encoding="utf-8") as fh:
                text = fh.read()
            title = titles.get(filename, filename.replace("_", " ").rsplit(".", 1)[0].title())
            self.add_document(title=title, source=filename, text=text, doc_id=f"seed_{filename.split('.')[0]}")


store = KnowledgeStore()
