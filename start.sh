#!/usr/bin/env bash
# FlashMind startup script
# Usage: bash start.sh
set -e

echo "Starting FlashMind..."

# Backend
cd backend
if [ ! -d "venv" ]; then
  echo "Creating Python venv..."
  python -m venv venv
fi
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created backend/.env — add your GROQ_API_KEY before proceeding"
  exit 1
fi

echo "Starting backend on http://localhost:8000"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd ../frontend
echo "Starting frontend on http://localhost:5173"
npm install -q
npm run dev &
FRONTEND_PID=$!

echo ""
echo "FlashMind is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
