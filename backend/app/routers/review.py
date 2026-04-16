"""
Review session management.
Tracks active sessions and applies SM-2 after each answer.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Card, CardSRS, StudySession, CardReview
from app.schemas import (
    SessionStart, ReviewAnswer, ReviewAnswerOut,
    SessionOut, CardOut, SRSOut,
)
from app.services.srs_engine import apply_review

router = APIRouter(prefix="/api/review", tags=["review"])

# In-memory session card queues: session_id → [card_id, ...]
_session_queues: dict[str, List[str]] = {}


def _next_card(session_id: str, db: Session) -> Optional[Card]:
    queue = _session_queues.get(session_id, [])
    while queue:
        card_id = queue[0]
        card = db.get(Card, card_id)
        if card:
            return card
        queue.pop(0)
    return None


@router.post("/start", response_model=dict)
def start_session(body: SessionStart, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # Build due-card queue
    q = db.query(Card).join(Card.srs).filter(CardSRS.due_date <= now)
    if body.deck_id:
        q = q.filter(Card.deck_id == body.deck_id)
    cards = q.order_by(CardSRS.due_date.asc()).all()

    if not cards:
        raise HTTPException(404, "No cards due for review.")

    deck_title = ""
    if body.deck_id and cards:
        deck_title = cards[0].deck.title if cards[0].deck else ""

    session = StudySession(
        id=str(uuid.uuid4()),
        deck_id=body.deck_id,
        deck_title=deck_title,
        started_at=now,
    )
    db.add(session)
    db.commit()

    card_ids = [c.id for c in cards]
    _session_queues[session.id] = card_ids

    first_card = db.get(Card, card_ids[0])
    return {
        "session_id": session.id,
        "total_cards": len(card_ids),
        "first_card": CardOut.model_validate(first_card),
    }


@router.post("/answer", response_model=ReviewAnswerOut)
def submit_answer(body: ReviewAnswer, db: Session = Depends(get_db)):
    if body.quality < 0 or body.quality > 5:
        raise HTTPException(400, "Quality must be 0–5.")

    session = db.get(StudySession, body.session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    card = db.get(Card, body.card_id)
    if not card:
        raise HTTPException(404, "Card not found.")

    srs = card.srs
    if not srs:
        raise HTTPException(500, "Card has no SRS state.")

    ease_before = srs.ease_factor
    interval_before = srs.interval

    result = apply_review(
        quality=body.quality,
        ease_factor=srs.ease_factor,
        interval=srs.interval,
        repetitions=srs.repetitions,
    )

    # Persist SRS update
    srs.ease_factor = result.ease_factor
    srs.interval = result.interval
    srs.repetitions = result.repetitions
    srs.due_date = result.due_date
    srs.state = result.state

    # Record review
    review = CardReview(
        id=str(uuid.uuid4()),
        session_id=body.session_id,
        card_id=body.card_id,
        quality=body.quality,
        time_taken_ms=body.time_taken_ms,
        reviewed_at=datetime.now(timezone.utc),
        ease_before=ease_before,
        interval_before=interval_before,
    )
    db.add(review)

    # Update session stats
    session.cards_reviewed += 1
    if body.quality >= 3:
        session.correct_count += 1

    db.commit()

    # Advance queue
    queue = _session_queues.get(body.session_id, [])
    if queue and queue[0] == body.card_id:
        queue.pop(0)

    # Re-queue failed cards at back
    if body.quality < 3 and body.card_id not in queue:
        queue.append(body.card_id)

    progress = session.cards_reviewed
    total = progress + len(queue)

    next_card = _next_card(body.session_id, db)

    return ReviewAnswerOut(
        next_card=CardOut.model_validate(next_card) if next_card else None,
        srs_update=SRSOut.model_validate(srs),
        session_progress=progress,
        session_total=total,
    )


@router.post("/end/{session_id}", response_model=SessionOut)
def end_session(session_id: str, db: Session = Depends(get_db)):
    session = db.get(StudySession, session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    now = datetime.now(timezone.utc)
    session.ended_at = now
    if session.started_at:
        delta = now - session.started_at.replace(tzinfo=timezone.utc) if session.started_at.tzinfo is None else now - session.started_at
        session.duration_secs = int(delta.total_seconds())

    db.commit()
    _session_queues.pop(session_id, None)

    out = SessionOut.model_validate(session)
    out.accuracy = (
        round(session.correct_count / session.cards_reviewed * 100, 1)
        if session.cards_reviewed > 0 else 0.0
    )
    return out


@router.get("/session/{session_id}", response_model=SessionOut)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.get(StudySession, session_id)
    if not session:
        raise HTTPException(404, "Session not found.")
    out = SessionOut.model_validate(session)
    out.accuracy = (
        round(session.correct_count / session.cards_reviewed * 100, 1)
        if session.cards_reviewed > 0 else 0.0
    )
    return out
