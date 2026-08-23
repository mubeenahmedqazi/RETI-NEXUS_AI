# src/ocr_extraction.py
"""
Text extraction for uploaded follow-up diagnostic test reports (PDF/JPG/JPEG), used by
the Detailed Analysis feature. PDFs try native text extraction first — most digital lab
report PDFs already have selectable text — and only fall back to OCR (Tesseract) per
page when a page has too little native text, which covers scanned/photographed PDFs.
JPG/JPEG uploads are always OCR'd directly.
"""

import io
import os
import re

import pytesseract
from PIL import Image

# A freshly-installed Tesseract binary isn't on this process's PATH until the shell/
# session is refreshed, so point pytesseract at the known install locations directly.
# Override with the TESSERACT_CMD env var if installed somewhere else.
_DEFAULT_TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]


def _configure_tesseract_path():
    custom = os.getenv("TESSERACT_CMD")
    if custom and os.path.exists(custom):
        pytesseract.pytesseract.tesseract_cmd = custom
        return
    for path in _DEFAULT_TESSERACT_PATHS:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            return


_configure_tesseract_path()

# A PDF page with fewer native characters than this is treated as scanned/image-only
# and rasterized for OCR instead of trusting its (near-empty) selectable text layer.
MIN_NATIVE_TEXT_CHARS = 40
SUPPORTED_EXTENSIONS = (".pdf", ".jpg", ".jpeg", ".png")


class OCRUnavailableError(RuntimeError):
    """Raised when the Tesseract binary cannot be located or fails to run."""


def extract_document_text(file_bytes: bytes, filename: str) -> dict:
    """
    Extracts text from an uploaded diagnostic test report.

    Returns {"text": str, "method": "native" | "ocr" | "mixed", "pages": int}.
    Raises ValueError for an unsupported extension, OCRUnavailableError if Tesseract
    itself can't be run.
    """
    ext = os.path.splitext(filename or "")[1].lower()

    if ext == ".pdf":
        return _extract_from_pdf(file_bytes)
    if ext in (".jpg", ".jpeg", ".png"):
        return _extract_from_image(file_bytes)

    raise ValueError(f"Unsupported file type: {ext}")


def _extract_from_pdf(file_bytes: bytes) -> dict:
    import fitz  # PyMuPDF

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    page_texts = []
    used_ocr = False
    used_native = False

    try:
        for page in doc:
            native_text = page.get_text().strip()
            if len(native_text) >= MIN_NATIVE_TEXT_CHARS:
                page_texts.append(native_text)
                used_native = True
                continue

            # Sparse/no selectable text on this page — treat as scanned and OCR it.
            pix = page.get_pixmap(dpi=300)
            image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            page_texts.append(_run_ocr(image))
            used_ocr = True
    finally:
        doc.close()

    method = "mixed" if used_native and used_ocr else ("native" if used_native else "ocr")
    return {
        "text": "\n\n".join(t for t in page_texts if t).strip(),
        "method": method,
        "pages": len(page_texts),
    }


def _extract_from_image(file_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return {"text": _run_ocr(image), "method": "ocr", "pages": 1}


def _run_ocr(image: Image.Image) -> str:
    try:
        return pytesseract.image_to_string(image).strip()
    except pytesseract.pytesseract.TesseractNotFoundError as e:
        raise OCRUnavailableError(
            "Tesseract OCR engine is not installed or could not be found on this server."
        ) from e


def verify_patient_name_in_text(patient_name: str, extracted_text: str) -> bool:
    """
    Lenient check that the uploaded document actually belongs to this patient: requires
    at least half (rounded up, minimum 1) of the patient's name tokens — ignoring short
    tokens like initials/titles — to appear as substrings of the extracted text. OCR
    noise and name-order differences ("Ahmad, Mubeen" vs "Mubeen Ahmad") make an exact
    full-name match too strict, but a genuinely different patient's report should still
    fail this on both name parts.
    """
    if not patient_name or not extracted_text:
        return False

    normalized_text = re.sub(r"\s+", " ", extracted_text).lower()
    tokens = [t for t in re.split(r"\s+", patient_name.strip().lower()) if len(t) >= 3]
    if not tokens:
        return False

    matches = sum(1 for t in tokens if t in normalized_text)
    required = max(1, (len(tokens) + 1) // 2)
    return matches >= required
