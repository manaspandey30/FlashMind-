from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import upload, decks, cards, review, analytics, history

# Create all tables on startup (no-op if already exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FlashMind API",
    description="AI-powered spaced repetition flashcard engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(decks.router)
app.include_router(cards.router)
app.include_router(review.router)
app.include_router(analytics.router)
app.include_router(history.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
