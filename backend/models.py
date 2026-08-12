from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


class MeetingStatus(str, enum.Enum):
    scheduled = "scheduled"
    active = "active"
    ended = "ended"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    personal_meeting_id = Column(String(12), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meetings = relationship("Meeting", back_populates="host")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String(12), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    host_name = Column(String(255), default="Saransh Singh")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default=MeetingStatus.scheduled)
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=60)
    invite_link = Column(String(512), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    host = relationship("User", back_populates="meetings")
    participants = relationship("Participant", back_populates="meeting", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_db_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    display_name = Column(String(255), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    is_host = Column(Boolean, default=False)
    is_muted = Column(Boolean, default=False)
    is_video_on = Column(Boolean, default=True)

    meeting = relationship("Meeting", back_populates="participants")
