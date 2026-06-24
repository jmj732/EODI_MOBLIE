import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoleGate } from "@/components/role-gate";
import { colors } from "@/theme";

export default function UserLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <RoleGate roles={["USER"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.appBg, paddingTop: insets.top },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
          tabBarStyle: {
            height: 54 + bottomInset,
            paddingTop: 7,
            paddingBottom: bottomInset,
            borderTopColor: colors.border,
            backgroundColor: colors.cardBg,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen
          name="find"
          options={{
            title: "찾기",
            tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="claims"
          options={{
            title: "내 요청",
            tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "더보기",
            tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="mypage" options={{ href: null }} />
      </Tabs>
    </RoleGate>
  );
}
