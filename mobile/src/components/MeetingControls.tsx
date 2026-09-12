import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOn: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onOpenParticipants: () => void;
  onOpenChat: () => void;
  onShare: () => void;
  participantCount: number;
  hasUnreadChat: boolean;
}

export default function MeetingControls({
  isMuted,
  isVideoOn,
  onToggleMute,
  onToggleVideo,
  onOpenParticipants,
  onOpenChat,
  onShare,
  participantCount,
  hasUnreadChat,
}: MeetingControlsProps) {
  return (
    <View style={styles.container}>
      {/* Mute Button */}
      <TouchableOpacity style={styles.controlBtn} onPress={onToggleMute}>
        <View style={[styles.iconBox, isMuted && styles.inactiveIconBox]}>
          <Ionicons
            name={isMuted ? "mic-off" : "mic"}
            size={22}
            color={isMuted ? colors.red : "#FFFFFF"}
          />
        </View>
        <Text style={[styles.controlLabel, isMuted && { color: colors.red }]}>
          {isMuted ? "Unmute" : "Mute"}
        </Text>
      </TouchableOpacity>

      {/* Video Button */}
      <TouchableOpacity style={styles.controlBtn} onPress={onToggleVideo}>
        <View style={[styles.iconBox, !isVideoOn && styles.inactiveIconBox]}>
          <Ionicons
            name={isVideoOn ? "videocam" : "videocam-off"}
            size={22}
            color={!isVideoOn ? colors.red : "#FFFFFF"}
          />
        </View>
        <Text style={[styles.controlLabel, !isVideoOn && { color: colors.red }]}>
          {isVideoOn ? "Stop Video" : "Start Video"}
        </Text>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity style={styles.controlBtn} onPress={onShare}>
        <View style={[styles.iconBox, { backgroundColor: colors.greenLight }]}>
          <Ionicons name="share-outline" size={22} color={colors.green} />
        </View>
        <Text style={[styles.controlLabel, { color: colors.green }]}>Share</Text>
      </TouchableOpacity>

      {/* Participants Button */}
      <TouchableOpacity style={styles.controlBtn} onPress={onOpenParticipants}>
        <View style={styles.iconBox}>
          <Ionicons name="people-outline" size={22} color="#FFFFFF" />
          {participantCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{participantCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.controlLabel}>Participants</Text>
      </TouchableOpacity>

      {/* Chat Button */}
      <TouchableOpacity style={styles.controlBtn} onPress={onOpenChat}>
        <View style={styles.iconBox}>
          <Ionicons name="chatbubbles-outline" size={22} color="#FFFFFF" />
          {hasUnreadChat && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.controlLabel}>Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(22, 24, 30, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingBottom: 28,
  },
  controlBtn: {
    alignItems: "center",
    minWidth: 58,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    position: "relative",
  },
  inactiveIconBox: {
    backgroundColor: colors.redLight,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  unreadDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
});
