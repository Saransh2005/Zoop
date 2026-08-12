from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import Meeting, Participant
from schemas import ParticipantOut
from datetime import datetime

router = APIRouter(prefix="/api/participants", tags=["participants"])


@router.get("/{meeting_id}", response_model=list[ParticipantOut])
def get_participants(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    active = [p for p in meeting.participants if p.left_at is None]
    return active


@router.patch("/{participant_id}/mute")
def toggle_mute(participant_id: int, db: Session = Depends(get_db)):
    p = db.query(Participant).filter(Participant.id == participant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    p.is_muted = not p.is_muted
    db.commit()
    return {"success": True, "is_muted": p.is_muted}


@router.delete("/{participant_id}/remove")
def remove_participant(participant_id: int, db: Session = Depends(get_db)):
    p = db.query(Participant).filter(Participant.id == participant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    p.left_at = datetime.utcnow()
    db.commit()
    return {"success": True, "message": f"{p.display_name} removed from meeting"}
