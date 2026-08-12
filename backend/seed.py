"""
Seed script: populates the database with sample meetings and participants.
Run with: python seed.py
"""
from database import SessionLocal, engine, Base
from models import Meeting, Participant, User, MeetingStatus
from routers.auth import get_password_hash
from datetime import datetime, timedelta
import random
import string


def generate_meeting_id() -> str:
    parts = [
        ''.join(random.choices(string.digits, k=3)),
        ''.join(random.choices(string.digits, k=4)),
        ''.join(random.choices(string.digits, k=4)),
    ]
    return '-'.join(parts)


BASE_URL = "http://localhost:3000"

sample_meetings = [
    {
        "title": "Product Roadmap Q3 Review",
        "description": "Quarterly review of product roadmap and feature prioritization.",
        "host_name": "Saransh Singh",
        "status": MeetingStatus.ended,
        "scheduled_at": datetime.utcnow() - timedelta(days=2, hours=2),
        "duration_minutes": 60,
        "participants": ["Rahul Sharma", "Priya Patel", "Arjun Mehta"],
    },
    {
        "title": "Frontend Architecture Discussion",
        "description": "Deep dive into Next.js App Router migration strategy.",
        "host_name": "Saransh Singh",
        "status": MeetingStatus.ended,
        "scheduled_at": datetime.utcnow() - timedelta(days=1, hours=5),
        "duration_minutes": 90,
        "participants": ["Ananya Gupta", "Vikram Nair"],
    },
    {
        "title": "Daily Standup",
        "description": "Daily team standup and progress check.",
        "host_name": "Saransh Singh",
        "status": MeetingStatus.ended,
        "scheduled_at": datetime.utcnow() - timedelta(hours=4),
        "duration_minutes": 15,
        "participants": ["Rahul Sharma", "Priya Patel", "Deepak Kumar", "Sneha Reddy"],
    },
    {
        "title": "Database Schema Review",
        "description": "Review the proposed schema changes for the new user module.",
        "host_name": "Saransh Singh",
        "status": MeetingStatus.scheduled,
        "scheduled_at": datetime.utcnow() + timedelta(hours=2),
        "duration_minutes": 45,
        "participants": [],
    },
    {
        "title": "Sprint Planning — Sprint 24",
        "description": "Plan tasks and story points for the upcoming sprint.",
        "host_name": "Saransh Singh",
        "status": MeetingStatus.scheduled,
        "scheduled_at": datetime.utcnow() + timedelta(days=1, hours=1),
        "duration_minutes": 120,
        "participants": [],
    },
    {
        "title": "Investor Demo Prep",
        "description": "Rehearsal and review of investor presentation deck.",
        "host_name": "Saransh Singh",
        "status": MeetingStatus.scheduled,
        "scheduled_at": datetime.utcnow() + timedelta(days=2),
        "duration_minutes": 60,
        "participants": [],
    },
    {
        "title": "Team Building — Remote Games Night",
        "description": "Fun remote team building session with games and trivia.",
        "host_name": "Saransh Singh",
        "status": MeetingStatus.scheduled,
        "scheduled_at": datetime.utcnow() + timedelta(days=3, hours=3),
        "duration_minutes": 90,
        "participants": [],
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Clear existing data
        db.query(Participant).delete()
        db.query(Meeting).delete()
        db.query(User).delete()
        db.commit()

        # Create default user
        default_user = User(
            email="saransh@scaler.com",
            hashed_password=get_password_hash("password123"),
            full_name="Saransh Singh",
            personal_meeting_id="824-012-5681"
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)

        for data in sample_meetings:
            mid = generate_meeting_id()
            meeting = Meeting(
                meeting_id=mid,
                title=data["title"],
                description=data["description"],
                host_name=data["host_name"],
                status=data["status"],
                scheduled_at=data["scheduled_at"],
                duration_minutes=data["duration_minutes"],
                invite_link=f"{BASE_URL}/meeting/{mid}",
                created_at=data["scheduled_at"] - timedelta(minutes=30),
                ended_at=(
                    data["scheduled_at"] + timedelta(minutes=data["duration_minutes"])
                    if data["status"] == MeetingStatus.ended else None
                ),
            )
            db.add(meeting)
            db.flush()

            # Add host
            host = Participant(
                meeting_db_id=meeting.id,
                display_name=data["host_name"],
                is_host=True,
                joined_at=data["scheduled_at"],
                left_at=(
                    data["scheduled_at"] + timedelta(minutes=data["duration_minutes"])
                    if data["status"] == MeetingStatus.ended else None
                ),
            )
            db.add(host)

            # Add other participants
            for name in data["participants"]:
                p = Participant(
                    meeting_db_id=meeting.id,
                    display_name=name,
                    is_host=False,
                    joined_at=data["scheduled_at"] + timedelta(minutes=random.randint(1, 5)),
                    left_at=(
                        data["scheduled_at"] + timedelta(minutes=data["duration_minutes"])
                        if data["status"] == MeetingStatus.ended else None
                    ),
                )
                db.add(p)

        db.commit()
        print("✅ Database seeded successfully with sample meetings!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
