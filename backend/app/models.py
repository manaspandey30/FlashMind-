import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Deck(Base):
    __tablename__ = "decks"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    source_file = Column(String, nullable=False)
    tags = Column(String, default="")          # comma-separated
    card_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan")
    sessions = relationship("StudySession", back_populates="deck")


class Card(Base):
    __tablename__ = "cards"

    id = Column(String, primary_key=True, default=_uuid)
    deck_id = Column(String, ForeignKey("decks.id", ondelete="CASCADE"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    card_type = Column(String, default="basic")   # basic|cloze|definition|example|conceptual
    hint = Column(Text, default="")
    tags = Column(String, default="")
    created_at = Column(DateTime, default=_now)

    deck = relationship("Deck", back_populates="cards")
    srs = relationship("CardSRS", back_populates="card", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("CardReview", back_populates="card", cascade="all, delete-orphan")


class CardSRS(Base):
    __tablename__ = "card_srs"

    card_id = Column(String, ForeignKey("cards.id", ondelete="CASCADE"), primary_key=True)
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)         # days
    repetitions = Column(Integer, default=0)
    due_date = Column(DateTime, nullable=False)
    state = Column(String, default="new")          # new|learning|review|mastered

    card = relationship("Card", back_populates="srs")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String, primary_key=True, default=_uuid)
    deck_id = Column(String, ForeignKey("decks.id", ondelete="SET NULL"), nullable=True)
    deck_title = Column(String, default="")
    started_at = Column(DateTime, default=_now)
    ended_at = Column(DateTime, nullable=True)
    cards_reviewed = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    duration_secs = Column(Integer, default=0)

    deck = relationship("Deck", back_populates="sessions")
    reviews = relationship("CardReview", back_populates="session", cascade="all, delete-orphan")


class CardReview(Base):
    __tablename__ = "card_reviews"

    id = Column(String, primary_key=True, default=_uuid)
    session_id = Column(String, ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False)
    card_id = Column(String, ForeignKey("cards.id", ondelete="CASCADE"), nullable=False)
    quality = Column(Integer, nullable=False)      # 0–5
    time_taken_ms = Column(Integer, default=0)
    reviewed_at = Column(DateTime, default=_now)
    ease_before = Column(Float, nullable=True)
    interval_before = Column(Integer, nullable=True)

    session = relationship("StudySession", back_populates="reviews")
    card = relationship("Card", back_populates="reviews")
