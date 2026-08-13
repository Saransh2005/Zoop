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
  remoteScreenPresenters?: Record<string, boolean>;
  remoteCameraStates?: Record<string, boolean>;
  remoteMuteStates?: Record<string, boolean>;
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
  return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
}

interface TileProps {
  name: string;
  isHost?: boolean;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isLocal?: boolean;
  stream?: MediaStream | null;
  compact?: boolean;
}

function VideoTile({ name, isHost, isMuted, isCameraOn = true, isLocal, stream, compact }: TileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream && isCameraOn) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, isCameraOn]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: compact ? 8 : 10,
        overflow: "hidden",
        background: getColor(name),
        border: "2px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}
    >
      {/* Video or Avatar */}
      {isCameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!!isLocal}
          onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: isLocal ? "scaleX(-1)" : "none",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: compact ? 18 : 28,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 1,
          }}
        >
          {initials(name)}
        </div>
      )}

      {/* Name badge */}
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: 8,
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "rgba(0,0,0,0.65)",
          borderRadius: 6,
          padding: compact ? "2px 6px" : "3px 8px",
          fontSize: compact ? 10 : 12,
          fontWeight: 600,
          color: "#fff",
          maxWidth: "calc(100% - 16px)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {isMuted && (
          <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" width={compact ? 10 : 12} height={compact ? 10 : 12} style={{ flexShrink: 0 }}>
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2" />
          </svg>
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}{isLocal ? " (You)" : ""}{isHost ? " · Host" : ""}
        </span>
      </div>
    </div>
  );
}

function ScreenSharePanel({ stream, presenterName }: { stream: MediaStream; presenterName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        background: "#0a0a0a",
        borderRadius: 12,
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
      {/* Presenter badge */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          background: "rgba(0,0,0,0.78)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          padding: "6px 14px",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(6px)",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
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
  remoteScreenPresenters = {},
  remoteCameraStates = {},
  remoteMuteStates = {},
}: VideoGridProps) {
  const others = participants.filter(
    (p) => p.display_name !== localName && p.left_at === null
  );

  // Determine the active screen share: local takes priority, then first remote presenter
  const remotePresenterName = Object.keys(remoteScreenPresenters).find((k) => remoteScreenPresenters[k]);
  const activePresenterName = screenStream ? localName : (remotePresenterName || "");
  const activeScreenStream = screenStream || (remotePresenterName ? remoteStreams[remotePresenterName] : null);

  // ── Screen share active: LEFT large screen + RIGHT camera strip ────────────
  if (activeScreenStream) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          gap: 10,
          padding: 10,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* LEFT: screen share (takes remaining width) */}
        <ScreenSharePanel stream={activeScreenStream} presenterName={activePresenterName} />

        {/* RIGHT: vertical camera strip (fixed 200px) */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {/* Local tile always first */}
          <div style={{ height: 120, flexShrink: 0 }}>
            <VideoTile
              name={localName}
              isLocal
              isMuted={isMuted}
              isCameraOn={isCameraOn}
              stream={localStream}
              isHost
              compact
            />
          </div>

          {/* Remote participants */}
          {others.map((p: Participant) => {
            const isRemoteCamOn = remoteCameraStates[p.display_name] !== undefined
              ? remoteCameraStates[p.display_name]
              : p.is_video_on;
            const isRemoteMuted = remoteMuteStates[p.display_name] !== undefined
              ? remoteMuteStates[p.display_name]
              : p.is_muted;

            return (
              <div key={p.id} style={{ height: 120, flexShrink: 0 }}>
                <VideoTile
                  name={p.display_name}
                  isMuted={isRemoteMuted}
                  isCameraOn={isRemoteCamOn}
                  isHost={p.is_host}
                  stream={remoteStreams[p.display_name]}
                  compact
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Standard Camera Grid (no screen share) ─────────────────────────
  const total = 1 + others.length;
  let cols = 1;
  if (total >= 2) cols = 2;
  if (total >= 5) cols = 3;
  if (total >= 10) cols = 4;

  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 10,
        padding: 10,
        alignContent: "center",
        justifyContent: "center",
        maxHeight: "calc(100vh - 120px)",
        overflow: "hidden",
      }}
    >
      <VideoTile
        name={localName}
        isLocal
        isMuted={isMuted}
        isCameraOn={isCameraOn}
        stream={localStream}
        isHost
      />

      {others.map((p: Participant) => {
        const isRemoteCamOn = remoteCameraStates[p.display_name] !== undefined
          ? remoteCameraStates[p.display_name]
          : p.is_video_on;
        const isRemoteMuted = remoteMuteStates[p.display_name] !== undefined
          ? remoteMuteStates[p.display_name]
          : p.is_muted;

        return (
          <VideoTile
            key={p.id}
            name={p.display_name}
            isMuted={isRemoteMuted}
            isCameraOn={isRemoteCamOn}
            isHost={p.is_host}
            stream={remoteStreams[p.display_name]}
          />
        );
      })}
    </div>
  );
}

