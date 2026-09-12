import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScheduleMeeting">;

export default function ScheduleMeetingScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("Zoop Meeting");
  const [description, setDescription] = useState("");
  const [hostName, setHostName] = useState(user?.full_name || "Saransh Singh");
  const [duration, setDuration] = useState(60);
  const [daysOffset, setDaysOffset] = useState(0); // 0 = Today, 1 = Tomorrow, 2 = Next Day
  const [selectedHour, setSelectedHour] = useState(14); // 2:00 PM
  const [loading, setLoading] = useState(false);

  const durationOptions = [15, 30, 45, 60, 90];

  const handleSchedule = async () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please provide a meeting title.");
      return;
    }

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysOffset);
    scheduledDate.setHours(selectedHour, 0, 0, 0);

    setLoading(true);
    try {
      const meeting = await api.scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        host_name: hostName.trim() || "Host",
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes: duration,
      });

      Alert.alert(
        "Meeting Scheduled! 📅",
        `Meeting ID: ${meeting.meeting_id}\nScheduled for: ${scheduledDate.toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
        [
          { text: "Done", onPress: () => navigation.goBack() },
          {
            text: "Start Now",
            onPress: () => {
              navigation.replace("MeetingRoom", {
                meetingId: meeting.meeting_id,
                displayName: hostName.trim(),
                isHost: true,
              });
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Schedule Error", err.message || "Failed to schedule meeting.");
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
        <Text style={styles.headerTitle}>Schedule Meeting</Text>
        <TouchableOpacity onPress={handleSchedule} disabled={loading}>
          <Text style={[styles.doneBtnText, loading && { opacity: 0.5 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Topic / Title */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Meeting Topic</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Design Review & Planning"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Date Selection Chips */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.chipRow}>
            {["Today", "Tomorrow", "In 2 Days"].map((label, idx) => (
              <TouchableOpacity
                key={label}
                style={[styles.chip, daysOffset === idx && styles.activeChip]}
                onPress={() => setDaysOffset(idx)}
              >
                <Text style={[styles.chipText, daysOffset === idx && styles.activeChipText]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Hour Selection Chips */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {[9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20].map((hour) => {
              const display = hour < 12 ? `${hour}:00 AM` : hour === 12 ? `12:00 PM` : `${hour - 12}:00 PM`;
              const isSelected = selectedHour === hour;
              return (
                <TouchableOpacity
                  key={hour}
                  style={[styles.chip, isSelected && styles.activeChip]}
                  onPress={() => setSelectedHour(hour)}
                >
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{display}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Duration Selection Chips */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.chipRow}>
            {durationOptions.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, duration === d && styles.activeChip]}
                onPress={() => setDuration(d)}
              >
                <Text style={[styles.chipText, duration === d && styles.activeChipText]}>
                  {d} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Host Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Host Name</Text>
          <TextInput
            style={styles.input}
            value={hostName}
            onChangeText={setHostName}
            placeholder="Host Name"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Description / Agenda */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Agenda, notes, or discussion points..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledBtn]}
          onPress={handleSchedule}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Schedule Meeting</Text>
          )}
        </TouchableOpacity>
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
  doneBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    height: 52,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  horizontalScroll: {
    flexDirection: "row",
  },
  chip: {
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  activeChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
