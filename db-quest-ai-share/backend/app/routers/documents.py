"""Document routes (team-scoped knowledge base).

Members can browse and summarise; only admins can add documents. Uploaded/pasted
text is persisted to the database (so it survives restarts) and immediately indexed
into per-team chunks that power the Digital Colleague's grounded answers.
"""
from __future__ import annotations

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
    if not file.filename or not file.filename.lower().endswith((".txt", ".md", ".csv")):
        raise HTTPException(status_code=400, detail="Only .txt, .md, and .csv files are supported")
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
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
