from datetime import datetime, timezone, timedelta
from collections import defaultdict
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Deck, Card, CardSRS, StudySession, CardReview
from app.schemas import (
    OverviewStats, HeatmapEntry, DailyCardEntry, DeckMastery,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview", response_model=OverviewStats)
def overview(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    total_cards = db.query(func.count(Card.id)).scalar() or 0
    mastered = db.query(func.count(CardSRS.card_id)).filter(CardSRS.state == "mastered").scalar() or 0
    due_today = db.query(func.count(CardSRS.card_id)).filter(CardSRS.due_date <= now).scalar() or 0
    total_sessions = db.query(func.count(StudySession.id)).filter(StudySession.ended_at.isnot(None)).scalar() or 0
    total_time = db.query(func.sum(StudySession.duration_secs)).scalar() or 0
    total_decks = db.query(func.count(Deck.id)).scalar() or 0

    # Accuracy average across all sessions
    sessions = db.query(StudySession).filter(
        StudySession.ended_at.isnot(None),
        StudySession.cards_reviewed > 0,
    ).all()
    avg_accuracy = 0.0
    if sessions:
        avg_accuracy = round(
            sum(s.correct_count / s.cards_reviewed for s in sessions) / len(sessions) * 100, 1
        )

    # Streak calculation
    current_streak, longest_streak = _compute_streaks(db)

    return OverviewStats(
        total_cards=total_cards,
        mastered_cards=mastered,
        cards_due_today=due_today,
        total_sessions=total_sessions,
        total_study_time_secs=int(total_time),
        current_streak=current_streak,
        longest_streak=longest_streak,
        average_accuracy=avg_accuracy,
        total_decks=total_decks,
    )


def _compute_streaks(db: Session):
    """Compute current and longest daily study streaks."""
    sessions = (
        db.query(StudySession.started_at)
        .filter(StudySession.ended_at.isnot(None))
        .order_by(StudySession.started_at.desc())
        .all()
    )
    if not sessions:
        return 0, 0

    study_days = sorted(
        {s.started_at.date() for s in sessions}, reverse=True
    )

    today = datetime.now(timezone.utc).date()
    current = 0
    if study_days and study_days[0] >= today - timedelta(days=1):
        prev = study_days[0]
        for day in study_days:
            if (prev - day).days <= 1:
                current += 1
                prev = day
            else:
                break

    longest = 0
    run = 1
    for i in range(1, len(study_days)):
        if (study_days[i - 1] - study_days[i]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1
    longest = max(longest, current)

    return current, longest


@router.get("/heatmap", response_model=List[HeatmapEntry])
def heatmap(db: Session = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=365)
    sessions = (
        db.query(StudySession.started_at)
        .filter(StudySession.started_at >= cutoff, StudySession.ended_at.isnot(None))
        .all()
    )
    counts: dict = defaultdict(int)
    for (dt,) in sessions:
        counts[dt.date().isoformat()] += 1

    return [HeatmapEntry(date=d, count=c) for d, c in sorted(counts.items())]


@router.get("/daily-cards", response_model=List[DailyCardEntry])
def daily_cards(db: Session = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    reviews = (
        db.query(CardReview.reviewed_at, CardReview.quality)
        .filter(CardReview.reviewed_at >= cutoff)
        .all()
    )
    by_day: dict = defaultdict(lambda: {"reviewed": 0, "correct": 0})
    for (dt, quality) in reviews:
        key = dt.date().isoformat()
        by_day[key]["reviewed"] += 1
        if quality >= 3:
            by_day[key]["correct"] += 1

    return [
        DailyCardEntry(date=d, reviewed=v["reviewed"], correct=v["correct"])
        for d, v in sorted(by_day.items())
    ]


@router.get("/decks", response_model=List[DeckMastery])
def deck_mastery(db: Session = Depends(get_db)):
    decks = db.query(Deck).all()
    result = []
    for deck in decks:
        counts = defaultdict(int)
        for card in deck.cards:
            state = card.srs.state if card.srs else "new"
            counts[state] += 1
        total = sum(counts.values())
        result.append(DeckMastery(
            deck_id=deck.id,
            deck_title=deck.title,
            new_count=counts["new"],
            learning_count=counts["learning"],
            review_count=counts["review"],
            mastered_count=counts["mastered"],
            total=total,
        ))
    return result
