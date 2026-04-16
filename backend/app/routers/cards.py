from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Card, CardSRS
from app.schemas import CardOut, CardUpdate

router = APIRouter(prefix="/api", tags=["cards"])


@router.get("/cards/due", response_model=List[CardOut])
def get_due_cards(
    deck_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    q = (
        db.query(Card)
        .join(Card.srs)
        .filter(CardSRS.due_date <= now)
    )
    if deck_id:
        q = q.filter(Card.deck_id == deck_id)
    cards = q.order_by(CardSRS.due_date.asc()).limit(limit).all()
    return [CardOut.model_validate(c) for c in cards]


@router.get("/decks/{deck_id}/cards", response_model=List[CardOut])
def get_deck_cards(deck_id: str, db: Session = Depends(get_db)):
    cards = (
        db.query(Card)
        .filter(Card.deck_id == deck_id)
        .order_by(Card.created_at.asc())
        .all()
    )
    return [CardOut.model_validate(c) for c in cards]


@router.patch("/cards/{card_id}", response_model=CardOut)
def update_card(card_id: str, body: CardUpdate, db: Session = Depends(get_db)):
    card = db.get(Card, card_id)
    if not card:
        raise HTTPException(404, "Card not found.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return CardOut.model_validate(card)


@router.delete("/cards/{card_id}")
def delete_card(card_id: str, db: Session = Depends(get_db)):
    card = db.get(Card, card_id)
    if not card:
        raise HTTPException(404, "Card not found.")
    # Update parent deck count
    if card.deck:
        card.deck.card_count = max(0, card.deck.card_count - 1)
    db.delete(card)
    db.commit()
    return {"ok": True}
