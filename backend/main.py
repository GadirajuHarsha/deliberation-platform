from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import os
from dotenv import load_dotenv
from typing import Optional
from database import SessionLocal, CommunityCase, User, CaseVote
from sqlalchemy import text
import bcrypt

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

@app.on_event("startup")
def startup_event():
    """
    Runs once when the server starts.
    Only seeds the essential admin + demo user accounts if the DB is empty.
    Cases are NOT seeded here — they must be created via POST /cases so that
    generate_opening_context() runs and produces a real LLM opening message.
    """
    from database import SessionLocal
    from seed_users import seed_users

    # Apply any pending schema migrations safely
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE community_cases ADD COLUMN created_at DATETIME;"))
        db.commit()
    except Exception:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE community_cases ADD COLUMN initial_message VARCHAR DEFAULT '';"))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

    # Only seed user accounts (no cases)
    try:
        seed_users()
    except Exception as e:
        print(f"[Startup] Failed to seed users: {e}")


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

class CaseCreate(BaseModel):
    title: str
    description: str
    community_id: Optional[str] = "global"

class CreditUpdate(BaseModel):
    credits: int

@app.get("/users")
def get_users(community_id: Optional[str] = None):
    db = SessionLocal()
    try:
        query = db.query(User)
        if community_id and community_id != "global":
            query = query.filter(User.community_id == community_id)
        users = query.all()
        return [
            {
                "id": u.id, "email": u.email, "role": u.role, 
                "civic_credits": u.civic_credits, "community_id": u.community_id
            } for u in users
        ]
    finally:
        db.close()

@app.put("/users/{user_id}/credits")
def update_credits(user_id: str, payload: CreditUpdate):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        user.civic_credits = payload.credits
        db.commit()
        return {"status": "success", "credits": user.civic_credits}
    finally:
        db.close()

@app.get("/cases")
def get_cases():
    db = SessionLocal()
    try:
        cases = db.query(CommunityCase).all()
        result = []
        for c in cases:
            # Dynamically calculate unique interaction footprint and global quadratic conceptual weights
            p_count = db.query(CaseVote.user_id).filter(CaseVote.case_id == c.id).distinct().count()
            vote_aggs = db.query(CaseVote).filter(CaseVote.case_id == c.id).all()
            total_allocations = sum(v.votes_cast for v in vote_aggs)
            
            result.append({
                "id": c.id, "title": c.title, "description": c.description,
                "status": c.status, "participants": p_count, "total_votes_allocated": total_allocations,
                "initial_message": c.initial_message,
                "created_at": c.created_at.isoformat() if c.created_at else None
            })
        return result
    finally:
        db.close()

@app.get("/users/{user_id}/history")
def get_user_history(user_id: str):
    db = SessionLocal()
    try:
        # Join interaction states across the quadratic ledger
        votes = db.query(CaseVote, CommunityCase).join(
            CommunityCase, CaseVote.case_id == CommunityCase.id
        ).filter(CaseVote.user_id == user_id).all()
        
        return [
            {
                "case_id": case.id,
                "title": case.title,
                "description": case.description,
                "votes_cast": vote.votes_cast,
                "credits_spent": vote.credits_spent
            }
            for vote, case in votes
        ]
    finally:
        db.close()

@app.post("/cases")
def create_case(case: CaseCreate):
    from llm_service import generate_opening_context
    db = SessionLocal()
    try:
        # Dynamically synthesize opening message via LLM once physically synchronously right here
        initial_payload = generate_opening_context(case.title, case.description)
        
        new_case = CommunityCase(
            title=case.title,
            description=case.description,
            community_id=case.community_id,
            initial_message=initial_payload
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)
        return {
            "id": new_case.id, "title": new_case.title, "description": new_case.description,
            "status": new_case.status, "participants": new_case.participants,
            "initial_message": new_case.initial_message,
            "icon": new_case.icon, "color": new_case.color, "bgColor": new_case.bg_color, "borderColor": new_case.border_color,
            "created_at": new_case.created_at.isoformat() if new_case.created_at else None
        }
    finally:
        db.close()

@app.delete("/cases/{case_id}")
def delete_case(case_id: int):
    from database import ChatSession
    db = SessionLocal()
    try:
        target = db.query(CommunityCase).filter(CommunityCase.id == case_id).first()
        if not target:
            return {"error": "Case missing from architecture."}
            
        # Refund structural quadratic credits globally everywhere
        votes = db.query(CaseVote).filter(CaseVote.case_id == case_id).all()
        for v in votes:
            user = db.query(User).filter(User.id == v.user_id).first()
            if user:
                user.civic_credits += v.credits_spent
            db.delete(v)
            
        # Nuke tracking chat structures and internal state
        db.query(ChatSession).filter(ChatSession.id == f"demo-session-{case_id}").delete()
        db.delete(target)
        db.commit()
        return {"status": "success", "message": "Case structurally obliterated and credits refunded globally."}
    finally:
        db.close()

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@app.post("/auth/signup")
def signup(req: SignupRequest):
    db = SessionLocal()
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == req.email).first()
        if existing_user:
            return {"error": "Email already registered."}
        
        # Create user
        hashed_pw = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user = User(
            id=req.email,
            email=req.email,
            hashed_password=hashed_pw,
            civic_credits=100, # Default for new users
            role="citizen",
            community_id="kinyarwanda"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"status": "success", "user": {"id": new_user.id, "email": new_user.email, "credits": new_user.civic_credits, "role": new_user.role}}
    finally:
        db.close()

@app.post("/auth/login")
def login(req: LoginRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not user.hashed_password:
            return {"error": "Invalid email or password."}
        
        if not bcrypt.checkpw(req.password.encode('utf-8'), user.hashed_password.encode('utf-8')):
            return {"error": "Invalid email or password."}
        
        return {"status": "success", "user": {"id": user.id, "email": user.email, "credits": user.civic_credits, "role": user.role}}
    finally:
        db.close()

class VoteSubmit(BaseModel):
    user_id: str
    votes_cast: int

@app.post("/cases/{case_id}/vote")
def cast_quadratic_vote(case_id: int, payload: VoteSubmit):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            user = User(id=payload.user_id, email="demo@example.com", civic_credits=100, community_id="kinyarwanda")
            db.add(user)
            db.commit()
            db.refresh(user)

        cost = payload.votes_cast ** 2
        
        # Native Upsert Configuration - Quadratic Vote Differentials
        existing_vote = db.query(CaseVote).filter(CaseVote.user_id == user.id, CaseVote.case_id == case_id).first()
        current_credits = user.civic_credits
        if existing_vote:
            current_credits += existing_vote.credits_spent
            
        if current_credits < cost:
            return {"error": "Insufficient civic credits for quadratic curve."}

        user.civic_credits = current_credits - cost

        if existing_vote:
            existing_vote.votes_cast = payload.votes_cast
            existing_vote.credits_spent = cost
        else:
            new_vote = CaseVote(
                case_id=case_id,
                user_id=user.id,
                votes_cast=payload.votes_cast,
                credits_spent=cost
            )
            db.add(new_vote)

        db.commit()

        return {"status": "success", "remaining_credits": user.civic_credits, "cost": cost}
    finally:
        db.close()

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

@app.get("/users/{user_id}/history")
def get_user_history(user_id: str):
    db = SessionLocal()
    try:
        history = db.query(CaseVote).filter(CaseVote.user_id == user_id).all()
        results = []
        for vote in history:
            case = db.query(CommunityCase).filter(CommunityCase.id == vote.case_id).first()
            if case:
                results.append({
                    "case_id": case.id,
                    "title": case.title,
                    "description": case.description,
                    "votes_cast": vote.votes_cast,
                    "credits_spent": vote.credits_spent
                })
        return results
    finally:
        db.close()

@app.delete("/users/{user_id}")
def delete_user(user_id: str):
    db = SessionLocal()
    try:
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            return {"error": "User missing from architecture."}
        
        # Nuke all votes organically without credit restoration because the user is stripped entirely
        db.query(CaseVote).filter(CaseVote.user_id == user_id).delete()
        
        db.delete(target_user)
        db.commit()
        return {"status": "success", "message": "User and structural influence obliterated safely."}
    finally:
        db.close()
