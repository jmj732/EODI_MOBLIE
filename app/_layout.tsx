import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo } from "react";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/auth-store";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="browse" />
          <Stack.Screen name="item/[id]" />
          <Stack.Screen name="user" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
