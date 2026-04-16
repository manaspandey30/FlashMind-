"""
AI card generation using Groq API.
Converts PDF text chunks into high-quality flashcards.
"""
from __future__ import annotations
import json
import re
import logging
from typing import List, Dict, Any
from groq import Groq
from app.config import settings
from app.services.pdf_parser import TextChunk

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert educator and cognitive science specialist creating flashcards for deep, long-term learning.

Your task: Given a section of text, generate high-quality flashcards that promote genuine understanding — not just surface-level recall.

Generate cards across these types:
- DEFINITION: Precise definition of a key term or concept
- CONCEPT: Why/how questions that test understanding of mechanisms and principles
- RELATIONSHIP: How two or more concepts connect, contrast, or interact
- EXAMPLE: A worked example, application, or case that illustrates a principle
- EDGE_CASE: A common misconception, boundary condition, or tricky nuance

Rules:
- Front (question) must be specific, unambiguous, and standalone (no "according to the text" phrasing)
- Back (answer) must be complete but concise — under 80 words
- No trivial yes/no questions
- No cards that can be answered with a single word unless it's a precise technical term
- Vary difficulty: ~40% recall, ~40% understanding, ~20% application/edge-case
- If the text contains worked examples or formulas, create at least one EXAMPLE card
- Each card must stand alone — someone should be able to study it without reading the others

Output ONLY a valid JSON array. No markdown, no explanation, no prefix text.

Format:
[
  {
    "front": "question text",
    "back": "answer text",
    "type": "DEFINITION|CONCEPT|RELATIONSHIP|EXAMPLE|EDGE_CASE",
    "hint": "optional short hint (or empty string)"
  }
]"""


def _build_user_prompt(chunk: TextChunk, cards_per_chunk: int) -> str:
    return (
        f"Section: {chunk.section}\n\n"
        f"Text:\n{chunk.text}\n\n"
        f"Generate {cards_per_chunk} flashcards from this content."
    )


def _parse_cards(raw: str) -> List[Dict[str, Any]]:
    """Extract and validate JSON array from LLM response."""
    # Strip any accidental markdown fences
    raw = re.sub(r'^```(?:json)?\s*', '', raw.strip(), flags=re.MULTILINE)
    raw = re.sub(r'```\s*$', '', raw.strip(), flags=re.MULTILINE)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON array with regex as fallback
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if not match:
            logger.warning("Could not parse cards JSON from LLM response")
            return []
        data = json.loads(match.group())

    if not isinstance(data, list):
        return []

    valid = []
    for item in data:
        if not isinstance(item, dict):
            continue
        front = str(item.get("front", "")).strip()
        back = str(item.get("back", "")).strip()
        if len(front) < 10 or len(back) < 10:
            continue
        valid.append({
            "front": front,
            "back": back,
            "card_type": _normalize_type(str(item.get("type", "basic"))),
            "hint": str(item.get("hint", "")).strip(),
        })

    return valid


def _normalize_type(t: str) -> str:
    mapping = {
        "DEFINITION": "definition",
        "CONCEPT": "conceptual",
        "RELATIONSHIP": "conceptual",
        "EXAMPLE": "example",
        "EDGE_CASE": "conceptual",
        "BASIC": "basic",
        "CLOZE": "cloze",
    }
    return mapping.get(t.upper(), "basic")


def _deduplicate(cards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove near-duplicate fronts using simple token overlap."""
    seen: List[str] = []
    result = []
    for card in cards:
        tokens = set(card["front"].lower().split())
        duplicate = False
        for prev in seen:
            prev_tokens = set(prev.split())
            overlap = len(tokens & prev_tokens) / max(len(tokens | prev_tokens), 1)
            if overlap > 0.7:
                duplicate = True
                break
        if not duplicate:
            seen.append(card["front"].lower())
            result.append(card)
    return result


def generate_cards_for_chunks(
    chunks: List[TextChunk],
    cards_per_chunk: int | None = None,
    progress_callback=None,   # callable(current: int, total: int)
) -> List[Dict[str, Any]]:
    """
    Generate flashcards for a list of text chunks.
    Returns a deduplicated list of card dicts ready for DB insertion.
    """
    if cards_per_chunk is None:
        cards_per_chunk = settings.cards_per_chunk

    client = Groq(api_key=settings.groq_api_key)
    all_cards: List[Dict[str, Any]] = []
    total = len(chunks)

    for i, chunk in enumerate(chunks):
        if progress_callback:
            progress_callback(i, total)

        try:
            response = client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": _build_user_prompt(chunk, cards_per_chunk)},
                ],
                temperature=0.4,
                max_tokens=2048,
            )
            raw = response.choices[0].message.content or ""
            cards = _parse_cards(raw)
            all_cards.extend(cards)
            logger.info(f"Chunk {i+1}/{total}: generated {len(cards)} cards")
        except Exception as exc:
            logger.error(f"Groq error on chunk {i+1}: {exc}")
            continue

    if progress_callback:
        progress_callback(total, total)

    return _deduplicate(all_cards)
