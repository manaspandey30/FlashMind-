"""
SM-2 spaced repetition algorithm implementation.
Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
"""
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass


@dataclass
class SRSResult:
    ease_factor: float
    interval: int        # days
    repetitions: int
    due_date: datetime
    state: str           # new | learning | review | mastered


def apply_review(
    quality: int,           # 0–5
    ease_factor: float,
    interval: int,
    repetitions: int,
) -> SRSResult:
    """
    Apply a single review response to the SM-2 state.

    Quality scale:
        0 = complete blackout
        1 = wrong answer, but upon seeing correct one it seemed easy
        2 = wrong answer, but upon seeing correct one it was easy to recall
        3 = correct answer with significant difficulty
        4 = correct answer after hesitation
        5 = perfect response
    """
    if quality < 0 or quality > 5:
        raise ValueError(f"Quality must be 0–5, got {quality}")

    new_ef = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, new_ef)

    if quality < 3:
        new_repetitions = 0
        new_interval = 1
        state = "learning"
    else:
        new_repetitions = repetitions + 1
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * ease_factor)
        state = "mastered" if new_interval >= 21 else "review"

    now = datetime.now(timezone.utc)
    due_date = now + timedelta(days=new_interval)

    return SRSResult(
        ease_factor=round(new_ef, 4),
        interval=new_interval,
        repetitions=new_repetitions,
        due_date=due_date,
        state=state,
    )


def initial_srs_state() -> SRSResult:
    """Fresh SRS state for a new card — due immediately."""
    return SRSResult(
        ease_factor=2.5,
        interval=0,
        repetitions=0,
        due_date=datetime.now(timezone.utc),
        state="new",
    )
