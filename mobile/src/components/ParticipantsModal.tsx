import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  SafeAreaView,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { Participant } from "../api/client";

interface ParticipantsModalProps {
  visible: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUserName: string;
  isCurrentUserHost: boolean;
  meetingId: string;
  inviteLink?: string;
  onMuteParticipant?: (name: string) => void;
  onRemoveParticipant?: (name: string) => void;
}

export default function ParticipantsModal({
  visible,
  onClose,
  participants,
  currentUserName,
  isCurrentUserHost,
  meetingId,
  inviteLink,
  onMuteParticipant,
  onRemoveParticipant,
}: ParticipantsModalProps) {
  const handleInvite = async () => {
    try {
      await Share.share({
        message: `Join our Zoop meeting!\nMeeting ID: ${meetingId}\n${inviteLink ? `Link: ${inviteLink}` : ""}`,
      });
    } catch (e) { }
  };

  const handleParticipantAction = (participant: Participant) => {
    if (!isCurrentUserHost || participant.display_name === currentUserName) return;

    Alert.alert(
      participant.display_name,
      "Choose host action:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mute Participant",
          onPress: () => onMuteParticipant?.(participant.display_name),
        },
        {
          text: "Remove from Meeting",
          style: "destructive",
          onPress: () => onRemoveParticipant?.(participant.display_name),
        },
      ]
    );
  };

  const renderParticipant = ({ item }: { item: Participant }) => {
    const isMe = item.display_name === currentUserName;

    return (
      <TouchableOpacity
        style={styles.participantItem}
        onPress={() => handleParticipantAction(item)}
        activeOpacity={isCurrentUserHost && !isMe ? 0.7 : 1}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.display_name.slice(0, 2).toUpperCase()}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.display_name}
            </Text>
            {isMe && <Text style={styles.tagText}>(Me)</Text>}
            {item.is_host && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>Host</Text>
              </View>
            )}
          </View>
        </View>

        {/* Media indicators */}
        <View style={styles.indicatorsRow}>
          <Ionicons
            name={item.is_muted ? "mic-off" : "mic"}
            size={18}
            color={item.is_muted ? colors.red : colors.textSecondary}
            style={{ marginRight: 10 }}
          />
          <Ionicons
            name={item.is_video_on ? "videocam" : "videocam-off"}
            size={18}
            color={!item.is_video_on ? colors.red : colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Participants ({participants.length})</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={participants}
          keyExtractor={(item, idx) => item.id ? String(item.id) : `${item.display_name}_${idx}`}
          renderItem={renderParticipant}
          contentContainerStyle={styles.listContent}
        />

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
            <Ionicons name="person-add-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.inviteBtnText}>Invite Others</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  tagText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  hostBadge: {
    backgroundColor: colors.orangeLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  hostBadgeText: {
    color: colors.orange,
    fontSize: 10,
    fontWeight: "700",
  },
  indicatorsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    height: 48,
  },
  inviteBtnText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});
