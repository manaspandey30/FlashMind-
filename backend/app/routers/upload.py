"""
PDF upload and card generation pipeline.
Uses an in-memory job store for progress tracking (single-user local app).
"""
from __future__ import annotations
import uuid
import threading
import logging
from typing import Dict
from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends
from app.database import get_db
from app.models import Deck, Card, CardSRS
from app.schemas import UploadStatus
from app.services.pdf_parser import extract_chunks, get_pdf_title
from app.services.card_generator import generate_cards_for_chunks
from app.services.srs_engine import initial_srs_state
from app.config import settings
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/upload", tags=["upload"])

# In-memory job store: job_id → UploadStatus dict
_jobs: Dict[str, dict] = {}


def _run_pipeline(job_id: str, pdf_bytes: bytes, filename: str, db_url: str):
    """Background thread: parse → generate → save."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(bind=engine)
    db: Session = SessionLocal()

    def update(status: str, progress: int, message: str = "", **kw):
        _jobs[job_id].update({"status": status, "progress": progress, "message": message, **kw})

    try:
        update("parsing", 10, "Parsing PDF…")
        chunks = extract_chunks(pdf_bytes)
        title = get_pdf_title(pdf_bytes)
        if not chunks:
            update("error", 0, "No readable text found in PDF.", error="Empty document")
            return

        total_chunks = len(chunks)
        update("generating", 20, f"Generating cards from {total_chunks} sections…")

        def progress_cb(current: int, total: int):
            pct = 20 + int((current / max(total, 1)) * 60)
            update("generating", pct, f"Processing section {current}/{total}…")

        cards_data = generate_cards_for_chunks(chunks, progress_callback=progress_cb)

        if not cards_data:
            update("error", 0, "Card generation returned no results.", error="LLM returned empty")
            return

        update("saving", 85, f"Saving {len(cards_data)} cards…")

        deck = Deck(
            id=str(uuid.uuid4()),
            title=title,
            source_file=filename,
            card_count=len(cards_data),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(deck)
        db.flush()

        for cd in cards_data:
            card = Card(
                deck_id=deck.id,
                front=cd["front"],
                back=cd["back"],
                card_type=cd["card_type"],
                hint=cd.get("hint", ""),
            )
            db.add(card)
            db.flush()

            srs_init = initial_srs_state()
            srs = CardSRS(
                card_id=card.id,
                ease_factor=srs_init.ease_factor,
                interval=srs_init.interval,
                repetitions=srs_init.repetitions,
                due_date=srs_init.due_date,
                state=srs_init.state,
            )
            db.add(srs)

        db.commit()
        update("done", 100, "Done!", deck_id=deck.id, cards_generated=len(cards_data))
        logger.info(f"Job {job_id}: created deck {deck.id} with {len(cards_data)} cards")

    except Exception as exc:
        logger.exception(f"Pipeline failed for job {job_id}")
        db.rollback()
        update("error", 0, str(exc), error=str(exc))
    finally:
        db.close()


@router.post("", response_model=UploadStatus)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted.")

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_pdf_size_mb:
        raise HTTPException(413, f"File too large ({size_mb:.1f} MB). Max: {settings.max_pdf_size_mb} MB.")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
        "message": "Queued",
        "deck_id": None,
        "cards_generated": 0,
        "error": None,
    }

    from app.config import settings as cfg
    thread = threading.Thread(
        target=_run_pipeline,
        args=(job_id, content, file.filename, cfg.database_url),
        daemon=True,
    )
    thread.start()

    return UploadStatus(**_jobs[job_id])


@router.get("/{job_id}/status", response_model=UploadStatus)
async def get_status(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(404, "Job not found.")
    return UploadStatus(**_jobs[job_id])
