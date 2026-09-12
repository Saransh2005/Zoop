import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { DEFAULT_API_URL } from "../api/client";
import { RootStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, apiBaseUrl, setCustomApiUrl } = useAuth();
  const [customUrl, setCustomUrl] = useState(apiBaseUrl);
  const [autoMute, setAutoMute] = useState(false);
  const [autoVideoOff, setAutoVideoOff] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  const handleSaveApiUrl = async () => {
    if (!customUrl.trim()) return;
    setIsSavingUrl(true);
    try {
      await setCustomApiUrl(customUrl.trim());
      Alert.alert("Server Updated", `API Base URL set to:\n${customUrl.trim()}`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not update server URL.");
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleResetToCloud = async () => {
    setCustomUrl(DEFAULT_API_URL);
    await setCustomApiUrl(DEFAULT_API_URL);
    Alert.alert("Reset", "Server reset to default Render cloud URL.");
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.replace("Login");
        },
      },
    ]);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{getInitials(user.full_name)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.full_name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.pmidPill}>
                <Text style={styles.pmidPillText}>PMID: {user.personal_meeting_id}</Text>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.signInPromptCard} onPress={() => navigation.navigate("Login")}>
            <View style={styles.signInPromptIcon}>
              <Ionicons name="log-in-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.signInPromptTitle}>Sign in to your account</Text>
              <Text style={styles.signInPromptSubtitle}>Access scheduled meetings and personal room ID</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Meeting Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Meeting Preferences</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.settingTitle}>Mute Mic on Join</Text>
                <Text style={styles.settingDesc}>Always start meetings with microphone muted</Text>
              </View>
              <Switch
                value={autoMute}
                onValueChange={setAutoMute}
                trackColor={{ false: colors.inputBg, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.settingTitle}>Turn Off Video on Join</Text>
                <Text style={styles.settingDesc}>Always enter meetings with camera off</Text>
              </View>
              <Switch
                value={autoVideoOff}
                onValueChange={setAutoVideoOff}
                trackColor={{ false: colors.inputBg, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Server & Connectivity Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Backend Server Configuration</Text>
          <View style={styles.settingsGroup}>
            <View style={{ padding: 14 }}>
              <Text style={styles.settingTitle}>API Base URL</Text>
              <Text style={styles.settingDesc}>
                Connect to deployed cloud or local backend IP
              </Text>
              <TextInput
                style={styles.serverInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="https://zoop-t1l7.onrender.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <View style={styles.serverActionsRow}>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.saveBtn]}
                  onPress={handleSaveApiUrl}
                  disabled={isSavingUrl}
                >
                  <Text style={styles.smallBtnText}>Save URL</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.smallBtn, styles.resetBtn]} onPress={handleResetToCloud}>
                  <Text style={[styles.smallBtnText, { color: colors.primary }]}>Use Cloud</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* App Info & Sign Out */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>About</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>1.0.0 (Expo SDK 57)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>WebRTC Signaling</Text>
              <Text style={styles.infoValue}>FastAPI WebSockets</Text>
            </View>
          </View>
        </View>

        {user && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.red} style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        )}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardSecondary,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pmidPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  pmidPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  signInPromptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 24,
  },
  signInPromptIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  signInPromptTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  signInPromptSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  serverInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 12,
    height: 44,
    color: colors.text,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  serverActionsRow: {
    flexDirection: "row",
  },
  smallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  resetBtn: {
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  smallBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
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
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.redLight,
    borderWidth: 1,
    borderColor: "rgba(229, 57, 53, 0.3)",
    borderRadius: 14,
    height: 50,
    marginTop: 10,
  },
  logoutBtnText: {
    color: colors.red,
    fontSize: 15,
    fontWeight: "600",
  },
});
