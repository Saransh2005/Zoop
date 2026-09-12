import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Share,
  Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors } from "../theme/colors";
import { api, Meeting, Participant } from "../api/client";
import { meetingSocket, ChatMessage } from "../api/websocket";
import { RootStackParamList } from "../navigation/types";
import MeetingControls from "../components/MeetingControls";
import ChatModal from "../components/ChatModal";
import ParticipantsModal from "../components/ParticipantsModal";
import MeetingInfoModal from "../components/MeetingInfoModal";

type Props = NativeStackScreenProps<RootStackParamList, "MeetingRoom">;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MeetingRoomScreen({ navigation, route }: Props) {
  const {
    meetingId,
    displayName,
    isHost = false,
    initialMuted = false,
    initialCameraOff = false,
  } = route.params;

  // Media states
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isVideoOn, setIsVideoOn] = useState(!initialCameraOff);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Meeting & Participants states
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [remoteCameraStates, setRemoteCameraStates] = useState<Record<string, boolean>>({});
  const [remoteMuteStates, setRemoteMuteStates] = useState<Record<string, boolean>>({});

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: "System", text: "Welcome to the meeting! 👋", time: "now" },
  ]);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  // Modals
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  // ─── 1. Timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ─── 2. Fetch Meeting & Join Details ───────────────────────────────────────
  const loadMeetingData = useCallback(async () => {
    try {
      const m = await api.getMeeting(meetingId);
      setMeeting(m);
      if (m.participants) {
        setParticipants(m.participants);
        const selfP = m.participants.find((p) => p.display_name === displayName);
        if (selfP) setParticipantId(selfP.id);
      }
    } catch (e) {
      // Fallback dummy participant list if offline or instant room
      setParticipants([
        {
          id: 1,
          meeting_db_id: 1,
          display_name: displayName,
          joined_at: new Date().toISOString(),
          left_at: null,
          is_host: isHost,
          is_muted: isMuted,
          is_video_on: isVideoOn,
        },
      ]);
    }
  }, [meetingId, displayName, isHost, isMuted, isVideoOn]);

  useEffect(() => {
    loadMeetingData();
  }, [loadMeetingData]);

  // ─── 3. WebSocket Real-time Signaling & Chat ──────────────────────────────
  useEffect(() => {
    meetingSocket.connect(meetingId, displayName);

    const unsubChat = meetingSocket.on("CHAT_MSG", (data: any) => {
      if (data?.payload) {
        setChatMessages((prev) => [...prev, data.payload]);
        if (!chatModalVisible) {
          setHasUnreadChat(true);
        }
      }
    });

    const unsubCamera = meetingSocket.on("CAMERA_TOGGLE", (data: any) => {
      if (data?.sender) {
        setRemoteCameraStates((prev) => ({ ...prev, [data.sender]: data.isCameraOn }));
      }
    });

    const unsubMute = meetingSocket.on("MUTE_TOGGLE", (data: any) => {
      if (data?.sender) {
        setRemoteMuteStates((prev) => ({ ...prev, [data.sender]: data.isMuted }));
      }
    });

    const unsubMuteUser = meetingSocket.on("MUTE_USER", (data: any) => {
      if (data?.payload?.target === displayName) {
        setIsMuted(true);
        Alert.alert("Host Muted You", "The host has muted your microphone.");
      }
    });

    const unsubRemoveUser = meetingSocket.on("REMOVE_USER", (data: any) => {
      if (data?.payload?.target === displayName) {
        Alert.alert("Removed", "You were removed from the meeting by the host.", [
          { text: "OK", onPress: () => handleLeave(false) },
        ]);
      }
    });

    return () => {
      unsubChat();
      unsubCamera();
      unsubMute();
      unsubMuteUser();
      unsubRemoveUser();
      meetingSocket.disconnect();
    };
  }, [meetingId, displayName, chatModalVisible]);

  // ─── 4. Mute / Video Toggles ───────────────────────────────────────────────
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    meetingSocket.sendMuteToggle(next);
  };

  const handleToggleVideo = async () => {
    if (!isVideoOn) {
      // Trying to turn on video - check permission
      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          Alert.alert("Camera Permission", "Camera access is needed to turn on your video.");
          return;
        }
      }
    }
    const next = !isVideoOn;
    setIsVideoOn(next);
    meetingSocket.sendCameraToggle(next);
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === "front" ? "back" : "front"));
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn((prev) => !prev);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Zoop Meeting: ${meeting?.title || "Instant Meeting"}\nMeeting ID: ${meetingId}\nLink: ${
          meeting?.invite_link || `https://zoop-t1l7.onrender.com/meeting/${meetingId}`
        }`,
      });
    } catch (e) { }
  };

  // ─── 5. Host Actions ──────────────────────────────────────────────────────
  const handleHostMuteParticipant = (targetName: string) => {
    meetingSocket.sendMuteUser(targetName);
    Alert.alert("Muted", `Sent mute request to ${targetName}.`);
  };

  const handleHostRemoveParticipant = (targetName: string) => {
    meetingSocket.sendRemoveUser(targetName);
    setParticipants((prev) => prev.filter((p) => p.display_name !== targetName));
    Alert.alert("Removed", `${targetName} has been removed from the meeting.`);
  };

  // ─── 6. Leave / End Meeting ────────────────────────────────────────────────
  const handleLeave = async (promptUser = true) => {
    const doExit = async (endForAll: boolean) => {
      try {
        if (endForAll && isHost) {
          await api.endMeeting(meetingId);
        } else if (participantId) {
          await api.leaveMeeting(meetingId, participantId);
        }
      } catch (e) {
        console.warn("Leave meeting error:", e);
      } finally {
        meetingSocket.disconnect();
        navigation.navigate("MainTabs");
      }
    };

    if (!promptUser) {
      await doExit(false);
      return;
    }

    if (isHost) {
      Alert.alert("End Meeting", "Do you want to end the meeting for all participants, or just leave?", [
        { text: "Cancel", style: "cancel" },
        { text: "Leave Meeting", onPress: () => doExit(false) },
        { text: "End for All", style: "destructive", onPress: () => doExit(true) },
      ]);
    } else {
      Alert.alert("Leave Meeting", "Are you sure you want to leave this meeting?", [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: () => doExit(false) },
      ]);
    }
  };

  const handleSendMessage = (text: string) => {
    meetingSocket.sendChat(text);
  };

  const getInitials = (name?: string) => {
    if (!name) return "Z";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Remote participants excluding self
  const remoteParticipants = participants.filter((p) => p.display_name !== displayName);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E11" />

      {/* Top Controls Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.topIconBtn} onPress={handleToggleSpeaker}>
            <Ionicons
              name={isSpeakerOn ? "volume-high-outline" : "volume-mute-outline"}
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.topIconBtn} onPress={handleFlipCamera}>
            <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Meeting ID Dropdown Pill */}
        <TouchableOpacity style={styles.meetingPill} onPress={() => setInfoModalVisible(true)}>
          <Ionicons name="shield-checkmark" size={14} color={colors.green} style={{ marginRight: 4 }} />
          <Text style={styles.meetingPillText}>Zoop ▾</Text>
          <Text style={styles.meetingTimerText}>{formatTimer(elapsedSeconds)}</Text>
        </TouchableOpacity>

        {/* End / Leave Button */}
        <TouchableOpacity style={styles.leaveBtn} onPress={() => handleLeave(true)}>
          <Text style={styles.leaveBtnText}>{isHost ? "End" : "Leave"}</Text>
        </TouchableOpacity>
      </View>

      {/* Video Grid / Stage */}
      <View style={styles.videoStage}>
        {/* Main Local Participant Tile */}
        <View
          style={[
            styles.videoTile,
            remoteParticipants.length > 0 ? styles.splitTile : styles.fullTile,
          ]}
        >
          {isVideoOn && permission?.granted ? (
            <CameraView style={StyleSheet.absoluteFill} facing={cameraFacing} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <View style={styles.avatarRing}>
                <View style={styles.largeAvatar}>
                  <Text style={styles.largeAvatarText}>{getInitials(displayName)}</Text>
                </View>
              </View>
              <Text style={styles.cameraOffNotice}>
                {!permission?.granted ? "Camera access required" : "Camera Off"}
              </Text>
            </View>
          )}

          {/* Name Tag Pill */}
          <View style={styles.nameTag}>
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={14}
              color={isMuted ? colors.red : "#FFFFFF"}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.nameTagText}>{displayName} (You)</Text>
          </View>
        </View>

        {/* Remote Participant Tiles (if any) */}
        {remoteParticipants.slice(0, 1).map((rp) => {
          const rpCameraOn = remoteCameraStates[rp.display_name] ?? rp.is_video_on;
          const rpMuted = remoteMuteStates[rp.display_name] ?? rp.is_muted;

          return (
            <View key={rp.display_name} style={[styles.videoTile, styles.splitTile]}>
              <View style={styles.avatarPlaceholder}>
                <View style={[styles.largeAvatar, { backgroundColor: colors.orange }]}>
                  <Text style={styles.largeAvatarText}>{getInitials(rp.display_name)}</Text>
                </View>
                <Text style={styles.cameraOffNotice}>
                  {rpCameraOn ? "Live Video Stream" : "Camera Off"}
                </Text>
              </View>

              <View style={styles.nameTag}>
                <Ionicons
                  name={rpMuted ? "mic-off" : "mic"}
                  size={14}
                  color={rpMuted ? colors.red : "#FFFFFF"}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.nameTagText}>{rp.display_name}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Bottom Bar Controls */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOn={isVideoOn}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onOpenParticipants={() => setParticipantsModalVisible(true)}
        onOpenChat={() => {
          setHasUnreadChat(false);
          setChatModalVisible(true);
        }}
        onShare={handleShare}
        participantCount={participants.length}
        hasUnreadChat={hasUnreadChat}
      />

      {/* In-Meeting Chat Modal */}
      <ChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        currentUser={displayName}
      />

      {/* Participants Sheet */}
      <ParticipantsModal
        visible={participantsModalVisible}
        onClose={() => setParticipantsModalVisible(false)}
        participants={participants}
        currentUserName={displayName}
        isCurrentUserHost={isHost}
        meetingId={meetingId}
        inviteLink={meeting?.invite_link}
        onMuteParticipant={handleHostMuteParticipant}
        onRemoveParticipant={handleHostRemoveParticipant}
      />

      {/* Meeting Info Modal */}
      <MeetingInfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        meetingId={meetingId}
        hostName={meeting?.host_name || displayName}
        title={meeting?.title || "Instant Meeting"}
        inviteLink={meeting?.invite_link}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0E11",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0D0E11",
    zIndex: 10,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  meetingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  meetingPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 8,
  },
  meetingTimerText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  leaveBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  leaveBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  videoStage: {
    flex: 1,
    padding: 10,
    gap: 10,
    justifyContent: "center",
  },
  videoTile: {
    backgroundColor: "#16181E",
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  fullTile: {
    flex: 1,
  },
  splitTile: {
    flex: 1,
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    padding: 6,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(14, 113, 235, 0.3)",
    marginBottom: 12,
  },
  largeAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  largeAvatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
  },
  cameraOffNotice: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  nameTag: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  nameTagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
