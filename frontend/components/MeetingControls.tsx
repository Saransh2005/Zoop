"use client";

interface ControlsProps {
  isMuted: boolean;
  isCameraOn: boolean;
  isParticipantsOpen: boolean;
  isChatOpen: boolean;
  isScreenSharing?: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onShareScreen: () => void;
  onReact: () => void;
  onEndMeeting: () => void;
  meetingId: string;
  elapsed: string;
}

export default function MeetingControls({
  isMuted,
  isCameraOn,
  isParticipantsOpen,
  isChatOpen,
  isScreenSharing = false,
  onToggleMute,
  onToggleCamera,
  onToggleParticipants,
  onToggleChat,
  onShareScreen,
  onReact,
  onEndMeeting,
  meetingId,
  elapsed,
}: ControlsProps) {
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${meetingId}`);
  };

  return (
    <div className="controls-bar">
      <div className="controls-left">
        <div className="meeting-id-display">
          <span className="meeting-id-label">Meeting ID:</span>
          <span className="meeting-id-value">{meetingId}</span>
          <button className="copy-btn" onClick={copyLink} title="Copy invite link" id="ctrl-copy-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
        <span className="elapsed-time">{elapsed}</span>
      </div>

      <div className="controls-center">
        {/* Mute */}
        <button
          className={`ctrl-btn ${isMuted ? "ctrl-btn-danger" : ""}`}
          onClick={onToggleMute}
          id="ctrl-mute"
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
          <span>{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        {/* Camera */}
        <button
          className={`ctrl-btn ${!isCameraOn ? "ctrl-btn-danger" : ""}`}
          onClick={onToggleCamera}
          id="ctrl-camera"
          title={isCameraOn ? "Stop Video Camera" : "Start Video Camera"}
        >
          {!isCameraOn ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34" />
              <path d="M3 3l18 18" />
              <path d="M22 16.92V8l-6 4 6 3.92z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          )}
          <span>{isCameraOn ? "Stop Video" : "Start Video"}</span>
        </button>

        {/* Security */}
        <button className="ctrl-btn" id="ctrl-security" title="Security Options">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Security</span>
        </button>

        {/* Participants */}
        <button
          className={`ctrl-btn ${isParticipantsOpen ? "ctrl-btn-active" : ""}`}
          onClick={onToggleParticipants}
          id="ctrl-participants"
          title="Participants List"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Participants</span>
        </button>

        {/* Chat */}
        <button
          className={`ctrl-btn ${isChatOpen ? "ctrl-btn-active" : ""}`}
          onClick={onToggleChat}
          id="ctrl-chat"
          title="Meeting Chat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Chat</span>
        </button>

        {/* Share Screen */}
        <button
          className={`ctrl-btn ${isScreenSharing ? "ctrl-btn-active" : ""}`}
          onClick={onShareScreen}
          id="ctrl-share-screen"
          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          style={{ color: isScreenSharing ? "#00c851" : undefined }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
        </button>

        {/* Reactions */}
        <button className="ctrl-btn" onClick={onReact} id="ctrl-reactions" title="Reactions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 13s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <span>Reactions</span>
        </button>
      </div>

      <div className="controls-right">
        <button className="end-btn" onClick={onEndMeeting} id="ctrl-end-meeting">
          End
        </button>
      </div>
    </div>
  );
}
