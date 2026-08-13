"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const DURATIONS = [15, 30, 45, 60, 90, 120, 180];

export default function SchedulePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState(getNextHour());
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ meetingId: string; link: string } | null>(null);

  const previewLink = `http://localhost:3000/meeting/preview`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Meeting title is required."); return; }
    if (!date || !time) { setError("Please select a date and time."); return; }

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    setError("");
    setLoading(true);
    try {
      const meeting = await api.scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        host_name: "Saransh Singh",
        scheduled_at: scheduledAt,
        duration_minutes: duration,
      });
      setSuccess({ meetingId: meeting.meeting_id, link: meeting.invite_link });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to schedule meeting.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <div className="schedule-page" style={{ paddingTop: 0 }}>
          <div className="schedule-content">
            <div style={{ textAlign: "center", padding: "60px 20px", animation: "slideUp 0.3s ease" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "rgba(0,200,81,0.12)",
                border: "2px solid #00c851",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: 32
              }}>✓</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Meeting Scheduled!</h2>
              <p style={{ color: "var(--text-2)", marginBottom: 24 }}>
                Your meeting has been created successfully.
              </p>
              <div className="invite-preview" style={{ maxWidth: 420, margin: "0 auto 24px" }}>
                <span className="invite-preview-text">{success.link}</span>
                <button
                  className="invite-copy-btn"
                  onClick={() => navigator.clipboard.writeText(success.link)}
                  id="btn-copy-success-link"
                >
                  Copy
                </button>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  style={{ width: "auto", padding: "12px 28px" }}
                  onClick={() => router.push(`/meeting/${success.meetingId}`)}
                  id="btn-start-scheduled"
                >
                  Start Now
                </button>
                <Link href="/" className="btn-secondary" style={{ width: "auto", padding: "12px 28px" }} id="btn-back-home-success">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="schedule-page" style={{ paddingTop: 0 }}>
        <div className="schedule-content">
          <div className="page-header">
            <Link href="/" className="back-btn" id="btn-back-home">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </Link>
            <h1 className="page-title">Schedule a Meeting</h1>
          </div>

          <form className="schedule-form" onSubmit={handleSubmit}>
            {error && <div className="error-msg" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

            {/* Topic */}
            <div className="form-group">
              <label htmlFor="meeting-title" className="form-label">Meeting Topic *</label>
              <input
                id="meeting-title"
                className="form-input"
                type="text"
                placeholder="e.g. Weekly Team Standup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="meeting-desc" className="form-label">Description (Optional)</label>
              <textarea
                id="meeting-desc"
                className="form-textarea"
                placeholder="Add an agenda or description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date & Time */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="meeting-date" className="form-label">Date</label>
                <input
                  id="meeting-date"
                  className="form-input"
                  type="date"
                  value={date}
                  min={getTodayDate()}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="meeting-time" className="form-label">Start Time</label>
                <input
                  id="meeting-time"
                  className="form-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="form-group" style={{ marginTop: 18 }}>
              <label htmlFor="meeting-duration" className="form-label">Duration</label>
              <select
                id="meeting-duration"
                className="form-select"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d < 60 ? `${d} minutes` : `${d / 60} hour${d / 60 > 1 ? "s" : ""}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Invite link preview */}
            <div className="form-group">
              <label className="form-label">Invite Link (Auto-generated)</label>
              <div className="invite-preview">
                <span className="invite-preview-text" style={{ fontSize: 11 }}>
                  Will be generated after scheduling
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                type="submit"
                className="btn-primary"
                id="btn-schedule-submit"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Schedule Meeting
                  </>
                )}
              </button>
              <Link href="/" className="btn-secondary" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }} id="btn-cancel">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getNextHour() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
