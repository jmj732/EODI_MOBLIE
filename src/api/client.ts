import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { refreshMobileToken } from "@/api/auth";
import { apiBaseUrl } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12000,
});

let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const token = await refreshPromise;
    if (!token) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${token}`;
    return apiClient(originalRequest);
  },
);

async function refreshAccessToken() {
  const { refreshToken, setSession, clearSession } = useAuthStore.getState();
  if (!refreshToken) {
    await clearSession();
    return null;
  }

  try {
    const session = await refreshMobileToken(refreshToken);
    await setSession(session);
    return session.accessToken;
  } catch {
    await clearSession();
    return null;
  }
}
