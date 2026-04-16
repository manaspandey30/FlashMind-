# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend
```bash
cd backend
python -m venv venv && source venv/Scripts/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # Add GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build
npm run type-check   # tsc --noEmit
```

### Reset DB
```bash
cd backend && rm -f flashmind.db && python -c "from app.database import engine, Base; from app import models; Base.metadata.create_all(engine)"
```

## Architecture

**Backend** (`backend/app/`):
- `main.py` — FastAPI app, CORS, router registration, DB table creation on startup
- `models.py` — SQLAlchemy ORM: `Deck`, `Card`, `CardSRS`, `StudySession`, `CardReview`
- `schemas.py` — Pydantic v2 request/response schemas
- `database.py` — SQLite engine with WAL mode + FK enforcement
- `config.py` — pydantic-settings from `.env`

**Services** (`backend/app/services/`):
- `pdf_parser.py` — PyMuPDF text extraction → `TextChunk` objects with section headings
- `card_generator.py` — Groq API call with structured JSON prompt → deduplicated card dicts
- `srs_engine.py` — Pure SM-2 implementation, returns `SRSResult` dataclass

**Routers** (`backend/app/routers/`): `upload`, `decks`, `cards`, `review`, `analytics`, `history`

Upload pipeline runs in a background thread (`threading.Thread`). Job progress tracked in `_jobs` dict (in-memory, single-user). Poll `GET /api/upload/{job_id}/status`.

Review session card queue tracked in `_session_queues` dict. Failed cards (quality < 3) are re-appended to the queue end.

**Frontend** (`frontend/src/`):
- `api/client.ts` — Axios instance + all typed API functions
- `store/reviewStore.ts` — Zustand store for active review session state
- `components/cards/FlashCard.tsx` — CSS 3D flip card (no JS animation, pure CSS transform)
- Pages: `Dashboard`, `Upload`, `Review`, `Decks`, `DeckDetail`, `History`, `Analytics`, `About`

All colors use CSS variables defined in `index.css` (`--bg-primary`, `--accent`, etc). Do not use Tailwind color classes directly — use `style={{ color: 'var(--accent)' }}`.

## Key Patterns

- Vite proxies `/api/*` to `localhost:8000`, so frontend always calls `/api/...` without origin
- `Base.metadata.create_all(bind=engine)` in `main.py` — no Alembic needed for initial setup
- Card SRS state is always initialized by `srs_engine.initial_srs_state()` during card creation
- `DeckOut.due_count` and `mastered_count` are computed on read (not stored), via SQLAlchemy joins in `decks.py:_enrich()`
