import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";

import { exchangeOneTimeToken } from "@/api/auth";
import { routeForRole } from "@/components/role-gate";
import { Screen } from "@/components/screen";
import { useAuthStore } from "@/stores/auth-store";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ oneTimeToken?: string; error?: string }>();
  const setSession = useAuthStore((state) => state.setSession);
  const [message, setMessage] = useState("로그인을 처리하고 있습니다.");

  useEffect(() => {
    async function completeLogin() {
      if (params.error) {
        setMessage("로그인에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      if (!params.oneTimeToken) {
        setMessage("로그인 토큰이 없습니다.");
        return;
      }

      try {
        const session = await exchangeOneTimeToken(params.oneTimeToken);
        await setSession(session);
        router.replace(routeForRole(session.user.role));
      } catch {
        setMessage("로그인 토큰 교환에 실패했습니다.");
      }
    }

    void completeLogin();
  }, [params.error, params.oneTimeToken, setSession]);

  return (
    <Screen title="로그인 처리">
      <ActivityIndicator />
      <Text selectable style={{ color: "#475569", lineHeight: 22 }}>
        {message}
      </Text>
    </Screen>
  );
}
