@echo off
echo Starting Clarity Platform...
echo ============================

echo Starting Backend API (FastAPI)...
start cmd /k "cd backend && .\venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8000"

echo Starting Frontend Dev Server (Vite)...
start cmd /k "cd frontend && npm run dev"

echo Both servers have been launched in separate windows!
