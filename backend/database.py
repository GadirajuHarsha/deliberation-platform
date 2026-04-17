import os
from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

db_dir = os.environ.get("DB_DIR", ".")

# Securely default to PostgreSQL FUSE Socket if DATABASE_URL injected during Cloud Run Deploy, Else Fallback to SQLite
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{db_dir}/clarity_v2.db")

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True) # e.g. "demo-session-42"
    community_name = Column(String, index=True)
    clarity_score = Column(Integer, default=0)
    identified_values = Column(JSON, default=list)
    
    # Stores the conversation history array 
    transcript = Column(JSON, default=list)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True) # Usually the email or UID
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String) # For local-first auth fallback
    role = Column(String, default="citizen") # 'developer', 'leader', 'citizen'
    civic_credits = Column(Integer, default=100)
    community_id = Column(String, index=True, default="global")

class CommunityCase(Base):
    __tablename__ = "community_cases"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, index=True)
    description = Column(String)
    community_id = Column(String, index=True, default="global")
    status = Column(String, default="Active Deliberation")
    participants = Column(Integer, default=1)
    
    # Pre-compiled LLM Genesis State
    initial_message = Column(String, default="")

    # Visual Layout Meta
    icon = Column(String, default="FileText")
    color = Column(String, default="text-blue-600")
    bg_color = Column(String, default="bg-blue-50")
    border_color = Column(String, default="border-blue-200")
    created_at = Column(DateTime, default=datetime.utcnow)

class CaseVote(Base):
    __tablename__ = "case_votes"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, index=True)
    user_id = Column(String, index=True)
    votes_cast = Column(Integer, default=0)
    credits_spent = Column(Integer, default=0) # Should physically be votes_cast^2

# Initialize the database schema
Base.metadata.create_all(bind=engine)
