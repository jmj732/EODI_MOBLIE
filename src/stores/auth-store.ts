import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import type { AuthUser, MobileTokenResponse, Role } from "@/types/auth";

const ACCESS_TOKEN_KEY = "eodi.accessToken";
const REFRESH_TOKEN_KEY = "eodi.refreshToken";
const USER_KEY = "eodi.user";

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
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
    set({
      accessToken,
      refreshToken,
      user,
      status: accessToken && refreshToken && user ? "authenticated" : "anonymous",
    });
  },
  setSession: async (session) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user)),
    ]);
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      status: "authenticated",
    });
  },
  updateAccessToken: async (accessToken) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    set({ accessToken });
  },
  clearSession: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ accessToken: null, refreshToken: null, user: null, status: "anonymous" });
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
