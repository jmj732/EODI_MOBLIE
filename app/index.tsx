import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { devLogin, exchangeOneTimeToken, getMobileBsmStartUrl } from "@/api/auth";
import { searchItems } from "@/api/items";
import { AppButton } from "@/components/app-button";
import { FeedbackBanner, type FeedbackMessage } from "@/components/feedback-banner";
import { routeForRole } from "@/components/role-gate";
import { authCallbackUrl, isDevApp } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";
import { colors, radius, shadow, typography } from "@/theme";
import type { Role } from "@/types/auth";
import type { ItemSummary } from "@/types/item";
import { normalizeImageUrl } from "@/utils/image";

const GUIDE_STEPS = [
  { icon: "search-outline", title: "검색", body: "등록된 분실물을 이름, 종류, 장소로 찾습니다." },
  { icon: "calendar-outline", title: "방문일 선택", body: "내 물건이면 방문 예정일을 선택해 회수 요청을 보냅니다." },
  { icon: "checkmark-circle-outline", title: "승인 후 수령", body: "승인 상태를 확인하고 지정 장소에서 수령합니다." },
] satisfies { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[];

export default function LandingScreen() {
  const { status, user, setSession } = useAuthStore();
  const [loading, setLoading] = useState<Role | "bsm" | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const expiring = useQuery({
    queryKey: ["items", "landing", "to-be-discarded"],
    queryFn: () => searchItems({ status: ["TO_BE_DISCARDED"], page: 1, size: 8, sort: "LATEST" }),
  });

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
      setFeedback({ tone: "error", title: "로그인 실패", message: error instanceof Error ? error.message : "다시 시도해주세요." });
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
      setFeedback({ tone: "error", title: "개발 로그인 실패", message: error instanceof Error ? error.message : "dev 서버를 확인해주세요." });
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
      <ScrollView contentContainerStyle={{ paddingBottom: 34 }}>
        <Hero onBrowse={() => router.push("/browse")} onLogin={handleBsmLogin} loginLoading={loading === "bsm"} />

        <View style={{ padding: 16, gap: 16 }}>
          <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />
          {isDevApp ? <DevLoginPanel loading={loading} onLogin={handleDevLogin} /> : null}

          <View style={{ gap: 10 }}>
            <SectionHeader title="폐기 예정 물품" action="둘러보기" onPress={() => router.push("/browse")} />
            <ExpiringPreview items={expiring.data?.content ?? []} loading={expiring.isLoading} />
          </View>

          <View style={{ gap: 10 }}>
            <SectionHeader title="이용 흐름" />
            {GUIDE_STEPS.map((step) => (
              <GuideRow key={step.title} icon={step.icon} title={step.title} body={step.body} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Hero({
  onBrowse,
  onLogin,
  loginLoading,
}: {
  onBrowse: () => void;
  onLogin: () => void;
  loginLoading: boolean;
}) {
  return (
    <View
      style={{
        minHeight: 360,
        paddingHorizontal: 20,
        paddingTop: 26,
        paddingBottom: 22,
        justifyContent: "space-between",
        backgroundColor: colors.primaryDark,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image source={require("../assets/icon.png")} style={{ width: 34, height: 34, borderRadius: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#FFFFFF" }}>어디</Text>
        </View>
        <Pressable
          onPress={onBrowse}
          style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.chip, backgroundColor: "rgba(255,255,255,0.14)" }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>둘러보기</Text>
        </Pressable>
      </View>

      <View style={{ gap: 14 }}>
        <Text style={{ fontSize: 34, lineHeight: 42, fontWeight: "900", color: "#FFFFFF" }}>
          학교 분실물,{"\n"}찾고 신청까지.
        </Text>
        <Text style={{ fontSize: 15, lineHeight: 23, color: "#DBEAFE" }}>
          등록된 물품을 바로 검색하고 본인 물건은 앱에서 회수 요청을 보낼 수 있습니다.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <AppButton title="BSM으로 시작" icon="log-in-outline" onPress={onLogin} loading={loginLoading} />
        <AppButton title="로그인 없이 분실물 보기" icon="search-outline" variant="secondary" onPress={onBrowse} />
      </View>
    </View>
  );
}

function DevLoginPanel({ loading, onLogin }: { loading: Role | "bsm" | null; onLogin: (role: Role) => void }) {
  return (
    <View
      style={{
        backgroundColor: colors.warningBg,
        borderRadius: radius.card,
        padding: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: "#FDE68A",
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "900", color: colors.warning }}>개발 로그인</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["USER", "ADMIN"] as Role[]).map((role) => (
          <View key={role} style={{ flex: 1 }}>
            <AppButton title={role} variant="secondary" onPress={() => onLogin(role)} loading={loading === role} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={{ ...typography.h2, color: colors.textMain }}>{title}</Text>
      {action && onPress ? (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={{ fontSize: 13, fontWeight: "900", color: colors.primary }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ExpiringPreview({ items, loading }: { items: ItemSummary[]; loading: boolean }) {
  if (loading) {
    return (
      <View style={{ height: 142, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ padding: 18, borderRadius: radius.card, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border }}>
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
      contentContainerStyle={{ gap: 12, paddingRight: 16 }}
      renderItem={({ item }) => <ExpiringCard item={item} />}
    />
  );
}

function ExpiringCard({ item }: { item: ItemSummary }) {
  const imageUrl = normalizeImageUrl(item.image);

  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      style={{
        width: 166,
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
        ...shadow,
      }}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 94 }} resizeMode="cover" />
      ) : (
        <View style={{ height: 94, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2F7" }}>
          <Ionicons name="image-outline" color={colors.textMuted} size={24} />
        </View>
      )}
      <View style={{ padding: 11, gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: "900", color: colors.textMain }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSub }} numberOfLines={1}>
          {item.category} · {item.foundAt}
        </Text>
      </View>
    </Pressable>
  );
}

function GuideRow({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        padding: 15,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: colors.accentBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} color={colors.accent} size={20} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 15, fontWeight: "900", color: colors.textMain }}>{title}</Text>
        <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSub }}>{body}</Text>
      </View>
    </View>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}
