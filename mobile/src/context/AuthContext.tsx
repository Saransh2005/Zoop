import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, User, STORAGE_KEYS, DEFAULT_API_URL } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  apiBaseUrl: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setCustomApiUrl: (url: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(DEFAULT_API_URL);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await api.initialize();
        const currentUrl = api.getBaseUrl();
        setApiBaseUrlState(currentUrl);

        const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const savedUserStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);

        if (savedToken) {
          setToken(savedToken);
          await api.setToken(savedToken);
          if (savedUserStr) {
            try {
              setUser(JSON.parse(savedUserStr));
            } catch { }
          }
          // Verify with /me
          try {
            const me = await api.getMe();
            setUser(me);
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(me));
          } catch (e: any) {
            if (e?.message?.includes("401") || e?.message?.toLowerCase()?.includes("unauthorized")) {
              await logout();
            }
          }
        }
      } catch (e) {
        console.warn("Auth initialization error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setToken(res.access_token);
      setUser(res.user);
      await api.setToken(res.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.signup({ full_name: fullName, email, password });
      setToken(res.access_token);
      setUser(res.user);
      await api.setToken(res.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await api.setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  };

  const setCustomApiUrl = async (url: string) => {
    await api.setBaseUrl(url);
    setApiBaseUrlState(api.getBaseUrl());
  };

  const refreshProfile = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(me));
    } catch { }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        apiBaseUrl,
        login,
        signup,
        logout,
        setCustomApiUrl,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
