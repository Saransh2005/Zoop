from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── User / Auth Schemas ──────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    personal_meeting_id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Participant Schemas ──────────────────────────────────────────────────────

class ParticipantBase(BaseModel):
    display_name: str
    is_host: bool = False
    is_muted: bool = False
    is_video_on: bool = True


class ParticipantCreate(BaseModel):
    display_name: str


class ParticipantOut(ParticipantBase):
    id: int
    meeting_db_id: int
    joined_at: datetime
    left_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Meeting Schemas ──────────────────────────────────────────────────────────

class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    host_name: str = "Saransh Singh"
    duration_minutes: int = 60


class MeetingCreate(MeetingBase):
    """Used for creating an instant meeting"""
    pass


class ScheduleMeetingCreate(MeetingBase):
    """Used for scheduling a future meeting"""
    scheduled_at: datetime


class MeetingOut(MeetingBase):
    id: int
    meeting_id: str
    status: str
    scheduled_at: Optional[datetime] = None
    invite_link: str
    created_at: datetime
    ended_at: Optional[datetime] = None
    participants: List[ParticipantOut] = []

    model_config = {"from_attributes": True}


class MeetingListItem(BaseModel):
    id: int
    meeting_id: str
    title: str
    host_name: str
    status: str
    scheduled_at: Optional[datetime] = None
    duration_minutes: int
    invite_link: str
    created_at: datetime
    participant_count: int = 0

    model_config = {"from_attributes": True}


class JoinMeetingRequest(BaseModel):
    display_name: str


class JoinMeetingResponse(BaseModel):
    success: bool
    meeting: MeetingOut
    participant: ParticipantOut
    message: str
