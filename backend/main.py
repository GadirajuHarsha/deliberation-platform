from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

app = FastAPI(title="Clarity Backend API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    case_context: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    clarity_score: int
    extracted_values: list[str]

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
        data = send_message(req.session_id, req.message, req.case_context)
        return {
            "reply": data.get("reply", "Failed to parse reply"),
            "clarity_score": data.get("clarity_score", 0),
            "extracted_values": data.get("extracted_values", [])
        }
    except Exception as e:
        # If GCP isn't authenticated yet, this will throw an error. We return it cleanly.
        return {
            "reply": f"[System Error: Vertex AI failed to respond. {str(e)}]",
            "clarity_score": 0,
            "extracted_values": []
        }
