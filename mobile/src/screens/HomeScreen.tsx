import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../context/AuthContext";
import { api, Meeting } from "../api/client";
import { colors } from "../theme/colors";
import { RootStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, apiBaseUrl } = useAuth();
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [copiedPMID, setCopiedPMID] = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      const data = await api.getUpcoming();
      setUpcoming(data);
    } catch (e) {
      console.warn("Error fetching meetings:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeetings();
  };

  const handleNewMeeting = async () => {
    setCreatingMeeting(true);
    const hostName = user?.full_name || "Host";
    try {
      const meeting = await api.createInstantMeeting("Instant Meeting", hostName);
      navigation.navigate("MeetingRoom", {
        meetingId: meeting.meeting_id,
        displayName: hostName,
        isHost: true,
      });
    } catch (err: any) {
      Alert.alert("Meeting Creation Error", err.message || "Failed to start instant meeting.");
    } finally {
      setCreatingMeeting(false);
    }
  };

  const handleStartPersonalRoom = async () => {
    const pmid = user?.personal_meeting_id?.replace(/\s/g, "") || "1234567890";
    const hostName = user?.full_name || "Host";
    navigation.navigate("MeetingRoom", {
      meetingId: pmid,
      displayName: hostName,
      isHost: true,
    });
  };

  const copyPMID = async () => {
    const pmid = user?.personal_meeting_id || "789 456 1230";
    await Clipboard.setStringAsync(pmid.replace(/\s/g, ""));
    setCopiedPMID(true);
    setTimeout(() => setCopiedPMID(false), 2000);
  };

  const sharePMID = async () => {
    const pmid = user?.personal_meeting_id || "789 456 1230";
    const hostName = user?.full_name || "Host";
    try {
      await Share.share({
        message: `Join ${hostName}'s Zoop meeting room!\nMeeting ID: ${pmid}`,
      });
    } catch (e) { }
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

  const formatMeetingTime = (dateStr: string | null) => {
    if (!dateStr) return "Today";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingText}>
            {user ? `Hello, ${user.full_name.split(" ")[0]}` : "Welcome to Zoop"}
          </Text>
          <View style={styles.backendBadge}>
            <View style={styles.backendDot} />
            <Text style={styles.backendText} numberOfLines={1}>
              {apiBaseUrl.includes("render") ? "Render Cloud" : "Local Server"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.avatarBadge}
          onPress={() => (navigation as any).navigate("Settings")}
        >
          <Text style={styles.avatarText}>{getInitials(user?.full_name)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* 4 Quick Actions Grid (Zoom Signature) */}
        <View style={styles.actionGrid}>
          {/* New Meeting (Orange) */}
          <TouchableOpacity
            style={styles.actionCol}
            onPress={handleNewMeeting}
            disabled={creatingMeeting}
          >
            <View style={[styles.actionBtn, { backgroundColor: colors.orange }]}>
              {creatingMeeting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="videocam" size={28} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.actionLabel}>New Meeting</Text>
          </TouchableOpacity>

          {/* Join (Blue) */}
          <TouchableOpacity
            style={styles.actionCol}
            onPress={() => navigation.navigate("JoinMeeting")}
          >
            <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel}>Join</Text>
          </TouchableOpacity>

          {/* Schedule (Blue) */}
          <TouchableOpacity
            style={styles.actionCol}
            onPress={() => navigation.navigate("ScheduleMeeting")}
          >
            <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="calendar-outline" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel}>Schedule</Text>
          </TouchableOpacity>

          {/* Share Screen */}
          <TouchableOpacity
            style={styles.actionCol}
            onPress={() => navigation.navigate("JoinMeeting")}
          >
            <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="arrow-up-circle-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel}>Share Screen</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Meeting ID Card */}
        {user && (
          <View style={styles.pmidCard}>
            <View style={styles.pmidHeader}>
              <View style={styles.pmidIconBox}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pmidTitle}>Personal Meeting ID (PMI)</Text>
                <Text style={styles.pmidNumber}>{user.personal_meeting_id || "789 456 1230"}</Text>
              </View>
            </View>

            <View style={styles.pmidActionsRow}>
              <TouchableOpacity style={styles.pmidBtn} onPress={copyPMID}>
                <Ionicons
                  name={copiedPMID ? "checkmark" : "copy-outline"}
                  size={16}
                  color={copiedPMID ? colors.green : colors.textSecondary}
                />
                <Text style={[styles.pmidBtnText, copiedPMID && { color: colors.green }]}>
                  {copiedPMID ? "Copied" : "Copy ID"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pmidBtn} onPress={sharePMID}>
                <Ionicons name="share-social-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.pmidBtnText}>Send Invite</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.pmidBtn, styles.pmidStartBtn]} onPress={handleStartPersonalRoom}>
                <Ionicons name="play" size={14} color="#FFFFFF" />
                <Text style={styles.pmidStartText}>Start Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Upcoming Meetings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate("Meetings")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          ) : upcoming.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-clear-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Upcoming Meetings</Text>
              <Text style={styles.emptySubtitle}>Schedule a meeting or start an instant one anytime.</Text>
            </View>
          ) : (
            upcoming.slice(0, 4).map((meeting) => (
              <View key={meeting.meeting_id} style={styles.meetingCard}>
                <View style={styles.meetingTimeCol}>
                  <Text style={styles.meetingTimeText}>{formatMeetingTime(meeting.scheduled_at)}</Text>
                  <Text style={styles.meetingDurationText}>{meeting.duration_minutes}m</Text>
                </View>

                <View style={styles.meetingInfoCol}>
                  <Text style={styles.meetingCardTitle} numberOfLines={1}>
                    {meeting.title}
                  </Text>
                  <Text style={styles.meetingCardHost}>Host: {meeting.host_name}</Text>
                  <Text style={styles.meetingCardId}>ID: {meeting.meeting_id}</Text>
                </View>

                <TouchableOpacity
                  style={styles.meetingStartBtn}
                  onPress={() =>
                    navigation.navigate("MeetingRoom", {
                      meetingId: meeting.meeting_id,
                      displayName: user?.full_name || "Guest",
                      isHost: user?.full_name === meeting.host_name,
                    })
                  }
                >
                  <Text style={styles.meetingStartBtnText}>Start</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  backendBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  backendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
    marginRight: 6,
  },
  backendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  actionCol: {
    alignItems: "center",
    width: "23%",
  },
  actionBtn: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    textAlign: "center",
  },
  pmidCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 24,
  },
  pmidHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  pmidIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pmidTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  pmidNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  pmidActionsRow: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    justifyContent: "space-between",
    alignItems: "center",
  },
  pmidBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.cardSecondary,
  },
  pmidBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    marginLeft: 6,
  },
  pmidStartBtn: {
    backgroundColor: colors.primary,
  },
  pmidStartText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 28,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  meetingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  meetingTimeCol: {
    width: 60,
    marginRight: 10,
  },
  meetingTimeText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  meetingDurationText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  meetingInfoCol: {
    flex: 1,
  },
  meetingCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  meetingCardHost: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  meetingCardId: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  meetingStartBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  meetingStartBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
