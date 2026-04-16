from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Deck, CardSRS
from app.schemas import DeckOut, DeckUpdate

router = APIRouter(prefix="/api/decks", tags=["decks"])


def _enrich(deck: Deck, db: Session) -> DeckOut:
    now = datetime.now(timezone.utc)
    due_count = (
        db.query(func.count(CardSRS.card_id))
        .join(CardSRS.card)
        .filter(
            CardSRS.due_date <= now,
            CardSRS.card.has(deck_id=deck.id),
        )
        .scalar() or 0
    )
    mastered_count = (
        db.query(func.count(CardSRS.card_id))
        .join(CardSRS.card)
        .filter(
            CardSRS.state == "mastered",
            CardSRS.card.has(deck_id=deck.id),
        )
        .scalar() or 0
    )
    out = DeckOut.model_validate(deck)
    out.due_count = due_count
    out.mastered_count = mastered_count
    return out


@router.get("", response_model=List[DeckOut])
def list_decks(db: Session = Depends(get_db)):
    decks = db.query(Deck).order_by(Deck.created_at.desc()).all()
    return [_enrich(d, db) for d in decks]


@router.get("/{deck_id}", response_model=DeckOut)
def get_deck(deck_id: str, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck:
        raise HTTPException(404, "Deck not found.")
    return _enrich(deck, db)


@router.patch("/{deck_id}", response_model=DeckOut)
def update_deck(deck_id: str, body: DeckUpdate, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck:
        raise HTTPException(404, "Deck not found.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(deck, field, value)
    deck.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deck)
    return _enrich(deck, db)


@router.delete("/{deck_id}")
def delete_deck(deck_id: str, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck:
        raise HTTPException(404, "Deck not found.")
    db.delete(deck)
    db.commit()
    return {"ok": True}
