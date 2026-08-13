"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, User } from "@/lib/api";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage user first
    const cached = localStorage.getItem("user");
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch { }
    }
    // Verify token with backend
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
  }, [pathname]);

  // Hide top navbar inside meeting room
  if (pathname?.startsWith("/meeting/")) return null;

  const handleHost = async () => {
    setCreating(true);
    const hostName = user ? user.full_name : "Saransh Singh";
    try {
      const meeting = await api.createInstantMeeting("Instant Meeting", hostName);
      router.push(`/meeting/${meeting.meeting_id}`);
    } catch {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const initials = user
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SS";

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link href="/" className="navbar-logo" id="nav-logo">
        <svg viewBox="0 0 40 40" fill="none" className="logo-icon">
          <circle cx="20" cy="20" r="20" fill="#0E72ED" />
          <path d="M10 15h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="white" />
          <path d="M26 17.5l6-3v11l-6-3v-5z" fill="white" />
        </svg>
        <span className="logo-text">zoom</span>
      </Link>

      {/* Nav links */}
      <div className="navbar-links">
        <a href="#" className="navbar-link">
          Products
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
        </a>
        <a href="#" className="navbar-link">
          Solutions
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
        </a>
        <a href="#" className="navbar-link">Resources</a>
        <a href="#" className="navbar-link">Plans &amp; Pricing</a>
      </div>

      {/* Right actions */}
      <div className="navbar-right">
        <button className="navbar-search-btn" id="nav-search" title="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <a href="#" className="navbar-link" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Support</a>

        <Link href="/schedule" className="navbar-action-btn" id="nav-schedule">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Schedule
        </Link>

        <Link href="/join" className="navbar-action-btn" id="nav-join">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Join
        </Link>

        <button
          className="navbar-action-btn navbar-action-btn-primary"
          id="nav-host"
          onClick={handleHost}
          disabled={creating}
        >
          {creating ? (
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          )}
          {creating ? "Starting..." : "Host"}
        </button>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="nav-avatar" id="nav-profile" title={user.full_name}>
              <span>{initials}</span>
            </div>
            <button
              onClick={handleLogout}
              className="navbar-link"
              style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
              id="btn-logout"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="navbar-action-btn"
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
            id="btn-nav-login"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
