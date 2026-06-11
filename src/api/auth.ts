import axios from "axios";

import { apiBaseUrl, authCallbackUrl } from "@/config/env";
import type { DevLoginRequest, MobileAuthorizeResponse, MobileTokenResponse } from "@/types/auth";

const authClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12000,
});

export async function requestMobileBsmAuthorize(redirectUri = authCallbackUrl) {
  const response = await authClient.get<MobileAuthorizeResponse>("/auth/mobile/bsm/authorize", {
    params: { redirectUri },
  });
  return response.data;
}

export async function exchangeOneTimeToken(oneTimeToken: string) {
  const response = await authClient.post<MobileTokenResponse>("/auth/mobile/exchange", {
    oneTimeToken,
  });
  return response.data;
}

export async function refreshMobileToken(refreshToken: string) {
  const response = await authClient.post<MobileTokenResponse>("/auth/mobile/refresh", {
    refreshToken,
  });
  return response.data;
}

export async function devLogin(request: DevLoginRequest) {
  const response = await authClient.post<MobileTokenResponse>("/auth/dev-login", request);
  return response.data;
}

export async function fetchMe(accessToken: string) {
  const response = await authClient.get<MobileTokenResponse["user"]>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
}
