import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { routeForRole } from "@/components/role-gate";
import { useAuthStore } from "@/stores/auth-store";

type LegacyRoleRedirectProps = {
  userPath?: string;
  adminPath?: string;
};

export function LegacyRoleRedirect({ userPath, adminPath }: LegacyRoleRedirectProps) {
  const { status, user } = useAuthStore();

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  if (user.role === "ADMIN" && adminPath) {
    return <Redirect href={adminPath} />;
  }

  if (user.role === "USER" && userPath) {
    return <Redirect href={userPath} />;
  }

  return <Redirect href={routeForRole(user.role)} />;
}
