import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { devLogin, exchangeOneTimeToken, getMobileBsmStartUrl } from "@/api/auth";
import { searchItems } from "@/api/items";
import { AppButton } from "@/components/app-button";
import { routeForRole } from "@/components/role-gate";
import { authCallbackUrl, isDevApp } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";
import { colors, radius, shadow, typography } from "@/theme";
import type { Role } from "@/types/auth";
import type { ItemSummary } from "@/types/item";
import { normalizeImageUrl } from "@/utils/image";

export default function LandingScreen() {
  const { status, user, setSession } = useAuthStore();
  const [loading, setLoading] = useState<Role | "bsm" | null>(null);

  const { data: disposalData, isLoading: disposalLoading } = useQuery({
    queryKey: ["items", "disposal", "public"],
    queryFn: () => searchItems({ status: ["TO_BE_DISCARDED"], size: 8, sort: "LATEST" }),
  });
  const disposalItems = disposalData?.items ?? [];

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(routeForRole(user.role));
    }
  }, [status, user]);

  const handleBsmLogin = async () => {
    setLoading("bsm");
    try {
      const result = await WebBrowser.openAuthSessionAsync(getMobileBsmStartUrl(authCallbackUrl), authCallbackUrl);
      if (result.type !== "success") return;

      const parsed = Linking.parse(result.url);
      const oneTimeToken = getQueryValue(parsed.queryParams?.oneTimeToken);
      if (!oneTimeToken) throw new Error("로그인 토큰을 찾을 수 없습니다.");

      const session = await exchangeOneTimeToken(oneTimeToken);
      await setSession(session);
      router.replace(routeForRole(session.user.role));
    } catch (error) {
      Alert.alert("로그인 실패", error instanceof Error ? error.message : "다시 시도해주세요.");
    } finally {
      setLoading(null);
    }
  };

  const handleDevLogin = async (role: Role) => {
    setLoading(role);
    try {
      const session = await devLogin({ role });
      await setSession(session);
      router.replace(routeForRole(session.user.role));
    } catch (error) {
      Alert.alert("개발 로그인 실패", error instanceof Error ? error.message : "dev 서버를 확인해주세요.");
    } finally {
      setLoading(null);
    }
  };

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.appBg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.appBg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 20 }}>
          <LandingHero onFind={() => router.push("/browse")} onLogin={handleBsmLogin} loginLoading={loading === "bsm"} />

          {isDevApp ? <DevLoginPanel loading={loading} onLogin={handleDevLogin} /> : null}

          <SectionHeader title="폐기 직전 분실물" action="전체 보기" onPress={() => router.push("/browse")} />
          <DisposalPreview items={disposalItems} loading={disposalLoading} />

          <View style={{ gap: 12 }}>
            <Text style={{ ...typography.h2, color: colors.textMain }}>분실물 되찾기</Text>
            <StepRow index={1} title="검색" description="물품명, 카테고리로 분실물을 찾습니다." />
            <StepRow index={2} title="회수 요청" description="상세 화면에서 방문 예정일을 선택합니다." />
            <StepRow index={3} title="승인 후 수령" description="생활부 승인 후 지정 날짜에 방문합니다." />
          </View>

          <ContactPanel />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LandingHero({
  onFind,
  onLogin,
  loginLoading,
}: {
  onFind: () => void;
  onLogin: () => void;
  loginLoading: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: 24,
        padding: 22,
        gap: 18,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadow,
      }}
    >
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>EODI</Text>
        <Text style={{ fontSize: 30, lineHeight: 37, fontWeight: "800", color: colors.textMain }}>
          분실물을 찾고{"\n"}회수까지 한 번에
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSub }}>
          접수된 분실물을 확인하고, 본인 물건은 회수 요청을 보낼 수 있습니다.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <AppButton title="분실물 찾기" variant="secondary" onPress={onFind} />
        </View>
        <View style={{ flex: 1 }}>
          <AppButton title="BSM 로그인" onPress={onLogin} loading={loginLoading} />
        </View>
      </View>
    </View>
  );
}

function DevLoginPanel({
  loading,
  onLogin,
}: {
  loading: Role | "bsm" | null;
  onLogin: (role: Role) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: "#FFF7ED",
        borderRadius: radius.card,
        padding: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: "#FED7AA",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#9A3412" }}>개발 로그인</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["USER", "ADMIN"] as Role[]).map((role) => (
          <View key={role} style={{ flex: 1 }}>
            <AppButton
              title={role}
              variant="secondary"
              onPress={() => onLogin(role)}
              loading={loading === role}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={{ ...typography.h2, color: colors.textMain }}>{title}</Text>
      {action && onPress ? (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DisposalPreview({ items, loading }: { items: ItemSummary[]; loading: boolean }) {
  if (loading) {
    return (
      <View style={{ height: 132, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: radius.card,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 14, color: colors.textSub }}>폐기 예정인 분실물이 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => String(item.id)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingRight: 20 }}
      renderItem={({ item }) => <DisposalCard item={item} />}
    />
  );
}

function DisposalCard({ item }: { item: ItemSummary }) {
  const imageUrl = normalizeImageUrl(item.image);

  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      style={{
        width: 158,
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 92 }} resizeMode="cover" />
      ) : (
        <View
          style={{
            width: "100%",
            height: 92,
            backgroundColor: "#E5E7EB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 12, color: colors.textMuted }}>이미지 없음</Text>
        </View>
      )}
      <View style={{ padding: 10, gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textMain }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSub }} numberOfLines={1}>
          {item.category} · {item.foundAt}
        </Text>
      </View>
    </Pressable>
  );
}

function StepRow({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 12,
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.primaryBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "800", color: colors.primary }}>{index}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textMain }}>{title}</Text>
        <Text style={{ fontSize: 13, lineHeight: 18, color: colors.textSub }}>{description}</Text>
      </View>
    </View>
  );
}

function ContactPanel() {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 18, gap: 6 }}>
      <FooterRow label="생활부" value="3-1 박가은, 2-1 김가은" />
      <FooterRow label="관리자" value="3-1 이하은" />
      <FooterRow label="학생기숙사부" value="진예빈, 송지훈 선생님" />
    </View>
  );
}

function FooterRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSub, width: 72 }}>{label}</Text>
      <Text style={{ fontSize: 12, color: colors.textMuted, flex: 1 }}>{value}</Text>
    </View>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}
