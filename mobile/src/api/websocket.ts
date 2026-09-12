import { api } from "./client";

export interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

export type SignalHandler = (data: any) => void;

class MeetingSocketManager {
  private socket: WebSocket | null = null;
  private meetingId: string | null = null;
  private userName: string | null = null;
  private listeners: Map<string, Set<SignalHandler>> = new Map();
  private isConnecting: boolean = false;
  private reconnectTimeout: any = null;

  connect(meetingId: string, userName: string) {
    if (this.socket && this.meetingId === meetingId && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.disconnect();
    this.meetingId = meetingId;
    this.userName = userName;
    this.isConnecting = true;

    try {
      const baseUrl = api.getBaseUrl();
      const isHttps = baseUrl.startsWith("https://");
      const host = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const protocol = isHttps ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${host}/ws/meeting/${meetingId}`;

      const ws = new WebSocket(wsUrl);
      this.socket = ws;

      ws.onopen = () => {
        this.isConnecting = false;
        // Announce join
        this.send({
          type: "WEBRTC_JOIN",
          sender: this.userName,
        });
        this.emit("OPEN", { meetingId });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type) {
            this.emit(data.type, data);
            this.emit("ALL", data);
          }
        } catch (e) {
          console.warn("Failed to parse incoming WS message:", e);
        }
      };

      ws.onerror = (error) => {
        console.warn("WebSocket error:", error);
        this.emit("ERROR", error);
      };

      ws.onclose = () => {
        this.emit("CLOSE", {});
        this.socket = null;
      };
    } catch (e) {
      console.warn("Error creating WebSocket:", e);
      this.isConnecting = false;
    }
  }

  send(data: object) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (err) {
        console.warn("Error sending WS payload:", err);
      }
    }
  }

  sendChat(text: string) {
    if (!this.userName) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const payload: ChatMessage = {
      sender: this.userName,
      text,
      time: timeStr,
    };

    // Broadcast to room
    this.send({
      type: "CHAT_MSG",
      sender: this.userName,
      payload,
    });

    // Also emit locally for immediate UI display
    this.emit("CHAT_MSG", {
      type: "CHAT_MSG",
      sender: this.userName,
      payload,
    });
  }

  sendCameraToggle(isCameraOn: boolean) {
    this.send({
      type: "CAMERA_TOGGLE",
      sender: this.userName,
      isCameraOn,
    });
  }

  sendMuteToggle(isMuted: boolean) {
    this.send({
      type: "MUTE_TOGGLE",
      sender: this.userName,
      isMuted,
    });
  }

  sendMuteUser(targetName: string) {
    this.send({
      type: "MUTE_USER",
      sender: this.userName,
      payload: { target: targetName },
    });
  }

  sendRemoveUser(targetName: string) {
    this.send({
      type: "REMOVE_USER",
      sender: this.userName,
      payload: { target: targetName },
    });
  }

  on(event: string, handler: SignalHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: SignalHandler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (e) {
          console.error(`Error in WS listener for ${event}:`, e);
        }
      });
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch { }
      this.socket = null;
    }
    this.meetingId = null;
    this.listeners.clear();
  }
}

export const meetingSocket = new MeetingSocketManager();
