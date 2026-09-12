import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "JoinMeeting">;

export default function JoinMeetingScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [meetingId, setMeetingId] = useState(route.params?.meetingId || "");
  const [displayName, setDisplayName] = useState(user?.full_name || "Guest Participant");
  const [noAudio, setNoAudio] = useState(false);
  const [noVideo, setNoVideo] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      // Extract numbers or clean format
      const cleaned = text.trim();
      setMeetingId(cleaned);
    }
  };

  const handleJoin = async () => {
    const rawId = meetingId.trim().replace(/\s/g, "");
    if (!rawId) {
      Alert.alert("Required", "Please enter a valid Meeting ID.");
      return;
    }
    if (!displayName.trim()) {
      Alert.alert("Required", "Please enter your display name.");
      return;
    }

    setLoading(true);
    try {
      // Call join API to verify and record participant
      const res = await api.joinMeeting(rawId, displayName.trim());

      navigation.navigate("MeetingRoom", {
        meetingId: res.meeting.meeting_id,
        displayName: displayName.trim(),
        isHost: res.participant.is_host,
        initialMuted: noAudio,
        initialCameraOff: noVideo,
      });
    } catch (err: any) {
      // Even if API returns 404 or backend is sleeping, allow joining the room directly
      Alert.alert(
        "Join Room",
        `${err.message || "Meeting not found in database."} Do you still want to enter room ${rawId}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enter Anyway",
            onPress: () => {
              navigation.navigate("MeetingRoom", {
                meetingId: rawId,
                displayName: displayName.trim(),
                isHost: false,
                initialMuted: noAudio,
                initialCameraOff: noVideo,
              });
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join a Meeting</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Form */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Meeting ID or Personal Link</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 123-4567-8901"
              placeholderTextColor={colors.textMuted}
              value={meetingId}
              onChangeText={setMeetingId}
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
              <Text style={styles.pasteBtnText}>Paste</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />
        </View>

        <TouchableOpacity
          style={[styles.joinBtn, loading && styles.disabledBtn]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.joinBtnText}>Join Meeting</Text>
          )}
        </TouchableOpacity>

        {/* Join Options */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Join Options</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Don't connect to audio</Text>
              <Text style={styles.toggleSubtitle}>Microphone will be muted upon entry</Text>
            </View>
            <Switch
              value={noAudio}
              onValueChange={setNoAudio}
              trackColor={{ false: colors.inputBg, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Turn off my video</Text>
              <Text style={styles.toggleSubtitle}>Camera will be off upon entry</Text>
            </View>
            <Switch
              value={noVideo}
              onValueChange={setNoVideo}
              trackColor={{ false: colors.inputBg, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    height: 52,
    color: colors.text,
    fontSize: 16,
  },
  pasteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.cardSecondary,
    borderRadius: 8,
    marginLeft: 8,
  },
  pasteBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  joinBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginVertical: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
