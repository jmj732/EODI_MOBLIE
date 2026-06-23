import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo } from "react";

import { useAuthStore } from "@/stores/auth-store";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="index" options={{ title: "어디" }} />
        <Stack.Screen name="auth/callback" options={{ title: "로그인 처리" }} />
        <Stack.Screen name="item/[id]" options={{ headerBackTitle: "돌아가기" }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
