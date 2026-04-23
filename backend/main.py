from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import os
from dotenv import load_dotenv
from typing import Optional, List
from database import SessionLocal, CommunityCase, User, CaseVote, PerspectiveGroup, ChatSession
from sqlalchemy import text, desc
import bcrypt
import json

load_dotenv()

app = FastAPI(title="Clarity Backend API")

# Setup explicit CORS for multisite hosting (Firebase Production & Demo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://info-deliberation-tooling-prod.web.app",
        "https://info-deliberation-demo.web.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    error_msg = f"Internal Deliberation System Error: {str(exc)}"
    print(f"CRITICAL: {error_msg}")
    print(traceback.format_exc())
    
    # Return a response that Starlette's CORSMiddleware can still append headers to
    return JSONResponse(
        status_code=500,
        content={"error": error_msg, "type": type(exc).__name__},
        headers={"Access-Control-Allow-Origin": "*"} # Manually ensuring CORS if needed
    )

@app.on_event("startup")
def startup_event():
    from database import SessionLocal, init_db
    from seed_users import seed_users

    # Initialize extensions for PostgreSQL if applicable
    db = SessionLocal()
    try:
        if not str(db.get_bind().url).startswith("sqlite"):
            # Attempt to create extension (requires adequate DB permissions)
            db.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            db.commit()
    except Exception as e:
        print(f"[Startup] Vector extension check failed (might already exist or permission denied): {e}")
        db.rollback()
    finally:
        db.close()

    # Now initialize the tables
    try:
        init_db()
        # Manual migration for added column
        try:
            db.execute(text("ALTER TABLE perspective_groups ADD COLUMN IF NOT EXISTS created_by VARCHAR;"))
            db.commit()
            print("[Startup] PerspectiveGroup schema updated with created_by.")
        except Exception as e:
            # Handle databases that don't support ADD COLUMN IF NOT EXISTS (like older pg/sqlite)
            try:
                db.rollback()
                db.execute(text("ALTER TABLE perspective_groups ADD COLUMN created_by VARCHAR;"))
                db.commit()
            except:
                db.rollback() # Likely column already exists
        print("[Startup] Database schema verified/initialized.")
    except Exception as e:
        print(f"[Startup] ERROR initializing database schema: {e}")

    # Seed users
    try:
        seed_users()
    except Exception as e:
        print(f"[Startup] Failed to seed users: {e}")


class CaseResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    participants: int
    initial_message: str

class CaseCreate(BaseModel):
    title: str
    description: str
    community_id: Optional[str] = "global"

class HealthResponse(BaseModel):
    status: str
    message: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    case_context: Optional[str] = None
    is_demo: Optional[bool] = False

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None

class SignupRequest(BaseModel):
    email: str
    password: str

class ChatResponse(BaseModel):
    reply: str
    clarity_score: int
    extracted_values: list[str]

class PerspectiveSearchRequest(BaseModel):
    case_id: int
    embedding: List[float]

class PerspectiveJoinRequest(BaseModel):
    user_id: str
    case_id: int
    group_id: int
    is_demo: bool = False

class PerspectiveCreateRequest(BaseModel):
    user_id: str
    case_id: int
    text: str
    embedding: List[float]
    is_demo: bool = False

@app.get("/", response_model=HealthResponse)
def read_root():
    return {"status": "ok", "message": "Clarity Backend API is running."}

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok", "message": "Backend is healthy."}

@app.get("/cases")
def get_cases():
    db = SessionLocal()
    try:
        cases = db.query(CommunityCase).all()
        result = []
        for c in cases:
            # Count unique voters
            voters = {v.user_id for v in db.query(CaseVote.user_id).filter(CaseVote.case_id == c.id).all()}
            
            # Count unique chatters (extracting user_id from session-user_id-case_id)
            chat_sessions = db.query(ChatSession.id).filter(ChatSession.id.like(f"%{c.id}")).all()
            chatters = set()
            for (sid,) in chat_sessions:
                parts = sid.split('-')
                if len(parts) >= 3:
                    chatters.add(parts[1])
            
            p_count = len(voters | chatters)
            vote_aggs = db.query(CaseVote).filter(CaseVote.case_id == c.id).all()
            total_allocations = sum(v.votes_cast for v in vote_aggs)
            
            # Fetch top 3 perspectives for this case
            # Rank = (Votes * 0.7) + (Users * 0.3)
            # Since we can't easily do this math inside SQL with Vector types in various dialects, we do it in Python
            groups = db.query(PerspectiveGroup).filter(PerspectiveGroup.case_id == c.id).all()
            scored_groups = []
            for g in groups:
                score = (g.total_votes * 0.7) + (g.participant_count * 0.3)
                scored_groups.append({
                    "id": g.id,
                    "text": g.text,
                    "participants": g.participant_count,
                    "total_votes": g.total_votes,
                    "score": score
                })
            
            scored_groups.sort(key=lambda x: x["score"], reverse=True)
            top_3 = scored_groups[:3]

            result.append({
                "id": c.id, "title": c.title, "description": c.description,
                "status": c.status, "participants": p_count, "total_votes_allocated": total_allocations,
                "initial_message": c.initial_message,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "top_perspectives": top_3
            })
        return result
    finally:
        db.close()

@app.get("/intake/{session_id}")
def get_intake_history(session_id: str):
    db = SessionLocal()
    try:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            return {"messages": [], "clarity_score": 0, "identified_values": []}
        
        formatted_messages = []
        for m in session.transcript:
            role = 'user' if m['role'] == 'user' else 'agent'
            content = m['parts'][0]
            # Handle AI structured JSON storage
            if role == 'agent':
                try:
                    import json
                    data = json.loads(content)
                    content = data.get('reply', content)
                except:
                    pass
            formatted_messages.append({
                "id": f"hist-{len(formatted_messages)}",
                "role": role,
                "content": content
            })
            
        return {
            "messages": formatted_messages,
            "clarity_score": session.clarity_score,
            "identified_values": session.identified_values or []
        }
    finally:
        db.close()

@app.get("/intake/{session_id}/synthesize")
def get_synthesis(session_id: str):
    from llm_service import synthesize_perspective, generate_embedding
    db = SessionLocal()
    try:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            return {"error": "Session not found"}
        
        summary = synthesize_perspective(session.transcript)
        embedding = generate_embedding(summary)
        
        return {
            "text": summary,
            "embedding": embedding
        }
    finally:
        db.close()

@app.post("/perspectives/search")
def search_perspectives(req: PerspectiveSearchRequest):
    db = SessionLocal()
    try:
        # PostgreSQL pgvector similarity query
        # <-> is Euclidean distance, <=> is Cosine distance
        # threshold 0.1 means similarity > 0.9
        similar_groups = db.query(PerspectiveGroup).filter(
            PerspectiveGroup.case_id == req.case_id,
            PerspectiveGroup.is_demo == False,
            PerspectiveGroup.embedding.cosine_distance(req.embedding) < 0.1 # STRICT THRESHOLD
        ).order_by(
            PerspectiveGroup.embedding.cosine_distance(req.embedding)
        ).limit(1).all()

        if not similar_groups:
            return {"match": None}

        top = similar_groups[0]
        # Calculate distance (manual calculate because SQLAlchemy's vector operator returns the object)
        # However, we can just return the top match and let the frontend check if they want to join.
        return {
            "match": {
                "id": top.id,
                "text": top.text,
                "participants": top.participant_count
            }
        }
    finally:
        db.close()

@app.post("/perspectives/join")
def join_perspective(req: PerspectiveJoinRequest):
    db = SessionLocal()
    try:
        group = db.query(PerspectiveGroup).filter(PerspectiveGroup.id == req.group_id).first()
        if not group:
            return {"error": "Group not found"}
        
        # We don't increment participant_count until the vote is cast to keep it clean,
        # OR we track intent here. Let's increment on vote.
        return {"status": "success", "group_id": group.id}
    finally:
        db.close()

@app.post("/perspectives/create")
def create_perspective(req: PerspectiveCreateRequest):
    db = SessionLocal()
    try:
        # Deduplication Logic: Check if this user already has a created perspective for this case
        existing = db.query(PerspectiveGroup).filter(
            PerspectiveGroup.case_id == req.case_id,
            PerspectiveGroup.created_by == req.user_id
        ).first()

        if existing:
            # Update existing instead of duplicating
            existing.text = req.text
            existing.embedding = req.embedding
            db.commit()
            db.refresh(existing)
            return {"status": "success", "group_id": existing.id, "action": "updated"}

        new_group = PerspectiveGroup(
            case_id=req.case_id,
            text=req.text,
            embedding=req.embedding,
            is_demo=req.is_demo,
            participant_count=0,
            total_votes=0,
            created_by=req.user_id
        )
        db.add(new_group)
        db.commit()
        db.refresh(new_group)
        return {"status": "success", "group_id": new_group.id, "action": "created"}
    finally:
        db.close()

@app.post("/cases")
def create_case(case: CaseCreate):
    from llm_service import generate_opening_context
    db = SessionLocal()
    try:
        # Dynamically synthesize opening message via LLM
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
            "initial_message": new_case.initial_message
        }
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
        
        return {"status": "success", "user": {"id": user.id, "email": user.email, "credits": user.civic_credits, "role": user.role, "is_demo": user.is_demo}}
    finally:
        db.close()

class VoteSubmit(BaseModel):
    user_id: str
    votes_cast: int
    perspective_group_id: Optional[int] = None
    is_demo: bool = False

@app.post("/cases/{case_id}/vote")
def cast_quadratic_vote(case_id: int, payload: VoteSubmit):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            # Auto-create guest user for demo/guest flow
            user = User(
                id=payload.user_id, 
                email=f"guest_{payload.user_id[:8]}@example.com", 
                civic_credits=100, 
                community_id="kinyarwanda",
                is_demo=payload.is_demo
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        cost = payload.votes_cast ** 2
        existing_vote = db.query(CaseVote).filter(CaseVote.user_id == user.id, CaseVote.case_id == case_id).first()
        
        current_credits = user.civic_credits
        if existing_vote:
            current_credits += existing_vote.credits_spent
            # Subtract old stats from old group if it changed
            if existing_vote.perspective_group_id:
                old_group = db.query(PerspectiveGroup).filter(PerspectiveGroup.id == existing_vote.perspective_group_id).first()
                if old_group:
                    old_group.participant_count -= 1
                    old_group.total_votes -= existing_vote.votes_cast

        if current_credits < cost:
            return {"error": "Insufficient civic credits."}

        user.civic_credits = current_credits - cost

        if existing_vote:
            existing_vote.votes_cast = payload.votes_cast
            existing_vote.credits_spent = cost
            existing_vote.perspective_group_id = payload.perspective_group_id
        else:
            new_vote = CaseVote(
                case_id=case_id,
                user_id=user.id,
                votes_cast=payload.votes_cast,
                credits_spent=cost,
                perspective_group_id=payload.perspective_group_id,
                is_demo=payload.is_demo
            )
            db.add(new_vote)

        # Update new group stats
        if payload.perspective_group_id:
            new_group = db.query(PerspectiveGroup).filter(PerspectiveGroup.id == payload.perspective_group_id).first()
            if new_group:
                new_group.participant_count += 1
                new_group.total_votes += payload.votes_cast

        db.commit()
        return {"status": "success", "remaining_credits": user.civic_credits, "cost": cost}
    finally:
        db.close()

@app.post("/intake/chat", response_model=ChatResponse)
def intake_chat(req: ChatRequest):
    from llm_service import send_message
    try:
        db = SessionLocal()
        record = db.query(ChatSession).filter(ChatSession.id == req.session_id).first()
        if not record:
            record = ChatSession(id=req.session_id, community_name="Kinyarwanda", transcript=[], is_demo=req.is_demo)
            db.add(record)
            db.commit()
            db.refresh(record)
        
        # Append latest user turn
        from sqlalchemy.orm.attributes import flag_modified
        record.transcript.append({"role": "user", "parts": [req.message]})
        flag_modified(record, "transcript")
        db.commit()

        data = send_message(req.session_id, req.message, req.case_context)
        
        # Append bot reply
        record.transcript.append({
            "role": "model",
            "parts": [json.dumps(data)] # Store the structured response
        })
        flag_modified(record, "transcript")
        db.commit()
        db.close()
        return {
            "reply": data.get("reply", "Failed to parse reply"),
            "clarity_score": data.get("clarity_score", 0),
            "extracted_values": data.get("extracted_values", [])
        }
    except Exception as e:
        return {
            "reply": f"[System Error: {str(e)}]",
            "clarity_score": 0,
            "extracted_values": []
        }

@app.get("/users/{user_id}/history")
def get_user_history(user_id: str):
    db = SessionLocal()
    try:
        votes = db.query(CaseVote, CommunityCase).join(
            CommunityCase, CaseVote.case_id == CommunityCase.id
        ).filter(CaseVote.user_id == user_id).all()
        
        return [
            {
                "case_id": case.id,
                "title": case.title,
                "description": case.description,
                "votes_cast": vote.votes_cast,
                "credits_spent": vote.credits_spent,
                "group_id": vote.perspective_group_id
            }
            for vote, case in votes
        ]
    finally:
        db.close()

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

@app.post("/auth/signup")
def signup(req: SignupRequest):
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == req.email).first()
        if existing_user:
            return {"error": "Email already registered."}
        
        hashed_pw = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user = User(
            id=req.email,
            email=req.email,
            hashed_password=hashed_pw,
            civic_credits=100,
            role="citizen",
            community_id="kinyarwanda",
            is_demo=False
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"status": "success", "user": {"id": new_user.id, "email": new_user.email, "credits": new_user.civic_credits, "role": new_user.role}}
    finally:
        db.close()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@app.get("/users")
def get_all_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return [
            {
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "civic_credits": u.civic_credits,
                "community_id": u.community_id,
                "is_demo": u.is_demo
            }
            for u in users
        ]
    finally:
        db.close()

class CreditUpdateRequest(BaseModel):
    credits: int

@app.put("/users/{user_id}/credits")
def update_user_credits(user_id: str, req: CreditUpdateRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User missing."}
        
        user.civic_credits = req.credits
        db.commit()
        return {"status": "success", "new_credits": user.civic_credits}
    finally:
        db.close()

@app.delete("/cases/{case_id}")
def delete_case(case_id: int):
    db = SessionLocal()
    try:
        target = db.query(CommunityCase).filter(CommunityCase.id == case_id).first()
        if not target:
            return {"error": "Case missing."}
            
        # Refund Credits to Users
        votes = db.query(CaseVote).filter(CaseVote.case_id == case_id).all()
        for v in votes:
            user = db.query(User).filter(User.id == v.user_id).first()
            if user:
                user.civic_credits += v.credits_spent
        
        # Purge Data
        db.query(CaseVote).filter(CaseVote.case_id == case_id).delete()
        db.query(PerspectiveGroup).filter(PerspectiveGroup.case_id == case_id).delete()
        db.query(ChatSession).filter(ChatSession.id.like(f"%{case_id}")).delete()
        
        db.delete(target)
        db.commit()
        return {"status": "success"}
    finally:
        db.close()

@app.delete("/users/{user_id}")
def delete_user(user_id: str):
    db = SessionLocal()
    try:
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            return {"error": "User missing."}
        
        # 1. Decrement group stats for groups this user voted in
        votes = db.query(CaseVote).filter(CaseVote.user_id == user_id).all()
        for v in votes:
            if v.perspective_group_id:
                group = db.query(PerspectiveGroup).filter(PerspectiveGroup.id == v.perspective_group_id).first()
                if group:
                    group.participant_count -= 1
                    group.total_votes -= v.votes_cast

        # 2. Delete perspectives this user CREATED (Deduplication cleanup)
        db.query(PerspectiveGroup).filter(PerspectiveGroup.created_by == user_id).delete()

        # 3. Delete chat sessions for this user
        db.query(ChatSession).filter(ChatSession.id.like(f"session-{user_id}-%")).delete()

        # 4. Final user and vote deletion
        db.query(CaseVote).filter(CaseVote.user_id == user_id).delete()
        db.delete(target_user)
        db.commit()
        return {"status": "success"}
    finally:
        db.close()
