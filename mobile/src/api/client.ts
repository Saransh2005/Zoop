import AsyncStorage from "@react-native-async-storage/async-storage";

export const DEFAULT_API_URL = "https://zoop-t1l7.onrender.com";
export const STORAGE_KEYS = {
  TOKEN: "zoop_auth_token",
  USER: "zoop_user_data",
  API_URL: "zoop_api_url",
  DISPLAY_NAME: "zoop_display_name",
};

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

class ApiClient {
  private baseUrl: string = DEFAULT_API_URL;
  private token: string | null = null;

  async initialize(): Promise<void> {
    try {
      const [savedUrl, savedToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.API_URL),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
      ]);
      if (savedUrl) {
        this.baseUrl = savedUrl.replace(/\/$/, "");
      }
      if (savedToken) {
        this.token = savedToken;
      }
    } catch (e) {
      console.warn("Error initializing API client:", e);
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async setBaseUrl(url: string): Promise<void> {
    this.baseUrl = url.replace(/\/$/, "");
    await AsyncStorage.setItem(STORAGE_KEYS.API_URL, this.baseUrl);
  }

  getWsUrl(meetingId: string, userName: string): string {
    const wsBase = this.baseUrl.replace(/^http/, "ws");
    return `${wsBase}/ws/${meetingId}/${encodeURIComponent(userName)}`;
  }

  getToken(): string | null {
    return this.token;
  }

  async setToken(token: string | null): Promise<void> {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options?.headers as Record<string, string>),
    };

    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status} error` }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth APIs
  signup(data: { email: string; password: string; full_name: string }) {
    return this.request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  login(data: { email: string; password: string }) {
    return this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getMe() {
    return this.request<User>("/api/auth/me");
  }

  // Meeting APIs
  getUpcoming() {
    return this.request<Meeting[]>("/api/meetings/upcoming");
  }

  getRecent(limit = 10) {
    return this.request<Meeting[]>(`/api/meetings/recent?limit=${limit}`);
  }

  getMeeting(id: string) {
    return this.request<Meeting>(`/api/meetings/${id}`);
  }

  createInstantMeeting(title = "Instant Meeting", hostName = "Host User") {
    return this.request<Meeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify({ title, host_name: hostName, duration_minutes: 60 }),
    });
  }

  scheduleMeeting(data: {
    title: string;
    description?: string;
    host_name: string;
    scheduled_at: string;
    duration_minutes: number;
  }) {
    return this.request<Meeting>("/api/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  joinMeeting(meetingId: string, displayName: string) {
    return this.request<JoinResponse>(`/api/meetings/${meetingId}/join`, {
      method: "POST",
      body: JSON.stringify({ display_name: displayName }),
    });
  }

  leaveMeeting(meetingId: string, participantId: number) {
    return this.request(`/api/meetings/${meetingId}/leave?participant_id=${participantId}`, {
      method: "POST",
    });
  }

  endMeeting(meetingId: string) {
    return this.request(`/api/meetings/${meetingId}/end`, { method: "DELETE" });
  }

  getParticipants(meetingId: string) {
    return this.request<Participant[]>(`/api/participants/${meetingId}`);
  }
}

export const api = new ApiClient();
