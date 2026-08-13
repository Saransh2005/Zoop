"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
    }
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await api.signup({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      sessionStorage.setItem("displayName", res.user.full_name);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
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
          <h1 className="join-title">Create Free Account</h1>
          <p className="join-sub">Get your own unique Personal Meeting ID</p>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">Full Name</label>
            <input
              id="signup-name"
              className="form-input"
              type="text"
              placeholder="e.g. Saransh Singh"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Email Address</label>
            <input
              id="signup-email"
              className="form-input"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">Password</label>
            <input
              id="signup-password"
              className="form-input"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            id="btn-signup-submit"
            disabled={loading}
            style={{ marginTop: 24 }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Creating Account...
              </>
            ) : (
              "Sign Up Free"
            )}
          </button>
        </form>

        <div className="divider">Already have an account?</div>

        <Link href="/login" className="btn-secondary" id="btn-goto-login">
          Sign In
        </Link>
      </div>
    </div>
  );
}
