from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Clarity Backend API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.get("/", response_model=HealthResponse)
def read_root():
    return {"status": "ok", "message": "Clarity Backend API is running."}

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok", "message": "Backend is healthy."}

@app.post("/intake/chat", response_model=ChatResponse)
def intake_chat(req: ChatRequest):
    # Import locally to avoid circular dependencies if we expand this later
    from llm_service import send_message
    
    try:
        reply = send_message(req.session_id, req.message)
        return {"reply": reply}
    except Exception as e:
        # If GCP isn't authenticated yet, this will throw an error. We return it cleanly.
        return {"reply": f"[System Error: Vertex AI failed to respond. {str(e)}]"}
