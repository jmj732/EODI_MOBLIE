import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoleGate } from "@/components/role-gate";
import { colors } from "@/theme";

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <RoleGate roles={["ADMIN"]}>
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
        <Tabs.Screen
          name="manage"
          options={{
            title: "관리",
            tabBarIcon: ({ color, size }) => <Ionicons name="file-tray-full-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="claims"
          options={{
            title: "회수",
            tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="disposal"
          options={{
            title: "폐기",
            tabBarIcon: ({ color, size }) => <Ionicons name="trash-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "더보기",
            tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="introduce" options={{ href: null }} />
        <Tabs.Screen name="mypage" options={{ href: null }} />
      </Tabs>
    </RoleGate>
  );
}
