import React from "react";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { colors } from "./src/theme/colors";

export default function App() {
  const { width, height } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 500;
  const desktopHeight = Math.min(900, height * 0.95);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={styles.outerContainer}>
          <View
            style={[
              styles.phoneFrame,
              isDesktop && [styles.desktopFrame, { height: desktopHeight }],
            ]}
          >
            <NavigationContainer
              theme={{
                dark: true,
                colors: {
                  primary: colors.primary,
                  background: colors.background,
                  card: colors.card,
                  text: colors.text,
                  border: colors.cardBorder,
                  notification: colors.orange,
                },
                fonts: {
                  regular: { fontFamily: "System", fontWeight: "400" },
                  medium: { fontFamily: "System", fontWeight: "500" },
                  bold: { fontFamily: "System", fontWeight: "700" },
                  heavy: { fontFamily: "System", fontWeight: "900" },
                },
              }}
            >
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </View>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#0A0B0E",
    alignItems: "center",
    justifyContent: "center",
  },
  phoneFrame: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  desktopFrame: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: "#252933",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
  },
});
