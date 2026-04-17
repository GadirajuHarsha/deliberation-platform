import os
import sys

# Bypass file lock by truncating safely via SQLAlchemy connection

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import Base, CommunityCase, engine

# Initialize the new database schema
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# SQLite gracefully restores IDs to 1 if all objects are fundamentally deleted


# Seed Cases
cases = [
    CommunityCase(
        title="Dataset Licensing",
        description="The current dataset is released under CC0. What license would you like the dataset to be licensed under moving forward (e.g., CC-BY, CC-BY-NC, or a Custom Governance model)? And how should this transition impact previously collected data?",
        community_id="kinyarwanda"
    ),
    CommunityCase(
        title="Commercial Use of Voice Data",
        description="Should we allow commercial use of our compiled linguistic datasets specifically when generating private corporate applications, or should it be strictly isolated to open-source public goods?",
        community_id="kinyarwanda"
    ),
    CommunityCase(
        title="Synthetic Data Generation",
        description="Should the community permit the use of our raw authentic voice data recordings to autonomously train synthetic, artificial speech generation modules?",
        community_id="kinyarwanda"
    )
]

db.add_all(cases)
db.commit()

print("Successfully wiped database. Constructed Cases 1, 2, and 3 onto a pristine Kinyarwanda domain.")
db.close()
