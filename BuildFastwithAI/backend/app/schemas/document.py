from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    file_size: int
    mime_type: str
    status: str
    error_message: Optional[str] = None
    page_count: int
    created_at: datetime

class DocumentChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    page_number: int
    chunk_index: int
    text: str

class DocumentDetailResponse(DocumentResponse):
    chunks_count: int = 0
