import { Tabs } from "expo-router";

import { RoleGate } from "@/components/role-gate";
import { colors } from "@/theme";

export default function UserLayout() {
  return (
    <RoleGate roles={["USER"]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { borderTopColor: colors.border },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "홈" }} />
        <Tabs.Screen name="find" options={{ title: "찾기" }} />
        <Tabs.Screen name="claims" options={{ title: "내 요청" }} />
        <Tabs.Screen name="more" options={{ title: "더보기" }} />
        <Tabs.Screen name="mypage" options={{ href: null }} />
      </Tabs>
    </RoleGate>
  );
}
