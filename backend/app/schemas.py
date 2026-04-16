from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ── Deck ─────────────────────────────────────────────────────────────────────

class DeckBase(BaseModel):
    title: str
    description: str = ""
    tags: str = ""


class DeckCreate(DeckBase):
    source_file: str


class DeckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None


class DeckOut(DeckBase):
    id: str
    source_file: str
    card_count: int
    created_at: datetime
    updated_at: datetime
    due_count: int = 0
    mastered_count: int = 0

    class Config:
        from_attributes = True


# ── Card ─────────────────────────────────────────────────────────────────────

class CardBase(BaseModel):
    front: str
    back: str
    card_type: str = "basic"
    hint: str = ""
    tags: str = ""


class CardCreate(CardBase):
    deck_id: str


class CardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    hint: Optional[str] = None
    tags: Optional[str] = None


class SRSOut(BaseModel):
    ease_factor: float
    interval: int
    repetitions: int
    due_date: datetime
    state: str

    class Config:
        from_attributes = True


class CardOut(CardBase):
    id: str
    deck_id: str
    created_at: datetime
    srs: Optional[SRSOut] = None

    class Config:
        from_attributes = True


# ── Review ────────────────────────────────────────────────────────────────────

class ReviewAnswer(BaseModel):
    session_id: str
    card_id: str
    quality: int          # 0–5
    time_taken_ms: int = 0


class SessionStart(BaseModel):
    deck_id: Optional[str] = None   # None = review all due cards


class SessionOut(BaseModel):
    id: str
    deck_id: Optional[str]
    deck_title: str
    started_at: datetime
    ended_at: Optional[datetime]
    cards_reviewed: int
    correct_count: int
    duration_secs: int
    accuracy: float = 0.0

    class Config:
        from_attributes = True


class ReviewAnswerOut(BaseModel):
    next_card: Optional[CardOut]
    srs_update: SRSOut
    session_progress: int
    session_total: int


# ── Upload ────────────────────────────────────────────────────────────────────

class UploadStatus(BaseModel):
    job_id: str
    status: str           # queued|parsing|generating|saving|done|error
    progress: int         # 0–100
    message: str = ""
    deck_id: Optional[str] = None
    cards_generated: int = 0
    error: Optional[str] = None


# ── Analytics ─────────────────────────────────────────────────────────────────

class OverviewStats(BaseModel):
    total_cards: int
    mastered_cards: int
    cards_due_today: int
    total_sessions: int
    total_study_time_secs: int
    current_streak: int
    longest_streak: int
    average_accuracy: float
    total_decks: int


class HeatmapEntry(BaseModel):
    date: str             # YYYY-MM-DD
    count: int


class DailyCardEntry(BaseModel):
    date: str
    reviewed: int
    correct: int


class DeckMastery(BaseModel):
    deck_id: str
    deck_title: str
    new_count: int
    learning_count: int
    review_count: int
    mastered_count: int
    total: int


# ── History ───────────────────────────────────────────────────────────────────

class CardReviewOut(BaseModel):
    id: str
    card_id: str
    card_front: str
    quality: int
    time_taken_ms: int
    reviewed_at: datetime

    class Config:
        from_attributes = True


class SessionDetail(SessionOut):
    reviews: List[CardReviewOut] = []
