import { useQueryClient } from "@tanstack/react-query";

import { logout as logoutApi } from "@/api/auth";
import { AppButton } from "@/components/app-button";
import { InfoCard } from "@/components/info-card";
import { Screen } from "@/components/screen";
import { useAuthStore } from "@/stores/auth-store";

export function ProfileScreen() {
  const queryClient = useQueryClient();
  const { user, accessToken, clearSession } = useAuthStore();

  const logout = async () => {
    await clearSession();
    queryClient.clear();
    if (accessToken) {
      void logoutApi(accessToken).catch(() => {
        // Local logout is already complete.
      });
    }
  };

  return (
    <Screen title="내 정보">
      <InfoCard title="이름" value={user?.name ?? "-"} detail={user?.email ?? ""} />
      <InfoCard title="역할" value={user?.role ?? "-"} detail={`학번 ${user?.studentCode ?? "-"}`} />
      <AppButton title="로그아웃" variant="danger" onPress={logout} />
    </Screen>
  );
}
