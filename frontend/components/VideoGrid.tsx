"use client";
import { useEffect, useRef } from "react";
import { Participant } from "@/lib/api";

interface VideoGridProps {
  participants: Participant[];
  localName: string;
  isCameraOn: boolean;
  isMuted: boolean;
  localStream: MediaStream | null;
  remoteStreams?: Record<string, MediaStream>;
  screenStream: MediaStream | null;
}

const AVATAR_COLORS = [
  "#0E72ED", "#059669", "#7C3AED", "#F5620F",
  "#1565C0", "#283593", "#0288D1", "#006064",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface TileProps {
  name: string;
  isHost?: boolean;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isLocal?: boolean;
  stream?: MediaStream | null;
}

function VideoTile({ name, isHost, isMuted, isCameraOn = true, isLocal, stream }: TileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && isCameraOn && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraOn]);

  return (
    <div className={`video-tile ${isLocal ? "video-tile-local" : ""}`}>
      <div className="video-content" style={{ background: getColor(name) }}>
        {isCameraOn && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal} // Mute local audio playback to avoid echo, play remote audio!
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: isLocal ? "scaleX(-1)" : "none", // Mirror local video only
              borderRadius: "8px 8px 0 0",
              background: "#000",
            }}
          />
        ) : !isCameraOn ? (
          <div className="avatar-circle">
            <span>{initials(name)}</span>
          </div>
        ) : (
          <div className="avatar-circle video-simulated">
            <span>{initials(name)}</span>
            <div className="video-bars">
              <div className="bar" />
              <div className="bar" />
              <div className="bar" />
            </div>
          </div>
        )}
      </div>
      <div className="tile-footer">
        <span className="tile-name">
          {name} {isLocal ? "(You)" : ""} {isHost ? "· Host" : ""}
        </span>
        {isMuted && (
          <span className="tile-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}

function ScreenShareStage({ stream, presenterName }: { stream: MediaStream; presenterName: string }) {
  const screenRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#000", position: "relative" }}>
      <video
        ref={screenRef}
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      <div style={{
        position: "absolute",
        top: 12,
        left: 16,
        background: "rgba(0,0,0,0.75)",
        color: "white",
        fontSize: 13,
        fontWeight: 600,
        padding: "6px 14px",
        borderRadius: 20,
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid rgba(255,255,255,0.2)",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00c851" }} />
        {presenterName} is sharing screen
      </div>
    </div>
  );
}

export default function VideoGrid({
  participants,
  localName,
  isCameraOn,
  isMuted,
  localStream,
  remoteStreams = {},
  screenStream,
}: VideoGridProps) {
  const others = participants.filter(
    (p) => p.display_name !== localName && p.left_at === null
  );

  const totalCount = others.length + 1;
  const gridClass =
    totalCount === 1
      ? "video-grid-1"
      : totalCount === 2
      ? "video-grid-2"
      : totalCount <= 4
      ? "video-grid-4"
      : "video-grid-many";

  if (screenStream) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <ScreenShareStage stream={screenStream} presenterName={localName} />
        <div style={{ height: 120, background: "#181818", borderTop: "1px solid #2a2a2a", padding: 8, display: "flex", gap: 8, overflowX: "auto" }}>
          <div style={{ width: 140, flexShrink: 0 }}>
            <VideoTile
              name={localName}
              isLocal
              isMuted={isMuted}
              isCameraOn={isCameraOn}
              stream={localStream}
              isHost
            />
          </div>
          {others.map((p) => (
            <div key={p.id} style={{ width: 140, flexShrink: 0 }}>
              <VideoTile
                name={p.display_name}
                isMuted={p.is_muted}
                isCameraOn={p.is_video_on}
                stream={remoteStreams[p.display_name] || null}
                isHost={p.is_host}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`video-grid ${gridClass}`}>
      <VideoTile
        name={localName}
        isLocal
        isMuted={isMuted}
        isCameraOn={isCameraOn}
        stream={localStream}
        isHost
      />
      {others.map((p) => {
        const remoteStream = remoteStreams[p.display_name];
        return (
          <VideoTile
            key={p.id}
            name={p.display_name}
            isMuted={p.is_muted}
            isCameraOn={p.is_video_on && !!remoteStream}
            stream={remoteStream || null}
            isHost={p.is_host}
          />
        );
      })}
    </div>
  );
}
