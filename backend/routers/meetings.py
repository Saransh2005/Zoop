import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_db
from models import Meeting, Participant, MeetingStatus
from schemas import (
    MeetingCreate, ScheduleMeetingCreate, MeetingOut, MeetingListItem,
    JoinMeetingRequest, JoinMeetingResponse, ParticipantOut
)

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

BASE_URL = "http://localhost:3000"


def generate_meeting_id() -> str:
    """Generate a Zoom-style meeting ID: XXX-XXXX-XXXX"""
    parts = [
        ''.join(random.choices(string.digits, k=3)),
        ''.join(random.choices(string.digits, k=4)),
        ''.join(random.choices(string.digits, k=4)),
    ]
    return '-'.join(parts)


def make_invite_link(meeting_id: str) -> str:
    return f"{BASE_URL}/meeting/{meeting_id}"


# ─── GET /upcoming ────────────────────────────────────────────────────────────

@router.get("/upcoming", response_model=list[MeetingListItem])
def get_upcoming_meetings(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    meetings = (
        db.query(Meeting)
        .filter(
            Meeting.status == MeetingStatus.scheduled,
            Meeting.scheduled_at >= now
        )
        .order_by(Meeting.scheduled_at.asc())
        .all()
    )
    result = []
    for m in meetings:
        item = MeetingListItem(
            id=m.id,
            meeting_id=m.meeting_id,
            title=m.title,
            host_name=m.host_name,
            status=m.status,
            scheduled_at=m.scheduled_at,
            duration_minutes=m.duration_minutes,
            invite_link=m.invite_link,
            created_at=m.created_at,
            participant_count=len([p for p in m.participants if p.left_at is None])
        )
        result.append(item)
    return result


# ─── GET /recent ──────────────────────────────────────────────────────────────

@router.get("/recent", response_model=list[MeetingListItem])
def get_recent_meetings(limit: int = Query(default=10), db: Session = Depends(get_db)):
    meetings = (
        db.query(Meeting)
        .filter(Meeting.status.in_([MeetingStatus.ended, MeetingStatus.active]))
        .order_by(Meeting.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for m in meetings:
        item = MeetingListItem(
            id=m.id,
            meeting_id=m.meeting_id,
            title=m.title,
            host_name=m.host_name,
            status=m.status,
            scheduled_at=m.scheduled_at,
            duration_minutes=m.duration_minutes,
            invite_link=m.invite_link,
            created_at=m.created_at,
            participant_count=len(m.participants)
        )
        result.append(item)
    return result


# ─── GET / ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[MeetingListItem])
def list_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).order_by(Meeting.created_at.desc()).all()
    result = []
    for m in meetings:
        item = MeetingListItem(
            id=m.id,
            meeting_id=m.meeting_id,
            title=m.title,
            host_name=m.host_name,
            status=m.status,
            scheduled_at=m.scheduled_at,
            duration_minutes=m.duration_minutes,
            invite_link=m.invite_link,
            created_at=m.created_at,
            participant_count=len(m.participants)
        )
        result.append(item)
    return result


# ─── POST / (Instant Meeting) ─────────────────────────────────────────────────

@router.post("/", response_model=MeetingOut, status_code=201)
def create_instant_meeting(payload: MeetingCreate, db: Session = Depends(get_db)):
    meeting_id = generate_meeting_id()
    # Ensure uniqueness
    while db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first():
        meeting_id = generate_meeting_id()

    meeting = Meeting(
        meeting_id=meeting_id,
        title=payload.title or "Instant Meeting",
        description=payload.description,
        host_name=payload.host_name,
        status=MeetingStatus.active,
        scheduled_at=datetime.utcnow(),
        duration_minutes=payload.duration_minutes,
        invite_link=make_invite_link(meeting_id),
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    # Auto-add host as participant
    host = Participant(
        meeting_db_id=meeting.id,
        display_name=payload.host_name,
        is_host=True,
    )
    db.add(host)
    db.commit()
    db.refresh(meeting)
    return meeting


# ─── POST /schedule ───────────────────────────────────────────────────────────

@router.post("/schedule", response_model=MeetingOut, status_code=201)
def schedule_meeting(payload: ScheduleMeetingCreate, db: Session = Depends(get_db)):
    meeting_id = generate_meeting_id()
    while db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first():
        meeting_id = generate_meeting_id()

    meeting = Meeting(
        meeting_id=meeting_id,
        title=payload.title,
        description=payload.description,
        host_name=payload.host_name,
        status=MeetingStatus.scheduled,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
        invite_link=make_invite_link(meeting_id),
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# ─── GET /{meeting_id} ────────────────────────────────────────────────────────

@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


# ─── POST /{meeting_id}/join ─────────────────────────────────────────────────

@router.post("/{meeting_id}/join", response_model=JoinMeetingResponse)
def join_meeting(meeting_id: str, payload: JoinMeetingRequest, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found. Please check the Meeting ID.")
    if meeting.status == MeetingStatus.ended:
        raise HTTPException(status_code=400, detail="This meeting has already ended.")

    # Activate if scheduled and being joined
    if meeting.status == MeetingStatus.scheduled:
        meeting.status = MeetingStatus.active
        db.commit()

    participant = Participant(
        meeting_db_id=meeting.id,
        display_name=payload.display_name,
        is_host=False,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    db.refresh(meeting)

    return JoinMeetingResponse(
        success=True,
        meeting=meeting,
        participant=participant,
        message=f"Successfully joined {meeting.title}"
    )


# ─── POST /{meeting_id}/leave ─────────────────────────────────────────────────

@router.post("/{meeting_id}/leave")
def leave_meeting(meeting_id: str, participant_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.meeting_db_id == meeting.id
    ).first()

    if participant:
        participant.left_at = datetime.utcnow()
        db.commit()

    # If host left, end the meeting
    if participant and participant.is_host:
        meeting.status = MeetingStatus.ended
        meeting.ended_at = datetime.utcnow()
        db.commit()

    return {"success": True, "message": "Left the meeting successfully"}


# ─── DELETE /{meeting_id}/end ────────────────────────────────────────────────

@router.delete("/{meeting_id}/end")
def end_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    meeting.status = MeetingStatus.ended
    meeting.ended_at = datetime.utcnow()
    db.commit()
    return {"success": True, "message": "Meeting ended"}
