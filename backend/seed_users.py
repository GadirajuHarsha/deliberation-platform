from database import SessionLocal, User
import bcrypt

def seed_users():
    db = SessionLocal()
    
    if db.query(User).count() > 0:
        print("Users already seeded.")
        return

    users = [
        User(id="dev-uid-001", email="developer@example.com", role="developer", civic_credits=9999, community_id="global"),
        User(id="leader-uid-002", email="leader@kinyarwanda.org", role="leader", civic_credits=500, community_id="kinyarwanda"),
        User(id="citizen-uid-003", email="contributor12@kinyarwanda.org", role="citizen", civic_credits=45, community_id="kinyarwanda"),
        User(id="citizen-uid-004", email="contributor8@swahili.org", role="citizen", civic_credits=120, community_id="swahili"),
        User(
            id="admin-primary",
            email="admin@example.com",
            hashed_password=bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            civic_credits=9999,
            role="admin",
            community_id="kinyarwanda"
        )
    ]
    
    db.add_all(users)
    db.commit()
    print("Database seeded with 5 mock users.")

if __name__ == "__main__":
    seed_users()
