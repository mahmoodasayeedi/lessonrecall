"""Read a PDF page by page. Each page with text becomes one chunk."""
import hashlib
import io
from pathlib import Path

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.ingestion.errors import NoTextError, UnsupportedFileError
from app.models import Chunk

MIN_PAGE_CHARACTERS = 30


def pdf_to_chunks(data: bytes, filename: str) -> tuple[str, str, int, list[Chunk]]:
    """Returns (document_id, title, page_count, chunks)."""
    try:
        reader = PdfReader(io.BytesIO(data))
    except PdfReadError as e:
        raise UnsupportedFileError("This file could not be read as a PDF.") from e

    document_id = "pdf-" + hashlib.sha256(data).hexdigest()[:12]
    title = Path(filename).stem

    chunks = []
    for page_number, page in enumerate(reader.pages, start=1):
        text = " ".join((page.extract_text() or "").split())
        if len(text) < MIN_PAGE_CHARACTERS:
            continue  # skip empty pages and pages with only a title
        chunks.append(Chunk(
            chunk_index=page_number,
            text=text,
            page=page_number,
            video_id=document_id,
            title=title,
            source_type="pdf",
        ))

    if not chunks:
        raise NoTextError("No text was found in this PDF. If it is scanned, please upload a text-based PDF.")
    return document_id, title, len(reader.pages), chunks