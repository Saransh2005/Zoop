const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  full_name: string;
  personal_meeting_id: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Meeting {
  id: number;
  meeting_id: string;
  title: string;
  host_name: string;
  status: "scheduled" | "active" | "ended";
  scheduled_at: string | null;
  duration_minutes: number;
  invite_link: string;
  created_at: string;
  participant_count?: number;
  description?: string;
  participants?: Participant[];
}

export interface Participant {
  id: number;
  meeting_db_id: number;
  display_name: string;
  joined_at: string;
  left_at: string | null;
  is_host: boolean;
  is_muted: boolean;
  is_video_on: boolean;
}

export interface JoinResponse {
  success: boolean;
  meeting: Meeting;
  participant: Participant;
  message: string;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options?.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── API Client ──────────────────────────────────────────────────────────────

export const api = {
  // Auth
  signup: (data: { email: string; password: string; full_name: string }) =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>("/api/auth/me"),

  // Meetings
  getUpcoming: () => request<Meeting[]>("/api/meetings/upcoming"),
  getRecent: (limit = 10) => request<Meeting[]>(`/api/meetings/recent?limit=${limit}`),
  getMeeting: (id: string) => request<Meeting>(`/api/meetings/${id}`),

  createInstantMeeting: (title = "Instant Meeting", hostName = "Saransh Singh") =>
    request<Meeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify({ title, host_name: hostName, duration_minutes: 60 }),
    }),

  scheduleMeeting: (data: {
    title: string;
    description?: string;
    host_name: string;
    scheduled_at: string;
    duration_minutes: number;
  }) =>
    request<Meeting>("/api/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  joinMeeting: (meetingId: string, displayName: string) =>
    request<JoinResponse>(`/api/meetings/${meetingId}/join`, {
      method: "POST",
      body: JSON.stringify({ display_name: displayName }),
    }),

  leaveMeeting: (meetingId: string, participantId: number) =>
    request(`/api/meetings/${meetingId}/leave?participant_id=${participantId}`, {
      method: "POST",
    }),

  endMeeting: (meetingId: string) =>
    request(`/api/meetings/${meetingId}/end`, { method: "DELETE" }),

  getParticipants: (meetingId: string) =>
    request<Participant[]>(`/api/participants/${meetingId}`),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatMeetingTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
