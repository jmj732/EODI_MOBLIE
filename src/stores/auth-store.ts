import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";

import { fetchMe, refreshMobileToken } from "@/api/auth";
import type { AuthUser, MobileTokenResponse, Role } from "@/types/auth";

const ACCESS_TOKEN_KEY = "eodi.accessToken";
const REFRESH_TOKEN_KEY = "eodi.refreshToken";
const USER_KEY = "eodi.user";

const storage = {
  get: (key: string) =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  set: (key: string, value: string) =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
  del: (key: string) =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.removeItem(key))
      : SecureStore.deleteItemAsync(key),
};

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  setSession: (session: MobileTokenResponse) => Promise<void>;
  updateAccessToken: (accessToken: string) => Promise<void>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  status: "loading",
  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        storage.get(ACCESS_TOKEN_KEY),
        storage.get(REFRESH_TOKEN_KEY),
        storage.get(USER_KEY),
      ]);
      const user = parseStoredUser(userJson);

      if (userJson && !user) {
        await storage.del(USER_KEY);
      }

      if (accessToken && refreshToken && user) {
        try {
          const currentUser = await fetchMe(accessToken);
          await storage.set(USER_KEY, JSON.stringify(currentUser));
          set({ accessToken, refreshToken, user: currentUser, status: "authenticated" });
          return;
        } catch {
          try {
            const session = await refreshMobileToken(refreshToken);
            await get().setSession(session);
            return;
          } catch {
            await get().clearSession();
            return;
          }
        }
      }

      set({
        accessToken,
        refreshToken,
        user,
        status: accessToken && refreshToken && user ? "authenticated" : "anonymous",
      });
    } catch {
      set({ accessToken: null, refreshToken: null, user: null, status: "anonymous" });
    }
  },
  setSession: async (session) => {
    await Promise.all([
      storage.set(ACCESS_TOKEN_KEY, session.accessToken),
      storage.set(REFRESH_TOKEN_KEY, session.refreshToken),
      storage.set(USER_KEY, JSON.stringify(session.user)),
    ]);
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      status: "authenticated",
    });
  },
  updateAccessToken: async (accessToken) => {
    await storage.set(ACCESS_TOKEN_KEY, accessToken);
    set({ accessToken });
  },
  clearSession: async () => {
    set({ accessToken: null, refreshToken: null, user: null, status: "anonymous" });
    try {
      await Promise.all([
        storage.del(ACCESS_TOKEN_KEY),
        storage.del(REFRESH_TOKEN_KEY),
        storage.del(USER_KEY),
      ]);
    } catch {
      // In-memory logout should not be blocked by a storage cleanup failure.
    }
  },
}));

export function hasRole(user: AuthUser | null, roles: Role[]) {
  return !!user && roles.includes(user.role);
}

export function getAuthSnapshot() {
  return getSerializableAuthState(useAuthStore.getState());
}

function getSerializableAuthState(state: AuthState) {
  return {
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    user: state.user,
    status: state.status,
  };
}

function parseStoredUser(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}
