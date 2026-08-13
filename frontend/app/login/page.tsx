"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await api.login({ email: email.trim(), password });
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      sessionStorage.setItem("displayName", res.user.full_name);
      window.location.href = "/";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
      setLoading(false);
    }
  };

  return (
    <div className="join-page">
      <div className="join-card">
        <div className="join-card-header">
          <div className="join-logo">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#0E72ED" />
              <path d="M10 15h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="white" />
              <path d="M26 17.5l6-3v11l-6-3v-5z" fill="white" />
            </svg>
            <span className="join-logo-text">Zoom</span>
          </div>
          <h1 className="join-title">Sign In</h1>
          <p className="join-sub">Access your personal meeting ID &amp; dashboard</p>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            id="btn-login-submit"
            disabled={loading}
            style={{ marginTop: 24 }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="divider">Need an account?</div>

        <Link href="/signup" className="btn-secondary" id="btn-goto-signup">
          Create Account / Sign Up
        </Link>
      </div>
    </div>
  );
}
