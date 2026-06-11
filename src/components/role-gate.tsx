import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/auth";

type RoleGateProps = {
  roles: Role[];
  children: ReactNode;
};

export function RoleGate({ roles, children }: RoleGateProps) {
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

  if (!roles.includes(user.role)) {
    return <Redirect href={routeForRole(user.role)} />;
  }

  return children;
}

export function routeForRole(role: Role) {
  if (role === "ADMIN") return "/(admin)/manage";
  if (role === "TEACHER") return "/(teacher)/point";
  return "/(user)";
}
