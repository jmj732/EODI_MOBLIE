import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { logout as logoutApi } from "@/api/auth";
import { getIntroduce } from "@/api/introduce";
import { MarkdownContent } from "@/components/markdown-content";
import { useAuthStore } from "@/stores/auth-store";
import { colors, radius, shadow, typography } from "@/theme";
import { confirmDestructive } from "@/utils/confirm";

const HELP_ROWS = [
  { title: "분실물은 어디서 받나요?", body: "승인 후 방문 예정일에 생활부 또는 안내받은 보관 장소로 방문하세요." },
  { title: "요청을 잘못 보냈어요", body: "대기 상태의 요청은 내 요청 탭에서 취소할 수 있습니다." },
  { title: "상점 지급은 어디서 처리하나요?", body: "상점 지급은 관리자 기능에서 별도로 처리합니다." },
];

export default function MoreScreen() {
  const queryClient = useQueryClient();
  const { user, accessToken, clearSession } = useAuthStore();
  const introduce = useQuery({
    queryKey: ["introduce"],
    queryFn: getIntroduce,
  });

  const handleLogout = () => {
    confirmDestructive({
      title: "로그아웃",
      message: "현재 계정에서 로그아웃할까요?",
      confirmText: "로그아웃",
      onConfirm: async () => {
        await clearSession();
        queryClient.clear();
        if (accessToken) {
          void logoutApi(accessToken).catch(() => {
            // Local logout is already complete.
          });
        }
      },
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.appBg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }}
    >
      <View style={{ gap: 5 }}>
        <Text style={{ ...typography.h1, color: colors.textMain }}>더보기</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSub }}>계정 정보와 서비스 안내를 확인합니다.</Text>
      </View>

      <View
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: radius.card,
          padding: 16,
          gap: 14,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadow,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              backgroundColor: colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" color={colors.primary} size={25} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: colors.textMain }}>{user?.name ?? "사용자"}</Text>
            <Text style={{ fontSize: 13, color: colors.textSub }} numberOfLines={1}>
              {user?.email ?? "이메일 없음"}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <InfoPill label={user?.role ?? "USER"} tone="primary" />
          {user?.studentCode ? <InfoPill label={`학번 ${user.studentCode}`} tone="neutral" /> : null}
        </View>
      </View>

      {introduce.data?.content ? (
        <SectionCard icon="information-circle-outline" title="서비스 소개">
          <MarkdownContent content={introduce.data.content} />
        </SectionCard>
      ) : null}

      <SectionCard icon="help-circle-outline" title="도움말">
        <View style={{ gap: 12 }}>
          {HELP_ROWS.map((row) => (
            <View key={row.title} style={{ gap: 3 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.textMain }}>{row.title}</Text>
              <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSub }}>{row.body}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => ({
          minHeight: 52,
          borderRadius: radius.button,
          backgroundColor: colors.dangerBg,
          borderWidth: 1,
          borderColor: "#FECACA",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <Ionicons name="log-out-outline" color={colors.danger} size={20} />
        <Text style={{ fontSize: 15, fontWeight: "900", color: colors.danger }}>로그아웃</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoPill({ label, tone }: { label: string; tone: "primary" | "neutral" }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: radius.chip,
        backgroundColor: tone === "primary" ? colors.primaryBg : "#F3F4F6",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "800", color: tone === "primary" ? colors.primary : colors.textSub }}>
        {label}
      </Text>
    </View>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name={icon} color={colors.accent} size={20} />
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textMain }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
