"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api, Meeting, User, formatMeetingTime, formatDuration } from "@/lib/api";
import Link from "next/link";

function getMonthDay(dateStr: string | null) {
  if (!dateStr) return { month: "—", day: "—" };
  const d = new Date(dateStr);
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

function getStatusClass(status: string) {
  if (status === "active") return "status-active";
  if (status === "scheduled") return "status-upcoming";
  return "status-ended";
}

function getStatusLabel(status: string) {
  if (status === "active") return "Live";
  if (status === "scheduled") return "Upcoming";
  return "Ended";
}

export default function Dashboard() {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const PREVIEW_COUNT = 3;

  const fetchData = useCallback(async () => {
    try {
      const [up, rec] = await Promise.all([api.getUpcoming(), api.getRecent()]);
      setUpcoming(up);
      setRecent(rec);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Load local user session if present
    const cached = localStorage.getItem("user");
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch { }
    }
    const token = localStorage.getItem("token");
    if (token) {
      api.getMe()
        .then((u) => {
          setUser(u);
          localStorage.setItem("user", JSON.stringify(u));
        })
        .catch((err) => {
          const isAuthError = err instanceof Error && (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized") || err.message.toLowerCase().includes("not authenticated"));
          if (isAuthError) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
          }
        });
    } else {
      setUser(null);
    }
  }, [fetchData]);

  const handleNewMeeting = async () => {
    setCreating(true);
    const hostName = user ? user.full_name : (sessionStorage.getItem("displayName") || "Guest Host");
    try {
      const meeting = await api.createInstantMeeting("Instant Meeting", hostName);
      sessionStorage.setItem("displayName", hostName);
      router.push(`/meeting/${meeting.meeting_id}`);
    } catch {
      setCreating(false);
    }
  };

  const copyPMID = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.personal_meeting_id.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allMeetings = [...upcoming, ...recent];

  const initials = user
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <div>
      <div className="dashboard-layout" style={{ paddingTop: 0 }}>
        {/* ── Left Sidebar ─────────────────────────────────────── */}
        <aside className="sidebar">
          <Link href="/" className="sidebar-link active" id="sidebar-home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </Link>

          <p className="sidebar-section-label">My Products</p>

          <Link href="/" className="sidebar-link" id="sidebar-meetings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Meetings
          </Link>
          <a href="#" className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
            </svg>
            Recordings
          </a>
          <a href="#" className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Summaries
          </a>
          <a href="#" className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            Hub
            <span className="sidebar-new-badge">New</span>
          </a>
          <a href="#" className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            Whiteboards
          </a>
          <a href="#" className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Notes
          </a>
          <a href="#" className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Clips
          </a>

          <div className="sidebar-divider" />

          <a href="#" className="sidebar-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My Account
          </a>
        </aside>

        {/* ── Main ─────────────────────────────────────────────── */}
        <main className="main-content">
          {/* Profile Section */}
          <div className="profile-section">
            <div className="profile-card">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">
                  {user ? (
                    <span>{initials}</span>
                  ) : (
                    <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
                      <circle cx="20" cy="20" r="20" fill="#0E72ED" />
                      <path d="M10 15h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="white" />
                      <path d="M26 17.5l6-3v11l-6-3v-5z" fill="white" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="profile-info">
                <h1 className="profile-name">{user ? user.full_name : "Welcome to Zoom"}</h1>
                <p className="profile-plan">
                  {user ? user.email : "Sign in or create a free account to access your personal meeting ID"}
                </p>
                <div className="profile-actions">
                  {user ? (
                    <button className="profile-btn" style={{ background: "#0E72ED", color: "white", borderColor: "#0E72ED" }}>
                      Signed In
                    </button>
                  ) : (
                    <>
                      <Link href="/login" className="profile-btn" id="btn-profile-signin" style={{ background: "#0E72ED", color: "white", borderColor: "#0E72ED" }}>
                        Sign In
                      </Link>
                      <Link href="/signup" className="profile-btn" id="btn-profile-signup">
                        Sign Up Free
                      </Link>
                    </>
                  )}
                  <button className="profile-btn" id="btn-manage-plan">Manage Plan</button>
                  <button className="profile-btn" id="btn-view-plan">View Plan Details</button>
                </div>
              </div>

              <div className="profile-right">
                {/* Quick Actions */}
                <div className="quick-actions">
                  <Link href="/schedule" className="quick-action" id="qa-schedule">
                    <div className="quick-action-icon qa-schedule">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="white" strokeWidth="2" />
                        <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" />
                        <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" />
                        <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2" />
                      </svg>
                    </div>
                    <span className="quick-action-label">Schedule</span>
                  </Link>
                  <Link href="/join" className="quick-action" id="qa-join">
                    <div className="quick-action-icon qa-join">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="white" strokeWidth="2" />
                        <polyline points="10 17 15 12 10 7" stroke="white" strokeWidth="2" />
                        <line x1="15" y1="12" x2="3" y2="12" stroke="white" strokeWidth="2" />
                      </svg>
                    </div>
                    <span className="quick-action-label">Join</span>
                  </Link>
                  <button className="quick-action" onClick={handleNewMeeting} id="qa-host" disabled={creating}>
                    <div className="quick-action-icon qa-host">
                      {creating ? (
                        <div className="spinner" style={{ width: 22, height: 22, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                          <polygon points="23 7 16 12 23 17 23 7" fill="white" stroke="white" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" fill="white" stroke="white" />
                        </svg>
                      )}
                    </div>
                    <span className="quick-action-label">{creating ? "Starting…" : "Host"}</span>
                  </button>
                </div>

                {/* Personal Meeting ID */}
                <div className="personal-meeting-id">
                  <div className="pmid-label">Personal Meeting ID</div>
                  <div className="pmid-value">
                    {user ? user.personal_meeting_id : "—"}
                    {user ? (
                      <button className="pmid-copy" onClick={copyPMID} id="btn-copy-pmid" title="Copy">
                        {copied ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    ) : (
                      <Link href="/login" style={{ fontSize: 11, color: "var(--blue)", textDecoration: "none", marginLeft: 4 }}>
                        (Sign in)
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="content-body">
            {/* Left column */}
            <div>
              {/* Upgrade Banner */}
              <div className="upgrade-banner">
                <div style={{ flex: 1 }}>
                  <div className="upgrade-banner-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Zoom Workplace Pro
                  </div>
                  <div className="upgrade-title">Upgrade and save!</div>
                  <div className="upgrade-sub">Unlock up to 16% when you select an annual Zoom Workplace Pro plan.</div>
                  <button className="upgrade-btn" id="btn-upgrade">Upgrade today</button>
                </div>
              </div>

              {/* Action Tiles */}
              <div className="action-grid">
                <button className="action-tile" onClick={handleNewMeeting} id="btn-new-meeting" disabled={creating}>
                  <div className="action-tile-icon at-new">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div>
                    <div className="action-tile-label">{creating ? "Starting…" : "New Meeting"}</div>
                    <div className="action-tile-sub">Start an instant meeting</div>
                  </div>
                </button>

                <Link href="/join" className="action-tile" id="btn-join-meeting">
                  <div className="action-tile-icon at-join">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <div className="action-tile-label">Join</div>
                    <div className="action-tile-sub">Join a meeting</div>
                  </div>
                </Link>

                <Link href="/schedule" className="action-tile" id="btn-schedule-meeting">
                  <div className="action-tile-icon at-schedule">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <div className="action-tile-label">Schedule</div>
                    <div className="action-tile-sub">Plan a meeting</div>
                  </div>
                </Link>

                <button className="action-tile" onClick={handleNewMeeting} id="btn-share-screen" disabled={creating}>
                  <div className="action-tile-icon at-share">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <div className="action-tile-label">Share Screen</div>
                    <div className="action-tile-sub">Share your screen</div>
                  </div>
                </button>
              </div>

              {/* Recent Activity Table */}
              <div style={{ marginTop: 28 }} id="recent-activity">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Recent activity</h3>
                  {allMeetings.length > PREVIEW_COUNT && (
                    <button
                      style={{ background: "none", border: "none", color: "var(--blue)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      onClick={() => setShowAll((s) => !s)}
                      id="btn-view-all-activity"
                    >
                      {showAll ? "Show less" : `View all (${allMeetings.length})`}
                    </button>
                  )}
                </div>

                <div className="activity-list">
                  {allMeetings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)", fontSize: 14, background: "white", borderRadius: 8, border: "1px solid var(--border)" }}>
                      No meetings found. Start or schedule a meeting above!
                    </div>
                  ) : (
                    (showAll ? allMeetings : allMeetings.slice(0, PREVIEW_COUNT)).map((m, idx) => {
                      const iconColors = ["ai-blue", "ai-orange", "ai-purple", "ai-green"];
                      const iconColor = iconColors[idx % iconColors.length];
                      return (
                        <Link href={`/meeting/${m.meeting_id}`} key={m.id} className="activity-card" id={`activity-item-${m.id}`}>
                          <div className={`activity-icon ${iconColor}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="23 7 16 12 23 17 23 7" />
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                          </div>

                          <div className="activity-info">
                            <div className="activity-title">{m.title}</div>
                            <div className="activity-meta">
                              {m.host_name} · {formatMeetingTime(m.scheduled_at)}
                              {m.duration_minutes ? ` · ${formatDuration(m.duration_minutes)}` : ""}
                            </div>
                          </div>

                          <span className={`activity-status ${getStatusClass(m.status)}`}>
                            {getStatusLabel(m.status)}
                          </span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="right-panel">
              {/* Meetings panel */}
              <div className="meetings-panel">
                <div className="meetings-panel-header">
                  <span className="meetings-panel-title">Meetings</span>
                  <Link href="/schedule" className="meetings-panel-link">Visit Meetings</Link>
                </div>

                {loading ? (
                  <div className="no-meetings">Loading…</div>
                ) : upcoming.length === 0 ? (
                  <div className="no-meetings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    No Upcoming Meetings
                  </div>
                ) : (
                  upcoming.slice(0, 4).map(m => {
                    const { month, day } = getMonthDay(m.scheduled_at);
                    return (
                      <div className="meeting-card" key={m.id}>
                        <div className="meeting-date-block">
                          <div className="meeting-date-month">{month}</div>
                          <div className="meeting-date-day">{day}</div>
                        </div>
                        <div className="meeting-info">
                          <div className="meeting-title">{m.title}</div>
                          <div className="meeting-time">{formatMeetingTime(m.scheduled_at)}</div>
                        </div>
                        <Link href={`/meeting/${m.meeting_id}`} className="meeting-start-btn" id={`start-${m.meeting_id}`}>
                          Start
                        </Link>
                      </div>
                    );
                  })
                )}

                <Link href="/join" className="test-av-btn" id="btn-test-av">
                  Test Audio and Video
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
