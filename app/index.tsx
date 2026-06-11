import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import { devLogin, exchangeOneTimeToken, requestMobileBsmAuthorize } from "@/api/auth";
import { AppButton } from "@/components/app-button";
import { routeForRole } from "@/components/role-gate";
import { Screen } from "@/components/screen";
import { authCallbackUrl, isDevApp } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/auth";

export default function LoginScreen() {
  const { status, user, setSession } = useAuthStore();
  const [loading, setLoading] = useState<Role | "bsm" | null>(null);

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(routeForRole(user.role));
    }
  }, [status, user]);

  const handleBsmLogin = async () => {
    setLoading("bsm");
    try {
      const { url } = await requestMobileBsmAuthorize(authCallbackUrl);
      const result = await WebBrowser.openAuthSessionAsync(url, authCallbackUrl);
      if (result.type !== "success") return;

      const parsed = Linking.parse(result.url);
      const oneTimeToken = getQueryValue(parsed.queryParams?.oneTimeToken);
      if (!oneTimeToken) {
        throw new Error("로그인 토큰을 찾을 수 없습니다.");
      }

      const session = await exchangeOneTimeToken(oneTimeToken);
      await setSession(session);
      router.replace(routeForRole(session.user.role));
    } catch (error) {
      Alert.alert("로그인 실패", error instanceof Error ? error.message : "다시 시도해주세요.");
    } finally {
      setLoading(null);
    }
  };

  const handleDevLogin = async (role: Role) => {
    setLoading(role);
    try {
      const session = await devLogin({ role });
      await setSession(session);
      router.replace(routeForRole(session.user.role));
    } catch (error) {
      Alert.alert("개발 로그인 실패", error instanceof Error ? error.message : "dev 서버를 확인해주세요.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Screen title="어디" subtitle="분실물 조회, 회수 요청, 폐기 관리, 상점 지급을 처리합니다.">
      <View style={{ gap: 12 }}>
        <AppButton title="BSM으로 로그인" onPress={handleBsmLogin} loading={loading === "bsm"} />
        {isDevApp ? (
          <View style={{ gap: 8 }}>
            <Text selectable style={{ color: "#64748B", fontWeight: "700" }}>
              개발 로그인
            </Text>
            <AppButton
              title="USER"
              variant="secondary"
              onPress={() => handleDevLogin("USER")}
              loading={loading === "USER"}
            />
            <AppButton
              title="TEACHER"
              variant="secondary"
              onPress={() => handleDevLogin("TEACHER")}
              loading={loading === "TEACHER"}
            />
            <AppButton
              title="ADMIN"
              variant="secondary"
              onPress={() => handleDevLogin("ADMIN")}
              loading={loading === "ADMIN"}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}
