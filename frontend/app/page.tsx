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
    const token = localStorage.getItem("token");
    const cached = localStorage.getItem("user");

    // Require Login: if no token, redirect to login page immediately
    if (!token) {
      router.push("/login");
      return;
    }

    // Load cached user session immediately so UI renders instantly
    let hasCached = false;
    if (cached) {
      try {
        const u = JSON.parse(cached);
        if (u && u.full_name) {
          setUser(u);
          setLoading(false);
          hasCached = true;
        }
      } catch {}
    }

    if (hasCached) {
      fetchData();
    }

    // Verify token with backend
    api.getMe()
      .then((u) => {
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
        setLoading(false);
        if (!hasCached) {
          fetchData();
        }
      })
      .catch((err) => {
        // Only redirect to login if token is explicitly unauthorized (401)
        const isAuthError = err instanceof Error && (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized") || err.message.toLowerCase().includes("not authenticated"));
        if (isAuthError) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
        } else {
          // On network blip or backend wake-up, keep cached user session
          setLoading(false);
          if (!hasCached) {
            fetchData();
          }
        }
      });
  }, [router, fetchData]);

  if (loading || !user) {
    return (
      <div className="spinner-page">
        <div className="spinner" style={{ width: 50, height: 50 }} />
        <p style={{ color: "var(--text-2)", fontSize: 14, marginTop: 12 }}>Loading your dashboard...</p>
      </div>
    );
  }

  const hostName = user.full_name;
  const pmi = user.personal_meeting_id || "000-000-0000";

  const handleNewMeeting = async () => {
    setCreating(true);
    try {
      const meeting = await api.createInstantMeeting("Instant Meeting", hostName);
      sessionStorage.setItem("displayName", hostName);
      router.push(`/meeting/${meeting.meeting_id}`);
    } catch {
      setCreating(false);
    }
  };

  const copyPMID = () => {
    navigator.clipboard.writeText(pmi.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allMeetings = [...upcoming, ...recent];

  const initials = hostName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <div className="dashboard-layout" style={{ paddingTop: 0 }}>
        {/* ── Left Sidebar ─────────────────────────────────────── */}
        <aside className="sidebar">
          <Link href="/" className="sidebar-link active" id="sidebar-home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </Link>

          <p className="sidebar-section-label">My Products</p>

          <Link href="/" className="sidebar-link" id="sidebar-meetings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Meetings
          </Link>

          <Link href="/" className="sidebar-link" id="sidebar-recordings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
            </svg>
            Recordings
          </Link>

          <Link href="/" className="sidebar-link" id="sidebar-summaries">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Summaries
          </Link>

          <div style={{ margin: "16px 0 8px", borderTop: "1px solid var(--border-subtle)" }} />

          <Link href="/" className="sidebar-link" id="sidebar-hub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            Hub
            <span className="sidebar-badge">New</span>
          </Link>

          <Link href="/" className="sidebar-link" id="sidebar-whiteboards">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
            Whiteboards
          </Link>

          <Link href="/" className="sidebar-link" id="sidebar-notes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Notes
          </Link>

          <Link href="/" className="sidebar-link" id="sidebar-clips">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
              <line x1="7" y1="2" x2="7" y2="22"/>
              <line x1="17" y1="2" x2="17" y2="22"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="2" y1="7" x2="7" y2="7"/>
              <line x1="2" y1="17" x2="7" y2="17"/>
              <line x1="17" y1="17" x2="22" y2="17"/>
              <line x1="17" y1="7" x2="22" y2="7"/>
            </svg>
            Clips
          </Link>

          <div style={{ margin: "16px 0 8px", borderTop: "1px solid var(--border-subtle)" }} />

          <Link href="/" className="sidebar-link" id="sidebar-account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            My Account
          </Link>
        </aside>

        {/* ── Main Dashboard Content ───────────────────────────── */}
        <main className="dashboard-content">
          {/* Header Profile Section */}
          <div className="profile-hero">
            <div className="profile-hero-left">
              <div className="profile-avatar">
                <span>{initials}</span>
              </div>
              <div className="profile-info">
                <h1 className="profile-name" id="user-name-display">{hostName}</h1>
                <p className="profile-email">
                  {user.email} · <span className="profile-badge">Workplace Basic</span>
                </p>
                <div className="profile-tags">
                  <button className="tag-btn tag-primary" id="btn-signin-signup">
                    Signed In
                  </button>
                  <button className="tag-btn" id="btn-manage-plan">Manage Plan</button>
                  <button className="tag-btn" id="btn-view-plan">View Plan Details</button>
                </div>
              </div>
            </div>

            {/* Quick Action Top Bar Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="quick-actions">
                <div className="quick-action-item">
                  <Link href="/schedule" className="quick-btn icon-blue" id="btn-top-schedule">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </Link>
                  <span className="quick-label">Schedule</span>
                </div>

                <div className="quick-action-item">
                  <Link href="/join" className="quick-btn icon-green" id="btn-top-join">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6v6"/>
                      <path d="M10 14L21 3"/>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    </svg>
                  </Link>
                  <span className="quick-label">Join</span>
                </div>

                <div className="quick-action-item">
                  <button onClick={handleNewMeeting} disabled={creating} className="quick-btn icon-orange" id="btn-top-host">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                  </button>
                  <span className="quick-label">Host</span>
                </div>
              </div>

              {/* Personal Meeting ID Box */}
              <div className="pmi-box" id="pmi-box">
                <p className="pmi-label">PERSONAL MEETING ID</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="pmi-number" id="pmi-display">{pmi}</span>
                  <button className="copy-icon-btn" onClick={copyPMID} title="Copy PMI" id="btn-copy-pmi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
                {copied && <span style={{ fontSize: 11, color: "var(--success)", display: "block", marginTop: 2 }}>Copied!</span>}
              </div>
            </div>
          </div>

          {/* Grid Layout: Banner (Left) + Upcoming Meetings (Right) */}
          <div className="dashboard-grid">
            {/* Promo Banner Card */}
            <div className="promo-card">
              <div className="promo-tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Zoom Workplace Pro
              </div>
              <h2 className="promo-title">Upgrade and save!</h2>
              <p className="promo-desc">
                Unlock up to 16% when you select an annual Zoom Workplace Pro plan.
              </p>
              <button className="promo-btn" id="btn-upgrade-today">Upgrade today</button>
            </div>

            {/* Upcoming Meetings List (Right Column) */}
            <div className="meetings-widget">
              <div className="widget-header">
                <h3 className="widget-title">Meetings</h3>
                <Link href="/schedule" className="widget-link" id="link-visit-meetings">Schedule Meeting</Link>
              </div>

              {upcoming.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-3)", fontSize: 13 }}>
                  No upcoming meetings scheduled
                </div>
              ) : (
                upcoming.slice(0, 3).map((m) => {
                  const { month, day } = getMonthDay(m.scheduled_at);
                  return (
                    <div key={m.id} className="meeting-item" id={`meeting-item-${m.id}`}>
                      <div className="meeting-date-box">
                        <span className="month">{month}</span>
                        <span className="day">{day}</span>
                      </div>
                      <div className="meeting-details">
                        <h4 className="meeting-item-title">{m.title}</h4>
                        <p className="meeting-item-sub">
                          {formatMeetingTime(m.scheduled_at)}
                        </p>
                      </div>
                      <Link
                        href={`/meeting/${m.meeting_id}`}
                        className="start-btn"
                        id={`btn-start-meeting-${m.id}`}
                      >
                        Start
                      </Link>
                    </div>
                  );
                })
              )}

              <div style={{ textAlign: "center", paddingTop: 8 }}>
                <a href="#recent-activity" className="widget-footer-link" id="link-test-audio-video">
                  View Recent Activity ↓
                </a>
              </div>
            </div>
          </div>

          {/* Action Cards (4 Tiles) */}
          <div className="action-cards-row">
            <button onClick={handleNewMeeting} disabled={creating} className="action-card" id="card-new-meeting">
              <div className="action-icon icon-orange-bg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <div className="action-text">
                <h3>New Meeting</h3>
                <p>Start an instant meeting</p>
              </div>
            </button>

            <Link href="/join" className="action-card" id="card-join-meeting">
              <div className="action-icon icon-blue-bg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6"/>
                  <path d="M10 14L21 3"/>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                </svg>
              </div>
              <div className="action-text">
                <h3>Join</h3>
                <p>Join a meeting</p>
              </div>
            </Link>

            <Link href="/schedule" className="action-card" id="card-schedule-meeting">
              <div className="action-icon icon-purple-bg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="action-text">
                <h3>Schedule</h3>
                <p>Plan a meeting</p>
              </div>
            </Link>

            <button onClick={handleNewMeeting} className="action-card" id="card-share-screen">
              <div className="action-icon icon-green-bg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div className="action-text">
                <h3>Share Screen</h3>
                <p>Share your screen</p>
              </div>
            </button>
          </div>

          {/* Recent Activity Table */}
          <div className="activity-section" id="recent-activity">
            <div className="activity-header">
              <h3 className="activity-title">Recent activity</h3>
              {allMeetings.length > PREVIEW_COUNT && (
                <button
                  className="activity-view-all"
                  onClick={() => setShowAll((s) => !s)}
                  id="btn-view-all-activity"
                >
                  {showAll ? "Show less" : `View all (${allMeetings.length})`}
                </button>
              )}
            </div>

            <div className="activity-list">
              {allMeetings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-3)", fontSize: 14 }}>
                  No meetings found. Start or schedule a meeting above!
                </div>
              ) : (
                (showAll ? allMeetings : allMeetings.slice(0, PREVIEW_COUNT)).map((m) => (
                  <div key={m.id} className="activity-item" id={`activity-item-${m.id}`}>
                    <div className="activity-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                    </div>

                    <div className="activity-main">
                      <h4 className="activity-name">{m.title}</h4>
                      <p className="activity-meta">
                        {m.host_name} · {formatMeetingTime(m.scheduled_at)}
                        {m.duration_minutes ? ` · ${formatDuration(m.duration_minutes)}` : ""}
                      </p>
                    </div>

                    <span className={`status-pill ${getStatusClass(m.status)}`}>
                      {getStatusLabel(m.status)}
                    </span>

                    <Link
                      href={`/meeting/${m.meeting_id}`}
                      className="activity-action-btn"
                      id={`btn-join-activity-${m.id}`}
                    >
                      Join
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
