"""Document ingestion & summarisation endpoints."""
from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from ..ai_service import ai
from ..knowledge import store
from ..models import DocumentMeta, DocumentSummaryResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])


class PasteDocumentRequest(BaseModel):
    title: str
    text: str


class SummarizeRequest(BaseModel):
    documentId: str | None = None
    title: str | None = None
    text: str | None = None


@router.get("")
async def list_documents() -> list[DocumentMeta]:
    return [DocumentMeta(**m) for m in store.list_meta()]


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), title: str | None = Form(None)) -> DocumentMeta:
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = raw.decode("latin-1")
        except Exception as exc:  # pragma: no cover - defensive
            raise HTTPException(
                status_code=415,
                detail="Only text-based files (.txt, .md, .csv) are supported in the demo.",
            ) from exc
    if not text.strip():
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    doc = store.add_document(title=title or file.filename, source=file.filename, text=text)
    return DocumentMeta(id=doc.id, title=doc.title, source=doc.source, chars=len(doc.text), chunks=len(doc.chunks))


@router.post("/paste")
async def paste_document(req: PasteDocumentRequest) -> DocumentMeta:
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty.")
    doc = store.add_document(title=req.title or "Pasted document", source="pasted", text=req.text)
    return DocumentMeta(id=doc.id, title=doc.title, source=doc.source, chars=len(doc.text), chunks=len(doc.chunks))


@router.post("/summarize", response_model=DocumentSummaryResponse)
async def summarize(req: SummarizeRequest) -> DocumentSummaryResponse:
    if req.documentId:
        doc = store.get(req.documentId)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        title, text = doc.title, doc.text
    elif req.text:
        title, text = req.title or "Document", req.text
    else:
        raise HTTPException(status_code=400, detail="Provide documentId or text.")
    result = await ai.summarize_document(title, text)
    return DocumentSummaryResponse(**result)
