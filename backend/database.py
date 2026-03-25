import os
from sqlalchemy import create_engine, Column, Integer, String, JSON
from sqlalchemy.orm import sessionmaker, declarative_base

db_dir = os.environ.get("DB_DIR", ".")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_dir}/clarity.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
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

# Initialize the database schema
Base.metadata.create_all(bind=engine)
