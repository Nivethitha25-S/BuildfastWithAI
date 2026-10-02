import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.api.deps import security_scheme
from fastapi.security import HTTPAuthorizationCredentials
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.api.deps import get_current_user
from app.services.ingestion.pdf_parser import PDFParserService
from app.services.retrieval.vector_store import VectorStoreService
from app.services.ocr_service import extract_text_from_image

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_MIME_TYPES = ["application/pdf", "application/x-pdf"]
IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "bmp", "gif", "tif", "tiff"}
IMAGE_MIME_PREFIX = "image/"

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Validate file extension and MIME type — PDFs and images supported
    filename = file.filename or "uploaded_document.pdf"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    is_pdf = ext == "pdf"
    is_image = ext in IMAGE_EXTENSIONS
    if not is_pdf and not is_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents and images (PNG, JPG, WEBP, BMP, TIFF) are supported."
        )

    # 2. Setup user upload path
    doc_id = str(uuid.uuid4())
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    clean_filename = os.path.basename(filename)
    safe_file_path = os.path.join(user_upload_dir, f"{doc_id}_{clean_filename}")

    # 3. Stream write file and check max size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    total_bytes = 0

    with open(safe_file_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                buffer.close()
                if os.path.exists(safe_file_path):
                    os.remove(safe_file_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
                )
            buffer.write(chunk)

    # 4. Create Document DB record in PROCESSING status
    db_doc = Document(
        id=doc_id,
        user_id=current_user.id,
        filename=clean_filename,
        file_path=safe_file_path,
        file_size=total_bytes,
        mime_type="application/pdf" if is_pdf else f"image/{ext}",
        status="PROCESSING",
        page_count=0
    )
    db.add(db_doc)
    await db.commit()
    await db.refresh(db_doc)

    # 5. Extract content: PDF pages via PyMuPDF, or image via OCR
    try:
        if is_pdf:
            pages = PDFParserService.extract_pages(safe_file_path)
        else:
            ocr_text = extract_text_from_image(safe_file_path, lang_hint=(current_user.preferred_language or "en"))
            if not ocr_text:
                raise ValueError("No readable text found in the image. Try a clearer, well-lit photo with visible text.")
            pages = [{"page_number": 1, "text": ocr_text, "char_count": len(ocr_text)}]
        page_count = len(pages)
        chunks = PDFParserService.chunk_document(pages)

        # Store chunks in PostgreSQL / SQLite
        for chunk in chunks:
            db_chunk = DocumentChunk(
                id=str(uuid.uuid4()),
                document_id=doc_id,
                page_number=chunk.page_number,
                chunk_index=chunk.chunk_index,
                text=chunk.text
            )
            db.add(db_chunk)

        # 6. Index into ChromaDB (non-fatal: chat falls back to DB chunks if this fails)
        try:
            vector_store = VectorStoreService.get_instance()
            vector_store.index_chunks(
                document_id=doc_id,
                user_id=str(current_user.id),
                filename=clean_filename,
                chunks=chunks
            )
        except Exception as vec_err:
            print(f"Vector indexing failed for doc {doc_id}, chat will use DB chunks: {vec_err}")

        db_doc.page_count = page_count
        db_doc.status = "READY"
        await db.commit()
        await db.refresh(db_doc)

    except Exception as e:
        db_doc.status = "FAILED"
        db_doc.error_message = str(e)
        await db.commit()
        await db.refresh(db_doc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )

    return db_doc

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    count_result = await db.execute(
        select(func.count(DocumentChunk.id)).where(DocumentChunk.document_id == document_id)
    )
    chunks_count = count_result.scalar_one_or_none() or 0

    return DocumentDetailResponse(
        id=doc.id,
        filename=doc.filename,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        status=doc.status,
        error_message=doc.error_message,
        page_count=doc.page_count,
        created_at=doc.created_at,
        chunks_count=chunks_count
    )

@router.get("/{document_id}/file")
async def download_document(
    document_id: str,
    token: Optional[str] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Serve the ORIGINAL uploaded file (PDF/image) for in-browser viewing.
    Ownership enforced. `?token=` fallback lets plain <a> links (no headers) open it."""
    current_user: Optional[User] = None
    if credentials:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub") if payload else None
        if user_id:
            res2 = await db.execute(select(User).where(User.id == user_id))
            current_user = res2.scalars().first()
    if current_user is None and token:
        payload = decode_access_token(token)
        user_id = payload.get("sub") if payload else None
        if user_id:
            res2 = await db.execute(select(User).where(User.id == user_id))
            current_user = res2.scalars().first()
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required")
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File missing on server.")
    return FileResponse(
        doc.file_path,
        media_type=doc.mime_type or "application/pdf",
        filename=doc.filename,
        content_disposition_type="inline",  # view in browser tab instead of forcing download
    )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # 1. Delete vectors from ChromaDB
    vector_store = VectorStoreService.get_instance()
    vector_store.delete_document_vectors(document_id)

    # 2. Delete file from storage
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    # 3. Delete from DB (cascades to chunks)
    await db.delete(doc)
    await db.commit()
    return None

@router.post("/{document_id}/process", response_model=DocumentResponse)
async def reprocess_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source file not found on disk.")

    doc.status = "PROCESSING"
    await db.commit()

    try:
        if (doc.mime_type or "").startswith("image/"):
            ocr_text = extract_text_from_image(doc.file_path, lang_hint=(current_user.preferred_language or "en"))
            if not ocr_text:
                raise ValueError("No readable text found in the image.")
            pages = [{"page_number": 1, "text": ocr_text, "char_count": len(ocr_text)}]
        else:
            pages = PDFParserService.extract_pages(doc.file_path)
        chunks = PDFParserService.chunk_document(pages)

        # Clear existing chunks
        existing_chunks = await db.execute(select(DocumentChunk).where(DocumentChunk.document_id == document_id))
        for c in existing_chunks.scalars().all():
            await db.delete(c)

        for chunk in chunks:
            db_chunk = DocumentChunk(
                id=str(uuid.uuid4()),
                document_id=doc.id,
                page_number=chunk.page_number,
                chunk_index=chunk.chunk_index,
                text=chunk.text
            )
            db.add(db_chunk)

        try:
            vector_store = VectorStoreService.get_instance()
            vector_store.delete_document_vectors(doc.id)
            vector_store.index_chunks(
                document_id=doc.id,
                user_id=str(current_user.id),
                filename=doc.filename,
                chunks=chunks
            )
        except Exception as vec_err:
            print(f"Vector re-indexing failed for doc {doc.id}, chat will use DB chunks: {vec_err}")

        doc.page_count = len(pages)
        doc.status = "READY"
        doc.error_message = None
        await db.commit()
        await db.refresh(doc)
    except Exception as e:
        doc.status = "FAILED"
        doc.error_message = str(e)
        await db.commit()
        await db.refresh(doc)
        raise HTTPException(status_code=500, detail=str(e))

    return doc
