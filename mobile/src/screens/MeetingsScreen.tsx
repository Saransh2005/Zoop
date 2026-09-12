import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Share,
  Alert,
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

export default function MeetingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "recent">("upcoming");
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      const [up, rec] = await Promise.all([api.getUpcoming(), api.getRecent()]);
      setUpcoming(up);
      setRecent(rec);
    } catch (e) {
      console.warn("Failed to fetch meetings:", e);
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

  const copyMeetingInvite = async (meeting: Meeting) => {
    const text = `Join Zoop Meeting: ${meeting.title}\nMeeting ID: ${meeting.meeting_id}\nInvite Link: ${meeting.invite_link}`;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Meeting invitation copied to clipboard!");
  };

  const shareMeeting = async (meeting: Meeting) => {
    try {
      await Share.share({
        message: `Join Zoop Meeting: ${meeting.title}\nMeeting ID: ${meeting.meeting_id}\nLink: ${meeting.invite_link}`,
      });
    } catch (e) { }
  };

  const currentList = activeTab === "upcoming" ? upcoming : recent;

  const renderMeetingItem = ({ item }: { item: Meeting }) => {
    const isHost = user?.full_name === item.host_name;
    const isLive = item.status === "active";
    const isEnded = item.status === "ended";

    const formattedDate = item.scheduled_at
      ? new Date(item.scheduled_at).toLocaleDateString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Now / Instant";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.meetingTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.timeText}>{formattedDate}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isLive && styles.statusLive,
              isEnded && styles.statusEnded,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isLive && { color: colors.green },
                isEnded && { color: colors.textMuted },
              ]}
            >
              {isLive ? "LIVE" : isEnded ? "ENDED" : "UPCOMING"}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="key-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.idText}>Meeting ID: {item.meeting_id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.hostText}>Host: {item.host_name}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.btn, styles.actionPrimary]}
            onPress={() =>
              navigation.navigate("MeetingRoom", {
                meetingId: item.meeting_id,
                displayName: user?.full_name || "Guest",
                isHost,
              })
            }
          >
            <Ionicons name="videocam" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnTextWhite}>{isHost ? "Start" : "Join"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.actionSecondary]} onPress={() => copyMeetingInvite(item)}>
            <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.actionSecondary]} onPress={() => shareMeeting(item)}>
            <Ionicons name="share-social-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meetings</Text>
        <TouchableOpacity onPress={() => navigation.navigate("ScheduleMeeting")}>
          <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "upcoming" && styles.activeTabBtn]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, activeTab === "upcoming" && styles.activeTabText]}>
            Upcoming ({upcoming.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "recent" && styles.activeTabBtn]}
          onPress={() => setActiveTab("recent")}
        >
          <Text style={[styles.tabText, activeTab === "recent" && styles.activeTabText]}>
            Recent ({recent.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Fetching meetings...</Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.meeting_id}
          renderItem={renderMeetingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {activeTab === "upcoming" ? "No Upcoming Meetings" : "No Past Meetings"}
              </Text>
              <Text style={styles.emptyDesc}>
                {activeTab === "upcoming"
                  ? "Tap the + icon above to schedule a new meeting."
                  : "Completed meetings will show up here."}
              </Text>
            </View>
          }
        />
      )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardSecondary,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTabBtn: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: "600",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.cardSecondary,
  },
  statusLive: {
    backgroundColor: colors.greenLight,
  },
  statusEnded: {
    backgroundColor: "rgba(107, 114, 128, 0.15)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  cardDetails: {
    marginVertical: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  idText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  hostText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  btn: {
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimary: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  actionSecondary: {
    width: 44,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 8,
  },
  btnTextWhite: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  centerContainer: {
    paddingTop: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    marginTop: 14,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
});
