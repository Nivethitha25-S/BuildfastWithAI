import os
import re
from typing import List, Dict, Any
import fitz  # PyMuPDF

class PageChunk:
    def __init__(self, page_number: int, chunk_index: int, text: str, metadata: Dict[str, Any] = None):
        self.page_number = page_number
        self.chunk_index = chunk_index
        self.text = text
        self.metadata = metadata or {}

class PDFParserService:
    @staticmethod
    def extract_pages(file_path: str) -> List[Dict[str, Any]]:
        """
        Extract text from PDF preserving 1-indexed page numbers.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        pages_content = []
        doc = fitz.open(file_path)
        try:
            for index, page in enumerate(doc):
                page_num = index + 1
                raw_text = page.get_text("text") or ""
                # Clean text: normalize whitespace and remove non-printable chars
                cleaned = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', raw_text)
                cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()
                
                pages_content.append({
                    "page_number": page_num,
                    "text": cleaned,
                    "char_count": len(cleaned)
                })
        finally:
            doc.close()
            
        return pages_content

    @staticmethod
    def chunk_document(pages: List[Dict[str, Any]], chunk_size: int = 800, overlap: int = 150) -> List[PageChunk]:
        """
        Break page texts into overlapping chunks while strictly preserving page numbers.
        """
        chunks: List[PageChunk] = []
        global_chunk_idx = 0

        for p in pages:
            page_no = p["page_number"]
            text = p["text"]
            
            if not text:
                continue

            # If text fits comfortably in one chunk
            if len(text) <= chunk_size:
                chunks.append(PageChunk(
                    page_number=page_no,
                    chunk_index=global_chunk_idx,
                    text=text,
                    metadata={"page": page_no, "chunk_in_page": 0}
                ))
                global_chunk_idx += 1
                continue

            # Sliding window within the page
            start = 0
            page_chunk_idx = 0
            while start < len(text):
                end = start + chunk_size
                # Try to break at paragraph or newline or space boundary
                if end < len(text):
                    last_break = text.rfind("\n", start, end)
                    if last_break == -1 or last_break <= start + (chunk_size // 2):
                        last_break = text.rfind(". ", start, end)
                    if last_break == -1 or last_break <= start + (chunk_size // 2):
                        last_break = text.rfind(" ", start, end)
                    if last_break != -1 and last_break > start + 100:
                        end = last_break + 1

                chunk_text = text[start:end].strip()
                if chunk_text:
                    chunks.append(PageChunk(
                        page_number=page_no,
                        chunk_index=global_chunk_idx,
                        text=chunk_text,
                        metadata={"page": page_no, "chunk_in_page": page_chunk_idx}
                    ))
                    global_chunk_idx += 1
                    page_chunk_idx += 1

                if end >= len(text):
                    break
                start = end - overlap

        return chunks
