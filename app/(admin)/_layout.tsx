import { Tabs } from "expo-router";

import { RoleGate } from "@/components/role-gate";

export default function AdminLayout() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <Tabs>
        <Tabs.Screen name="manage" options={{ title: "관리" }} />
        <Tabs.Screen name="claims" options={{ title: "회수 요청" }} />
        <Tabs.Screen name="disposal" options={{ title: "폐기" }} />
        <Tabs.Screen name="mypage" options={{ title: "내 정보" }} />
      </Tabs>
    </RoleGate>
  );
}
