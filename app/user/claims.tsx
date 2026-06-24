import Ionicons from "@expo/vector-icons/Ionicons";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";

import { cancelClaim, getMyClaims } from "@/api/claims";
import { FeedbackBanner, type FeedbackMessage } from "@/components/feedback-banner";
import { colors, radius, shadow, typography } from "@/theme";
import type { ClaimStatus, MyClaim } from "@/types/item";
import { confirmDestructive } from "@/utils/confirm";
import { normalizeImageUrl } from "@/utils/image";

const PAGE_SIZE = 20;

export default function MyClaimsScreen() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const claims = useInfiniteQuery({
    queryKey: ["claims", "my", "infinite"] as const,
    queryFn: ({ pageParam }) => getMyClaims(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last, _pages, lastPageParam) => {
      const loaded = lastPageParam * last.size;
      if (loaded >= last.total || last.claims.length < PAGE_SIZE) return undefined;
      return lastPageParam + 1;
    },
  });

  const cancel = useMutation({
    mutationFn: cancelClaim,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["claims", "my"] });
      setFeedback({ tone: "success", title: "요청 취소 완료", message: "회수 요청이 취소되었습니다." });
    },
    onError: (error) => setFeedback({ tone: "error", title: "취소 실패", message: getCancelErrorMessage(error) }),
  });

  const data = claims.data?.pages.flatMap((page) => page.claims) ?? [];
  const totalCount = claims.data?.pages[0]?.total ?? data.length;
  const pendingCount = data.filter((claim) => claim.status === "PENDING").length;

  const handleCancel = (claimId: number) => {
    confirmDestructive({
      title: "요청 취소",
      message: "회수 요청을 취소하시겠습니까?",
      confirmText: "취소",
      onConfirm: () => cancel.mutate(claimId),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBg }}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.claimId)}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={claims.isRefetching} onRefresh={() => void claims.refetch()} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <View style={{ gap: 5 }}>
              <Text style={{ ...typography.h1, color: colors.textMain }}>내 회수 요청</Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSub }}>
                신청한 물품의 승인 상태와 방문 예정일을 확인하세요.
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <SummaryCard label="전체" value={totalCount} tone="primary" />
              <SummaryCard label="대기" value={pendingCount} tone="warning" />
            </View>
            <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />
          </View>
        }
        ListEmptyComponent={<EmptyState loading={claims.isLoading} error={claims.isError} />}
        ListFooterComponent={
          claims.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : null
        }
        onEndReached={() => {
          if (claims.hasNextPage && !claims.isFetchingNextPage) void claims.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <ClaimCard
            claim={item}
            cancelling={cancel.isPending && cancel.variables === item.claimId}
            onCancel={() => handleCancel(item.claimId)}
          />
        )}
      />
    </View>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "primary" | "warning" }) {
  const color = tone === "warning" ? colors.warning : colors.primary;
  const backgroundColor = tone === "warning" ? colors.warningBg : colors.primaryBg;

  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        borderRadius: radius.card,
        backgroundColor,
        borderWidth: 1,
        borderColor: tone === "warning" ? "#FDE68A" : "#BFDBFE",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "800", color }}>{label}</Text>
      <Text style={{ marginTop: 4, fontSize: 24, fontWeight: "900", color: colors.textMain }}>{value}</Text>
    </View>
  );
}

function ClaimCard({ claim, cancelling, onCancel }: { claim: MyClaim; cancelling: boolean; onCancel: () => void }) {
  const imageUrl = normalizeImageUrl(claim.image ?? claim.imageUrl);

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        padding: 15,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadow,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: 52, height: 52, borderRadius: 14 }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="cube-outline" color={colors.primary} size={19} />
          </View>
        )}
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textMain }} numberOfLines={2}>
            {claim.itemName}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSub }}>
            {claim.visitDate ? `방문 예정일 ${claim.visitDate}` : "방문 예정일 확인 필요"}
          </Text>
          {claim.requestedAt ? (
            <Text style={{ fontSize: 12, color: colors.textMuted }}>요청일 {claim.requestedAt.replace("T", " ").slice(0, 16)}</Text>
          ) : null}
        </View>
        <ClaimStatusPill status={claim.status} />
      </View>

      <Pressable
        onPress={() => router.push(`/item/${claim.itemId}`)}
        style={{
          minHeight: 42,
          borderRadius: 11,
          backgroundColor: colors.primaryBg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
        }}
      >
        <Ionicons name="open-outline" color={colors.primary} size={17} />
        <Text style={{ fontSize: 14, fontWeight: "900", color: colors.primary }}>물품 보기</Text>
      </Pressable>

      {claim.status === "PENDING" ? (
        <Pressable
          disabled={cancelling}
          onPress={onCancel}
          style={{
            minHeight: 42,
            borderRadius: 11,
            backgroundColor: colors.dangerBg,
            alignItems: "center",
            justifyContent: "center",
            opacity: cancelling ? 0.55 : 1,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "800", color: colors.danger }}>
            {cancelling ? "취소 중" : "요청 취소"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ClaimStatusPill({ status }: { status: ClaimStatus }) {
  const map = {
    PENDING: { label: "대기", color: colors.warning, backgroundColor: colors.warningBg },
    APPROVED: { label: "승인", color: colors.success, backgroundColor: colors.successBg },
    REJECTED: { label: "반려", color: colors.danger, backgroundColor: colors.dangerBg },
  } satisfies Record<ClaimStatus, { label: string; color: string; backgroundColor: string }>;

  const option = map[status];

  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.chip, backgroundColor: option.backgroundColor }}>
      <Text style={{ fontSize: 12, fontWeight: "900", color: option.color }}>{option.label}</Text>
    </View>
  );
}

function EmptyState({ loading, error }: { loading: boolean; error: boolean }) {
  if (loading) {
    return (
      <View style={{ alignItems: "center", paddingTop: 54 }}>
        <Ionicons name="hourglass-outline" color={colors.textMuted} size={26} />
        <Text style={{ marginTop: 8, color: colors.textSub }}>요청 내역을 불러오는 중입니다.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        marginTop: 32,
        padding: 24,
        borderRadius: radius.card,
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        gap: 8,
      }}
    >
      <Ionicons name={error ? "alert-circle-outline" : "receipt-outline"} color={colors.textMuted} size={30} />
      <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textMain }}>
        {error ? "요청 내역을 불러오지 못했습니다" : "회수 요청 내역이 없습니다"}
      </Text>
      <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSub, textAlign: "center" }}>
        {error ? "네트워크 상태를 확인한 뒤 다시 시도해주세요." : "분실물 상세 화면에서 회수 요청을 신청할 수 있습니다."}
      </Text>
    </View>
  );
}

function getCancelErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    return data?.message ?? data?.error ?? "회수 요청 취소에 실패했습니다.";
  }
  return "회수 요청 취소에 실패했습니다.";
}
