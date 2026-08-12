"use client";
import { Meeting, formatMeetingTime, formatDuration } from "@/lib/api";
import Link from "next/link";

interface MeetingCardProps {
  meeting: Meeting;
  variant?: "upcoming" | "recent";
}

const statusColors: Record<string, string> = {
  active: "#00c851",
  scheduled: "#2D8CFF",
  ended: "#888",
};

const statusLabels: Record<string, string> = {
  active: "In Progress",
  scheduled: "Upcoming",
  ended: "Ended",
};

export default function MeetingCard({ meeting, variant = "recent" }: MeetingCardProps) {
  const initials = meeting.host_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="meeting-card">
      <div className="meeting-card-left">
        <div className="meeting-avatar" style={{ background: variant === "upcoming" ? "#1a3a6b" : "#2a2a2a" }}>
          {initials}
        </div>
        <div className="meeting-info">
          <h4 className="meeting-title">{meeting.title}</h4>
          <p className="meeting-meta">
            {meeting.host_name} · {formatMeetingTime(meeting.scheduled_at || meeting.created_at)}
          </p>
          <p className="meeting-meta" style={{ color: "#777" }}>
            {formatDuration(meeting.duration_minutes)} · Meeting ID: {meeting.meeting_id}
          </p>
        </div>
      </div>

      <div className="meeting-card-right">
        <span
          className="status-badge"
          style={{ color: statusColors[meeting.status], borderColor: statusColors[meeting.status] }}
        >
          {statusLabels[meeting.status]}
        </span>

        {meeting.status !== "ended" && (
          <Link href={`/meeting/${meeting.meeting_id}`} className="join-btn-sm" id={`join-${meeting.meeting_id}`}>
            {meeting.status === "active" ? "Join Now" : "Start"}
          </Link>
        )}
      </div>
    </div>
  );
}
