"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import VideoGrid from "@/components/VideoGrid";
import MeetingControls from "@/components/MeetingControls";
import { api, Meeting, Participant } from "@/lib/api";

const DEFAULT_HOST = "Saransh Singh";
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // Metered TURN servers - reliable free tier
    {
      urls: "turn:a.relay.metered.ca:80",
      username: "83eebabf8b4cce9d5dbcb649",
      credential: "2D7JvfkOQtBdYW3R",
    },
    {
      urls: "turn:a.relay.metered.ca:80?transport=tcp",
      username: "83eebabf8b4cce9d5dbcb649",
      credential: "2D7JvfkOQtBdYW3R",
    },
    {
      urls: "turn:a.relay.metered.ca:443",
      username: "83eebabf8b4cce9d5dbcb649",
      credential: "2D7JvfkOQtBdYW3R",
    },
    {
      urls: "turn:a.relay.metered.ca:443?transport=tcp",
      username: "83eebabf8b4cce9d5dbcb649",
      credential: "2D7JvfkOQtBdYW3R",
    },
  ],
  iceCandidatePoolSize: 10,
};

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Generate animated fallback video stream when single laptop camera is locked by another tab
function createFallbackVideoStream(name: string): MediaStream {
  if (typeof window === "undefined") return new MediaStream();
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");

  let animFrameId: number;
  let hue = 210;

  const render = () => {
    if (!ctx) return;
    hue = (hue + 0.5) % 360;

    // Dark sleek video background
    ctx.fillStyle = "#121316";
    ctx.fillRect(0, 0, 640, 480);

    // Glowing circle
    ctx.fillStyle = `hsl(${hue}, 85%, 45%)`;
    ctx.beginPath();
    ctx.arc(320, 240, 75, 0, Math.PI * 2);
    ctx.fill();

    // User initials text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(), 320, 240);

    // Live video badge
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(20, 430, 160, 30);
    ctx.fillStyle = "#00c851";
    ctx.beginPath();
    ctx.arc(35, 445, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("LIVE STREAM", 48, 449);

    animFrameId = requestAnimationFrame(render);
  };
  render();

  const stream = canvas.captureStream(30);
  (stream as any)._cleanup = () => cancelAnimationFrame(animFrameId);
  return stream;
}

export default function MeetingPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = (params?.id as string) || "";

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("user");
      if (cached) {
        try {
          const u = JSON.parse(cached);
          return u.full_name || DEFAULT_HOST;
        } catch {}
      }
      return sessionStorage.getItem("displayName") || DEFAULT_HOST;
    }
    return DEFAULT_HOST;
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [participantId, setParticipantId] = useState<number | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "System", text: "Welcome to the meeting! 👋", time: "now" },
  ]);
  const [chatInput, setChatInput] = useState("");

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const pendingIceCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2700);
  };

  // ─── Attach Local Tracks Helper ─────────────────────────────────────────────
  const attachLocalTracks = useCallback((pc: RTCPeerConnection) => {
    if (localStreamRef.current) {
      const senders = pc.getSenders();
      localStreamRef.current.getTracks().forEach((track) => {
        const exists = senders.some((s) => s.track && s.track.kind === track.kind);
        if (!exists) {
          try {
            pc.addTrack(track, localStreamRef.current!);
          } catch (e) {}
        }
      });
    }
  }, []);

  // Send signaling message via WS + BroadcastChannel
  const sendSignal = useCallback((msg: object) => {
    const payload = JSON.stringify(msg);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
    }
    if (channelRef.current) {
      channelRef.current.postMessage(payload);
    }
  }, []);

  // Helper to completely kill hardware media tracks
  const stopAllMediaTracks = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      if ((localStreamRef.current as any)._cleanup) {
        (localStreamRef.current as any)._cleanup();
      }
      localStreamRef.current = null;
    }
    setLocalStream(null);

    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
    }
  }, [screenStream]);

  // WebRTC Peer Connection Helper
  const createPeerConnection = useCallback((peerName: string): RTCPeerConnection => {
    if (peerConnectionsRef.current[peerName]) {
      const pc = peerConnectionsRef.current[peerName];
      attachLocalTracks(pc);
      return pc;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[peerName] = pc;
    attachLocalTracks(pc);

    // Handle remote track arrival
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        setRemoteStreams((prev) => ({ ...prev, [peerName]: stream }));
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "WEBRTC_ICE",
          sender: localName,
          target: peerName,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  }, [localName, sendSignal, attachLocalTracks]);

  // WebRTC Signal Processing
  const handleSignal = useCallback(async (data: any) => {
    if (!data || data.sender === localName) return;

    if (data.type === "WEBRTC_JOIN") {
      const pc = createPeerConnection(data.sender);
      attachLocalTracks(pc);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({
        type: "WEBRTC_OFFER",
        sender: localName,
        target: data.sender,
        offer: offer,
      });
    } else if (data.type === "WEBRTC_OFFER" && (data.target === localName || !data.target)) {
      const pc = createPeerConnection(data.sender);
      attachLocalTracks(pc);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      // Flush pending ICE candidates if any
      const pending = pendingIceCandidatesRef.current[data.sender] || [];
      for (const cand of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {}
      }
      pendingIceCandidatesRef.current[data.sender] = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({
        type: "WEBRTC_ANSWER",
        sender: localName,
        target: data.sender,
        answer: answer,
      });
    } else if (data.type === "WEBRTC_ANSWER" && (data.target === localName || !data.target)) {
      const pc = peerConnectionsRef.current[data.sender];
      if (pc && pc.signalingState !== "closed") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

        // Flush pending ICE candidates if any
        const pending = pendingIceCandidatesRef.current[data.sender] || [];
        for (const cand of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }
        pendingIceCandidatesRef.current[data.sender] = [];
      }
    } else if (data.type === "WEBRTC_ICE" && (data.target === localName || !data.target)) {
      const pc = peerConnectionsRef.current[data.sender];
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {}
      } else {
        if (!pendingIceCandidatesRef.current[data.sender]) {
          pendingIceCandidatesRef.current[data.sender] = [];
        }
        pendingIceCandidatesRef.current[data.sender].push(data.candidate);
      }
    } else if (data.type === "CHAT_MSG") {
      setChatMessages((prev) => [...prev, data.payload]);
    } else if (data.type === "PARTICIPANTS_UPDATE") {
      api.getParticipants(meetingId).then(setParticipants).catch(() => {});
    } else if (data.type === "MUTE_USER" && data.payload.target === localName) {
      setIsMuted(true);
      showToast("You were muted by the host");
    } else if (data.type === "REMOVE_USER" && data.payload.target === localName) {
      showToast("You were removed from the meeting");
      stopAllMediaTracks();
      setTimeout(() => router.push("/"), 1500);
    }
  }, [localName, createPeerConnection, sendSignal, meetingId, router, stopAllMediaTracks]);

  // ─── WebSockets & BroadcastChannel Setup ───────────────────────────────────
  useEffect(() => {
    if (!meetingId) return;

    const channel = new BroadcastChannel(`zoom_meeting_${meetingId}`);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSignal(data);
      } catch (e) {}
    };

    const rawApi = process.env.NEXT_PUBLIC_API_URL || "https://zoop-t1l7.onrender.com";
    const backendHost = rawApi.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${backendHost}/ws/meeting/${meetingId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSignal(data);
      } catch (e) {}
    };

    return () => {
      channel.close();
      ws.close();
    };
  }, [meetingId, handleSignal]);

  // ─── Real Camera & Audio (getUserMedia with Fallback) ───────────────────────
  useEffect(() => {
    let mounted = true;
    async function initCamera() {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        console.warn("Hardware camera unavailable or locked by another tab. Using animated fallback stream.");
        stream = createFallbackVideoStream(localName);
      }

      if (mounted) {
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Attach tracks to any already-created peer connections
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          attachLocalTracks(pc);
        });

        // Announce join to initiate WebRTC P2P connection exchange
        sendSignal({ type: "WEBRTC_JOIN", sender: localName });
      } else {
        stream.getTracks().forEach((t) => t.stop());
      }
    }
    initCamera();

    const handleBeforeUnload = () => {
      stopAllMediaTracks();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      mounted = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [localName, sendSignal, stopAllMediaTracks]);

  // Sync mute state with stream tracks
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Camera Toggle: Physically stop video track when turning camera OFF
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.stop();
        });
      }
      setIsCameraOn(false);
      showToast("Camera off");
    } else {
      try {
        let newCamStream: MediaStream;
        try {
          newCamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch {
          newCamStream = createFallbackVideoStream(localName);
        }
        const videoTrack = newCamStream.getVideoTracks()[0];
        if (localStreamRef.current && videoTrack) {
          localStreamRef.current.addTrack(videoTrack);
        }
        setIsCameraOn(true);
        showToast("Camera on");

        sendSignal({ type: "WEBRTC_JOIN", sender: localName });
      } catch (e) {
        showToast("Unable to start camera");
      }
    }
  };

  // ─── Real Screen Sharing (getDisplayMedia) ─────────────────────────────────
  const handleShareScreen = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      showToast("Screen sharing stopped");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      setScreenStream(stream);
      showToast("Screen sharing started!");

      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        showToast("Screen sharing ended");
      };
    } catch (err) {
      console.warn("Screen share error:", err);
    }
  };

  // Load meeting & auto-join
  const loadMeeting = useCallback(async () => {
    try {
      const m = await api.getMeeting(meetingId);
      setMeeting(m);

      if (m.participants && m.participants.length === 0) {
        const res = await api.joinMeeting(meetingId, localName);
        setParticipantId(res.participant.id);
        setParticipants(res.meeting.participants || []);
      } else {
        setParticipants(m.participants || []);
        const existing = m.participants?.find(
          (p) => p.display_name === localName && p.left_at === null
        );
        if (existing) {
          setParticipantId(existing.id);
        } else {
          const res = await api.joinMeeting(meetingId, localName);
          setParticipantId(res.participant.id);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load meeting.");
    } finally {
      setLoading(false);
    }
  }, [meetingId, localName]);

  useEffect(() => {
    loadMeeting();
  }, [loadMeeting]);

  // Refresh participants
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const ps = await api.getParticipants(meetingId);
        setParticipants(ps);
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, [meetingId]);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleEndMeeting = async () => {
    stopAllMediaTracks();
    try {
      if (participantId) {
        await api.leaveMeeting(meetingId, participantId);
      }
      await api.endMeeting(meetingId);
    } catch {}
    router.push("/");
  };

  const handleReact = () => showToast("🎉 Reaction sent!");

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      sender: localName,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    sendSignal({ type: "CHAT_MSG", payload: newMsg });
    setChatInput("");
  };

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner" style={{ width: 50, height: 50 }} />
        <p style={{ color: "var(--text-2)", fontSize: 14 }}>Joining meeting...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="spinner-page">
        <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Meeting Not Found</h2>
        <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 20 }}>{error}</p>
        <button
          className="btn-primary"
          style={{ width: "auto", padding: "12px 28px" }}
          onClick={() => {
            stopAllMediaTracks();
            router.push("/");
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  const activeParticipants = participants.filter((p) => p.left_at === null);

  return (
    <div className="meeting-room">
      {/* Header */}
      <header className="meeting-header">
        <div className="meeting-header-left">
          <div className="meeting-header-logo">
            <svg viewBox="0 0 40 40" fill="none" width="24" height="24">
              <circle cx="20" cy="20" r="20" fill="#0E72ED" />
              <path d="M10 15h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="white" />
              <path d="M26 17.5l6-3v11l-6-3v-5z" fill="white" />
            </svg>
            <span>Zoom</span>
          </div>
          <span style={{ color: "var(--border)" }}>|</span>
          <span className="meeting-topic">{meeting.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>
            {activeParticipants.length} participant{activeParticipants.length !== 1 ? "s" : ""}
          </span>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: meeting.status === "active" ? "var(--success)" : "var(--text-3)",
              boxShadow: meeting.status === "active" ? "0 0 6px var(--success)" : "none",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--text-2)", textTransform: "capitalize" }}>
            {meeting.status}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="meeting-body">
        <div className="meeting-main">
          {/* Video Grid */}
          <VideoGrid
            participants={activeParticipants}
            localName={localName}
            isCameraOn={isCameraOn}
            isMuted={isMuted}
            localStream={localStream}
            remoteStreams={remoteStreams}
            screenStream={screenStream}
          />

          {/* Controls */}
          <MeetingControls
            isMuted={isMuted}
            isCameraOn={isCameraOn}
            isParticipantsOpen={isParticipantsOpen}
            isChatOpen={isChatOpen}
            isScreenSharing={!!screenStream}
            onToggleMute={() => {
              setIsMuted((m) => !m);
              showToast(isMuted ? "Unmuted" : "Muted");
            }}
            onToggleCamera={toggleCamera}
            onToggleParticipants={() => {
              setIsParticipantsOpen((p) => !p);
              if (isChatOpen) setIsChatOpen(false);
            }}
            onToggleChat={() => {
              setIsChatOpen((c) => !c);
              if (isParticipantsOpen) setIsParticipantsOpen(false);
            }}
            onShareScreen={handleShareScreen}
            onReact={handleReact}
            onEndMeeting={handleEndMeeting}
            meetingId={meetingId}
            elapsed={formatElapsed(elapsed)}
          />
        </div>

        {/* Participants Panel */}
        {isParticipantsOpen && (
          <aside className="side-panel">
            <div className="panel-header">
              <h3 className="panel-title">Participants ({activeParticipants.length})</h3>
              <button className="panel-close" onClick={() => setIsParticipantsOpen(false)} id="panel-close-participants">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="panel-content">
              <div className="participant-item">
                <div className="participant-dot" style={{ background: "linear-gradient(135deg, #0E72ED, #0B5CCC)" }}>
                  {localName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <span className="participant-name">{localName} (You)</span>
                <div className="participant-badges">
                  <span style={{ fontSize: 10, color: "#0E72ED", fontWeight: 600 }}>Host</span>
                  {isMuted && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" width="12" height="12">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                    </svg>
                  )}
                </div>
              </div>
              {activeParticipants
                .filter((p: Participant) => p.display_name !== localName)
                .map((p: Participant) => (
                  <div className="participant-item" key={p.id}>
                    <div className="participant-dot">
                      {p.display_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="participant-name">{p.display_name}</span>
                    <div className="participant-badges">
                      {p.is_host && <span style={{ fontSize: 10, color: "#0E72ED", fontWeight: 600 }}>Host</span>}
                      {p.is_muted && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" width="12" height="12">
                          <line x1="1" y1="1" x2="23" y2="23" />
                          <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </aside>
        )}

        {/* Chat Panel */}
        {isChatOpen && (
          <aside className="side-panel" style={{ display: "flex", flexDirection: "column" }}>
            <div className="panel-header">
              <h3 className="panel-title">Meeting Chat</h3>
              <button className="panel-close" onClick={() => setIsChatOpen(false)} id="panel-close-chat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="panel-content">
              <div className="chat-messages">
                {chatMessages.map((msg: ChatMessage, i: number) => (
                  <div className="chat-bubble" key={i}>
                    <div className="chat-sender">{msg.sender}</div>
                    <div className="chat-text">{msg.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>
            <form className="chat-input-row" onSubmit={sendChat}>
              <input
                className="chat-input"
                type="text"
                placeholder="Send a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                id="chat-input"
              />
              <button type="submit" className="chat-send-btn" id="chat-send-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
