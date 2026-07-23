from __future__ import annotations

import math
import re
from collections import Counter
from pathlib import Path
from typing import Any


def _tokenize(text: str) -> list[str]:
    """Lowercase word tokens of length >= 2, with a small English stop-word filter."""
    tokens = re.findall(r"[a-zA-Z0-9]{2,}", text.lower())
    return [token for token in tokens if token not in _STOP_WORDS]


_STOP_WORDS = {
    "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "her",
    "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "man",
    "new", "now", "old", "see", "two", "way", "who", "did", "its", "let", "put",
    "say", "she", "too", "use", "with", "this", "that", "from", "they", "will",
    "would", "there", "their", "what", "about", "which", "when", "your", "into",
    "than", "then", "them", "these", "some", "have", "were", "been", "being",
    "does", "such", "only", "over", "also", "here", "just", "more", "most",
}


class KnowledgeStore:
    """Dependency-free TF-IDF chunk retriever.

    Exposes ``search(query, k)`` so the backing store can later be swapped for a
    vector database without touching callers.
    """

    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        self.documents: list[dict[str, Any]] = []
        self.chunks: list[dict[str, Any]] = []
        self._chunk_vectors: list[dict[str, float]] = []
        self._idf: dict[str, float] = {}
        self._loaded = False

    def load_seed_documents(self) -> None:
        if self._loaded:
            return
        docs_dir = self.data_dir / "documents"
        for path in sorted(docs_dir.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            doc_id = path.stem
            self.documents.append({
                "id": doc_id,
                "title": path.stem.replace("_", " ").title(),
                "text": text,
            })
        self._build_index()
        self._loaded = True

    def _build_index(self) -> None:
        self.chunks = []
        for document in self.documents:
            paragraphs = [p.strip() for p in re.split(r"\n\s*\n", document["text"]) if p.strip()]
            for index, paragraph in enumerate(paragraphs):
                self.chunks.append({
                    "documentId": document["id"],
                    "title": document["title"],
                    "text": paragraph,
                    "chunkId": f"{document['id']}-{index + 1}",
                    "_tokens": _tokenize(paragraph),
                })

        total_docs = len(self.chunks)
        document_frequency: Counter[str] = Counter()
        for chunk in self.chunks:
            for term in set(chunk["_tokens"]):
                document_frequency[term] += 1
        # Smoothed IDF keeps weights positive even for terms present in every chunk.
        self._idf = {
            term: math.log((total_docs + 1) / (freq + 1)) + 1.0
            for term, freq in document_frequency.items()
        }

        self._chunk_vectors = [self._vectorize(chunk["_tokens"]) for chunk in self.chunks]

    def _vectorize(self, tokens: list[str]) -> dict[str, float]:
        if not tokens:
            return {}
        counts = Counter(tokens)
        length = len(tokens)
        vector = {
            term: (count / length) * self._idf.get(term, 0.0)
            for term, count in counts.items()
        }
        norm = math.sqrt(sum(weight * weight for weight in vector.values()))
        if norm == 0:
            return {}
        return {term: weight / norm for term, weight in vector.items()}

    @staticmethod
    def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
        if not a or not b:
            return 0.0
        # Iterate the smaller vector for efficiency; both are already L2-normalised.
        if len(a) > len(b):
            a, b = b, a
        return sum(weight * b.get(term, 0.0) for term, weight in a.items())

    def search(self, query: str, k: int = 4) -> list[dict[str, Any]]:
        if not self.chunks:
            return []
        query_vector = self._vectorize(_tokenize(query))
        if not query_vector:
            return []
        scored: list[tuple[float, int]] = []
        for index, chunk_vector in enumerate(self._chunk_vectors):
            score = self._cosine(query_vector, chunk_vector)
            if score > 0:
                scored.append((score, index))
        scored.sort(key=lambda item: item[0], reverse=True)
        results = []
        for score, index in scored[:k]:
            chunk = self.chunks[index]
            results.append({
                "documentId": chunk["documentId"],
                "title": chunk["title"],
                "text": chunk["text"],
                "chunkId": chunk["chunkId"],
                "score": float(score),
            })
        return results
