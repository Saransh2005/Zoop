"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function JoinPage() {
  const router = useRouter();
  const [meetingId, setMeetingId] = useState("");
  const [displayName, setDisplayName] = useState("Saransh Singh");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = meetingId.trim().replace(/\s/g, "");
    if (!cleanId) { setError("Please enter a Meeting ID."); return; }
    if (!displayName.trim()) { setError("Please enter your name."); return; }

    setError("");
    setLoading(true);
    try {
      await api.joinMeeting(cleanId, displayName.trim());
      // Store name in sessionStorage for meeting room
      sessionStorage.setItem("displayName", displayName.trim());
      router.push(`/meeting/${cleanId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join meeting.");
      setLoading(false);
    }
  };

  return (
    <div className="join-page">
      <div className="join-card">
        <div className="join-card-header">
          <div className="join-logo">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#2D8CFF" />
              <path d="M10 15h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="white" />
              <path d="M26 17.5l6-3v11l-6-3v-5z" fill="white" />
            </svg>
            <span className="join-logo-text">Zoom</span>
          </div>
          <h1 className="join-title">Join a Meeting</h1>
          <p className="join-sub">Enter your meeting ID or link to join</p>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label htmlFor="meeting-id-input" className="form-label">Meeting ID or Link</label>
            <input
              id="meeting-id-input"
              className="form-input form-input-large"
              type="text"
              placeholder="000-0000-0000"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="display-name-input" className="form-label">Your Name</label>
            <input
              id="display-name-input"
              className="form-input"
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            id="btn-join-submit"
            disabled={loading || !meetingId.trim() || !displayName.trim()}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Joining...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Join Meeting
              </>
            )}
          </button>
        </form>

        <div className="divider">or</div>

        <Link href="/" className="btn-secondary" style={{ display: "block", textAlign: "center" }} id="btn-back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
