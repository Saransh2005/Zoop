import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { colors } from "../theme/colors";

interface MeetingInfoModalProps {
  visible: boolean;
  onClose: () => void;
  meetingId: string;
  hostName: string;
  title: string;
  inviteLink?: string;
}

export default function MeetingInfoModal({
  visible,
  onClose,
  meetingId,
  hostName,
  title,
  inviteLink,
}: MeetingInfoModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {title || "Zoop Meeting"}
              </Text>
              <View style={styles.encryptionRow}>
                <Ionicons name="lock-closed" size={12} color={colors.green} style={{ marginRight: 4 }} />
                <Text style={styles.encryptionText}>End-to-End Encrypted</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Info Rows */}
          <View style={styles.infoGroup}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Meeting ID</Text>
              <TouchableOpacity
                style={styles.copyRow}
                onPress={() => copyText(meetingId, "id")}
              >
                <Text style={styles.infoValue}>{meetingId}</Text>
                <Ionicons
                  name={copied === "id" ? "checkmark" : "copy-outline"}
                  size={16}
                  color={copied === "id" ? colors.green : colors.primary}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Host</Text>
              <Text style={styles.infoValue}>{hostName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Passcode</Text>
              <Text style={styles.infoValue}>654321</Text>
            </View>

            {inviteLink && (
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Invite Link</Text>
                <TouchableOpacity
                  style={styles.copyRow}
                  onPress={() => copyText(inviteLink, "link")}
                >
                  <Text style={[styles.infoValue, { color: colors.primary }]} numberOfLines={1}>
                    Copy Link
                  </Text>
                  <Ionicons
                    name={copied === "link" ? "checkmark" : "copy-outline"}
                    size={16}
                    color={copied === "link" ? colors.green : colors.primary}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  encryptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  encryptionText: {
    fontSize: 11,
    color: colors.green,
    fontWeight: "600",
  },
  closeBtn: {
    padding: 4,
  },
  infoGroup: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
