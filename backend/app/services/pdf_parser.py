"""
PDF parsing service using PyMuPDF.
Extracts structured text with section hierarchy, cleaned of noise.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import List
import fitz  # PyMuPDF


@dataclass
class TextChunk:
    section: str          # heading context for this chunk
    text: str
    page_start: int
    page_end: int
    char_count: int = field(init=False)

    def __post_init__(self):
        self.char_count = len(self.text)


def _clean(text: str) -> str:
    """Remove excess whitespace and common PDF artifacts."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x20-\x7E\n]', ' ', text)  # strip non-printable
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)   # dehyphenate
    return text.strip()


def _is_noise(line: str) -> bool:
    """Skip headers, footers, page numbers, and other boilerplate."""
    stripped = line.strip()
    if not stripped:
        return True
    if re.match(r'^\d+$', stripped):            # bare page number
        return True
    if len(stripped) < 3:
        return True
    return False


def extract_chunks(
    pdf_bytes: bytes,
    chunk_size: int = 1000,   # target chars per chunk
    overlap: int = 150,
) -> List[TextChunk]:
    """
    Open a PDF from bytes and return a list of TextChunk objects.
    Each chunk carries its nearest heading as section context.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    chunks: List[TextChunk] = []

    current_section = "Introduction"
    full_paragraphs: List[tuple[str, str, int]] = []  # (section, text, page)

    for page_num, page in enumerate(doc, start=1):
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            if block.get("type") != 0:  # text block only
                continue
            for line in block.get("lines", []):
                line_text = " ".join(
                    span["text"] for span in line.get("spans", [])
                ).strip()

                if _is_noise(line_text):
                    continue

                # Detect headings by font size / boldness
                spans = line.get("spans", [])
                if spans:
                    font_size = spans[0].get("size", 12)
                    is_bold = "Bold" in spans[0].get("font", "")
                    if font_size >= 14 or (is_bold and font_size >= 12 and len(line_text) < 120):
                        current_section = _clean(line_text)
                        continue

                cleaned = _clean(line_text)
                if cleaned:
                    full_paragraphs.append((current_section, cleaned, page_num))

    # Group paragraphs into chunks by size
    current_text = ""
    current_section_name = full_paragraphs[0][0] if full_paragraphs else "Content"
    chunk_start_page = 1
    last_page = 1

    for i, (section, para, page) in enumerate(full_paragraphs):
        if section != current_section_name and current_text:
            # Section changed — emit chunk
            chunks.append(TextChunk(
                section=current_section_name,
                text=current_text.strip(),
                page_start=chunk_start_page,
                page_end=last_page,
            ))
            # Start new chunk with overlap from end of current
            overlap_text = current_text[-overlap:] if len(current_text) > overlap else current_text
            current_text = overlap_text + " " + para
            current_section_name = section
            chunk_start_page = page
        else:
            current_text += " " + para

        last_page = page

        # Size-based split within same section
        if len(current_text) >= chunk_size:
            chunks.append(TextChunk(
                section=current_section_name,
                text=current_text.strip(),
                page_start=chunk_start_page,
                page_end=last_page,
            ))
            overlap_text = current_text[-overlap:]
            current_text = overlap_text
            chunk_start_page = page

    # Final chunk
    if current_text.strip():
        chunks.append(TextChunk(
            section=current_section_name,
            text=current_text.strip(),
            page_start=chunk_start_page,
            page_end=last_page,
        ))

    doc.close()

    # Filter out tiny chunks
    return [c for c in chunks if c.char_count >= 100]


def get_pdf_title(pdf_bytes: bytes) -> str:
    """Extract title from PDF metadata or first heading."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    meta = doc.metadata
    doc.close()
    if meta and meta.get("title"):
        title = meta["title"].strip()
        if title and title.lower() not in ("untitled", "unknown"):
            return title
    return "Untitled Document"
