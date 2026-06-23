import { Tabs } from "expo-router";

import { RoleGate } from "@/components/role-gate";

export default function TeacherLayout() {
  return (
    <RoleGate roles={["TEACHER"]}>
      <Tabs>
        <Tabs.Screen name="find" options={{ title: "찾기" }} />
        <Tabs.Screen name="point" options={{ title: "상점" }} />
        <Tabs.Screen name="history" options={{ title: "지급 로그" }} />
        <Tabs.Screen name="mypage" options={{ title: "내 정보" }} />
      </Tabs>
    </RoleGate>
  );
}
