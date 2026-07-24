"""Document routes (team-scoped knowledge base).

Members can browse and summarise; only admins can add documents. Uploaded/pasted
text is persisted to the database (so it survives restarts) and immediately indexed
into per-team chunks that power the Digital Colleague's grounded answers.
"""
from __future__ import annotations

import io
import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select

from ..ai_service import AIService
from ..database import get_session
from ..db_models import Chunk, Document
from ..models import DocumentPasteRequest, DocumentPublic, DocumentSummaryRequest, DocumentSummaryResponse
from ..retrieval import index_document
from ..security import TeamContext, get_team_context, require_admin

router = APIRouter(prefix="/api/documents", tags=["documents"])
service = AIService()

SUPPORTED_EXTENSIONS = (".txt", ".md", ".csv", ".pdf")


def _extract_pdf_text(raw: bytes) -> str:
    """Extract text from a PDF's pages. Returns "" for image-only (scanned) PDFs."""
    try:
        from pypdf import PdfReader
    except ImportError:  # pragma: no cover - dependency guaranteed in requirements
        raise HTTPException(status_code=500, detail="PDF support is not available on the server")
    try:
        reader = PdfReader(io.BytesIO(raw))
        parts = [(page.extract_text() or "").strip() for page in reader.pages]
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read that PDF — the file may be corrupt or password-protected")
    return "\n\n".join(p for p in parts if p)


def _decode_text(raw: bytes) -> str:
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("latin-1")


def _to_public(session: Session, document: Document) -> DocumentPublic:
    count = len(session.exec(select(Chunk).where(Chunk.document_id == document.id)).all())
    return DocumentPublic(
        id=document.id,
        title=document.title,
        source=document.source,
        chunkCount=count,
        createdAt=document.created_at.isoformat(),
    )


@router.get("", response_model=list[DocumentPublic])
def list_documents(context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> list[DocumentPublic]:
    docs = session.exec(select(Document).where(Document.team_id == context.team.id)).all()
    return [_to_public(session, d) for d in docs]


@router.post("/upload", response_model=DocumentPublic)
async def upload(
    file: UploadFile = File(...),
    context: TeamContext = Depends(require_admin),
    session: Session = Depends(get_session),
) -> DocumentPublic:
    if not file.filename or not file.filename.lower().endswith(SUPPORTED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Only .txt, .md, .csv, and .pdf files are supported")
    raw = await file.read()
    if file.filename.lower().endswith(".pdf"):
        text = _extract_pdf_text(raw)
        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="No selectable text found in that PDF (it may be scanned images). Try a text-based PDF.",
            )
    else:
        text = _decode_text(raw)
    document = Document(
        team_id=context.team.id,
        title=os.path.splitext(file.filename)[0],
        source="upload",
        filename=file.filename,
        content=text,
        uploaded_by=context.user.id,
    )
    session.add(document)
    session.commit()
    session.refresh(document)
    index_document(session, document)
    return _to_public(session, document)


@router.post("/paste", response_model=DocumentPublic)
def paste(payload: DocumentPasteRequest, context: TeamContext = Depends(require_admin), session: Session = Depends(get_session)) -> DocumentPublic:
    title = payload.title.strip()
    text = payload.text.strip()
    if not title or not text:
        raise HTTPException(status_code=400, detail="Both a title and text are required")
    document = Document(team_id=context.team.id, title=title, source="paste", content=text, uploaded_by=context.user.id)
    session.add(document)
    session.commit()
    session.refresh(document)
    index_document(session, document)
    return _to_public(session, document)


@router.post("/summarize", response_model=DocumentSummaryResponse)
def summarize(payload: DocumentSummaryRequest, context: TeamContext = Depends(get_team_context), session: Session = Depends(get_session)) -> DocumentSummaryResponse:
    if payload.documentId:
        try:
            doc_id = int(payload.documentId)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="documentId must be a number")
        document = session.get(Document, doc_id)
        if not document or document.team_id != context.team.id:
            raise HTTPException(status_code=404, detail="Document not found for this team")
        return service.summarize_document(document.title, document.content)
    if payload.text:
        return service.summarize_document("Pasted content", payload.text)
    raise HTTPException(status_code=400, detail="Provide either documentId or text")


@router.delete("/{document_id}")
def delete_document(document_id: int, context: TeamContext = Depends(require_admin), session: Session = Depends(get_session)) -> dict:
    document = session.get(Document, document_id)
    if not document or document.team_id != context.team.id:
        raise HTTPException(status_code=404, detail="Document not found for this team")
    for chunk in session.exec(select(Chunk).where(Chunk.document_id == document_id)).all():
        session.delete(chunk)
    session.delete(document)
    session.commit()
    return {"deleted": document_id}
