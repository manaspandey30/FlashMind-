from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StudySession, CardReview, Card
from app.schemas import SessionOut, SessionDetail, CardReviewOut

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=List[SessionOut])
def list_sessions(
    deck_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    q = db.query(StudySession).filter(StudySession.ended_at.isnot(None))
    if deck_id:
        q = q.filter(StudySession.deck_id == deck_id)
    sessions = q.order_by(StudySession.started_at.desc()).offset(offset).limit(limit).all()

    result = []
    for s in sessions:
        out = SessionOut.model_validate(s)
        out.accuracy = (
            round(s.correct_count / s.cards_reviewed * 100, 1)
            if s.cards_reviewed > 0 else 0.0
        )
        result.append(out)
    return result


@router.get("/{session_id}", response_model=SessionDetail)
def get_session_detail(session_id: str, db: Session = Depends(get_db)):
    session = db.get(StudySession, session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    reviews_raw = (
        db.query(CardReview)
        .filter(CardReview.session_id == session_id)
        .order_by(CardReview.reviewed_at.asc())
        .all()
    )

    reviews_out = []
    for r in reviews_raw:
        card = db.get(Card, r.card_id)
        reviews_out.append(CardReviewOut(
            id=r.id,
            card_id=r.card_id,
            card_front=card.front if card else "[deleted]",
            quality=r.quality,
            time_taken_ms=r.time_taken_ms or 0,
            reviewed_at=r.reviewed_at,
        ))

    out = SessionDetail.model_validate(session)
    out.accuracy = (
        round(session.correct_count / session.cards_reviewed * 100, 1)
        if session.cards_reviewed > 0 else 0.0
    )
    out.reviews = reviews_out
    return out
