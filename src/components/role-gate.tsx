import { usePathname, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/auth";

type RoleGateProps = {
  roles: Role[];
  children: ReactNode;
};

export function RoleGate({ roles, children }: RoleGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useAuthStore();
  const allowed = !!user && roles.includes(user.role);

  useEffect(() => {
    if (status === "loading" || allowed) return;

    const nextPath = user ? routeForRole(user.role) : "/";
    if (pathname !== nextPath) {
      router.replace(nextPath);
    }
  }, [allowed, pathname, router, status, user]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return children;
}

export function routeForRole(role: Role) {
  if (role === "ADMIN") return "/admin/manage";
  return "/user/find";
}
