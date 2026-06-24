import Ionicons from "@expo/vector-icons/Ionicons";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { FlatList, Image, Modal, Pressable, RefreshControl, Text, View } from "react-native";

import { approveClaim, claimKeys, getClaimCount, getClaimRequests, rejectClaim } from "@/api/claims";
import type { ClaimRequestParams } from "@/api/claims";
import { getClaimedItems, itemKeys } from "@/api/items";
import { rewardKeys } from "@/api/rewards";
import { colors, radius, shadow, typography } from "@/theme";
import type { ClaimedItem, ClaimRequest, ClaimRequestsResponse, ClaimStatus } from "@/types/item";
import { normalizeImageUrl } from "@/utils/image";

const PAGE_SIZE = 30;
const STATUS_FILTERS: { label: string; value: ClaimStatus | null }[] = [
  { label: "전체", value: null },
  { label: "대기", value: "PENDING" },
  { label: "승인", value: "APPROVED" },
  { label: "반려", value: "REJECTED" },
];

export default function AdminClaimsScreen() {
  const queryClient = useQueryClient();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [status, setStatus] = useState<ClaimStatus | null>(null);
  const [decision, setDecision] = useState<{ type: "approve" | "reject"; claim: ClaimRequest } | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const filters = useMemo(
    () => ({
      page: 1,
      size: PAGE_SIZE,
      sort: "LATEST" as const,
      itemId: selectedItemId ?? undefined,
      status: status ?? undefined,
    }),
    [selectedItemId, status],
  );

  const requests = useQuery({
    queryKey: claimKeys.adminList(filters),
    queryFn: () => getClaimRequests(filters),
  });

  const claimedItems = useQuery({
    queryKey: itemKeys.claimed,
    queryFn: () => getClaimedItems(1, 20),
  });

  const count = useQuery({
    queryKey: claimKeys.adminCount,
    queryFn: getClaimCount,
  });

  const invalidateAfterDecision = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
    void queryClient.invalidateQueries({ queryKey: itemKeys.all });
    void queryClient.invalidateQueries({ queryKey: itemKeys.claimed });
    void queryClient.invalidateQueries({ queryKey: rewardKeys.requests });
    void queryClient.invalidateQueries({ queryKey: rewardKeys.eligibleCount });
  };

  const approve = useMutation({
    mutationFn: approveClaim,
    onSuccess: (_data, claimId) => {
      setDecision(null);
      setFeedback({ tone: "success", message: "회수 요청을 승인했습니다." });
      updateClaimStatusInCache(queryClient, claimId, "APPROVED");
      invalidateAfterDecision();
    },
    onError: (error) => {
      setDecision(null);
      setFeedback({ tone: "error", message: getClaimDecisionErrorMessage(error, "회수 요청 승인에 실패했습니다.") });
    },
  });

  const reject = useMutation({
    mutationFn: rejectClaim,
    onSuccess: (_data, claimId) => {
      setDecision(null);
      setFeedback({ tone: "success", message: "회수 요청을 반려했습니다." });
      updateClaimStatusInCache(queryClient, claimId, "REJECTED");
      invalidateAfterDecision();
    },
    onError: (error) => {
      setDecision(null);
      setFeedback({ tone: "error", message: getClaimDecisionErrorMessage(error, "회수 요청 반려에 실패했습니다.") });
    },
  });

  const claims = requests.data?.claims ?? [];
  const pendingCount = count.data?.count ?? claims.filter((claim) => claim.status === "PENDING").length;
  const selectedItem = claimedItems.data?.items.find((item) => item.id === selectedItemId);
  const decisionPending = approve.isPending || reject.isPending;

  const confirmApprove = (claim: ClaimRequest) => {
    setFeedback(null);
    setDecision({ type: "approve", claim });
  };

  const confirmReject = (claim: ClaimRequest) => {
    setFeedback(null);
    setDecision({ type: "reject", claim });
  };

  const submitDecision = () => {
    if (!decision || decisionPending) return;
    if (decision.type === "approve") {
      approve.mutate(decision.claim.claimId);
      return;
    }
    reject.mutate(decision.claim.claimId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBg }}>
      <FlatList
        data={claims}
        keyExtractor={(item) => String(item.claimId)}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={requests.isRefetching || count.isRefetching || claimedItems.isRefetching}
            onRefresh={() => {
              void requests.refetch();
              void count.refetch();
              void claimedItems.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <View style={{ gap: 5 }}>
              <Text style={{ ...typography.h1, color: colors.textMain }}>회수 요청 관리</Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSub }}>
                사용자의 회수 요청을 승인하거나 반려합니다.
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <SummaryCard label="대기 요청" value={pendingCount} tone="warning" />
              <SummaryCard label="전체 요청" value={requests.data?.total ?? claims.length} tone="primary" />
            </View>

            {feedback ? <FeedbackBanner tone={feedback.tone} message={feedback.message} onDismiss={() => setFeedback(null)} /> : null}

            <FilterSection title="상태">
              <FlatList
                horizontal
                data={STATUS_FILTERS}
                keyExtractor={(item) => item.label}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <FilterChip label={item.label} active={status === item.value} onPress={() => setStatus(item.value)} />
                )}
              />
            </FilterSection>

            <FilterSection title="요청 있는 물품" trailing={claimedItems.isLoading ? "불러오는 중" : undefined}>
              <FlatList
                horizontal
                data={claimedItems.data?.items ?? []}
                keyExtractor={(item) => String(item.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                ListHeaderComponent={
                  selectedItemId ? (
                    <ClaimedItemChip
                      active={false}
                      item={{ id: 0, name: "전체 요청", foundAt: "", requestCount: requests.data?.total ?? claims.length }}
                      onPress={() => setSelectedItemId(null)}
                    />
                  ) : null
                }
                renderItem={({ item }) => (
                  <ClaimedItemChip item={item} active={selectedItemId === item.id} onPress={() => setSelectedItemId(item.id)} />
                )}
              />
            </FilterSection>

            {selectedItem ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <Text style={{ flex: 1, fontSize: 13, color: colors.textSub }} numberOfLines={1}>
                  {selectedItem.name} 요청만 보는 중
                </Text>
                <Pressable onPress={() => setSelectedItemId(null)} hitSlop={8}>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: colors.primary }}>필터 해제</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={<EmptyState loading={requests.isLoading} error={requests.isError} />}
        renderItem={({ item }) => (
          <ClaimCard
            claim={item}
            approveLoading={approve.isPending && approve.variables === item.claimId}
            rejectLoading={reject.isPending && reject.variables === item.claimId}
            onApprove={() => confirmApprove(item)}
            onReject={() => confirmReject(item)}
            onOpenItem={() => router.push(`/item/${item.itemId}`)}
          />
        )}
      />
      <DecisionModal
        decision={decision}
        pending={decisionPending}
        onCancel={() => setDecision(null)}
        onConfirm={submitDecision}
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
      <Text style={{ fontSize: 12, fontWeight: "900", color }}>{label}</Text>
      <Text style={{ marginTop: 4, fontSize: 24, fontWeight: "900", color: colors.textMain }}>{value}</Text>
    </View>
  );
}

function FeedbackBanner({ tone, message, onDismiss }: { tone: "success" | "error"; message: string; onDismiss: () => void }) {
  const color = tone === "success" ? colors.success : colors.danger;
  const backgroundColor = tone === "success" ? colors.successBg : colors.dangerBg;
  const borderColor = tone === "success" ? "#A7F3D0" : "#FECACA";
  const icon = tone === "success" ? "checkmark-circle-outline" : "alert-circle-outline";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: radius.button,
        backgroundColor,
        borderWidth: 1,
        borderColor,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <Ionicons name={icon} color={color} size={18} />
      <Text style={{ flex: 1, fontSize: 13, fontWeight: "800", color }}>{message}</Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close-outline" color={color} size={18} />
      </Pressable>
    </View>
  );
}

function DecisionModal({
  decision,
  pending,
  onCancel,
  onConfirm,
}: {
  decision: { type: "approve" | "reject"; claim: ClaimRequest } | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isApprove = decision?.type === "approve";
  const title = isApprove ? "회수 요청 승인" : "회수 요청 반려";
  const confirmText = pending ? "처리 중" : isApprove ? "승인" : "반려";
  const toneColor = isApprove ? colors.success : colors.danger;
  const toneBg = isApprove ? colors.successBg : colors.dangerBg;

  return (
    <Modal visible={!!decision} transparent animationType="fade" onRequestClose={pending ? undefined : onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(17,24,39,0.45)",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            borderRadius: radius.card,
            backgroundColor: colors.cardBg,
            padding: 18,
            gap: 14,
            ...shadow,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                backgroundColor: toneBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={isApprove ? "checkmark-circle-outline" : "close-circle-outline"} color={toneColor} size={22} />
            </View>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: "900", color: colors.textMain }}>{title}</Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: "900", color: colors.textMain }} numberOfLines={2}>
              {decision?.claim.itemName}
            </Text>
            <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSub }}>
              {decision?.claim.requesterName} 요청을 {isApprove ? "승인" : "반려"}합니다. 처리 후 목록이 자동으로 갱신됩니다.
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              disabled={pending}
              onPress={onCancel}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: radius.button,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
                opacity: pending ? 0.55 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "900", color: colors.textSub }}>닫기</Text>
            </Pressable>
            <Pressable
              disabled={pending}
              onPress={onConfirm}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: radius.button,
                backgroundColor: toneColor,
                alignItems: "center",
                justifyContent: "center",
                opacity: pending ? 0.7 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#FFFFFF" }}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({ title, trailing, children }: { title: string; trailing?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 13, fontWeight: "900", color: colors.textMain }}>{title}</Text>
        {trailing ? <Text style={{ fontSize: 12, color: colors.textMuted }}>{trailing}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: radius.chip,
        backgroundColor: active ? colors.primary : colors.cardBg,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "800", color: active ? "#FFFFFF" : colors.textSub }}>{label}</Text>
    </Pressable>
  );
}

function ClaimedItemChip({ item, active, onPress }: { item: ClaimedItem; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 150,
        padding: 12,
        gap: 4,
        borderRadius: radius.card,
        backgroundColor: active ? colors.primaryBg : colors.cardBg,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "900", color: colors.textMain }} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={{ fontSize: 12, color: active ? colors.primary : colors.textSub }}>
        요청 {item.requestCount}건{item.visitDate ? ` · 방문 ${item.visitDate}` : ""}
      </Text>
    </Pressable>
  );
}

function ClaimCard({
  claim,
  approveLoading,
  rejectLoading,
  onApprove,
  onReject,
  onOpenItem,
}: {
  claim: ClaimRequest;
  approveLoading: boolean;
  rejectLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  onOpenItem: () => void;
}) {
  const isPending = claim.status === "PENDING";
  const imageUrl = normalizeImageUrl(claim.imageUrl);

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
          <Image source={{ uri: imageUrl }} style={{ width: 54, height: 54, borderRadius: 14 }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              backgroundColor: colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="hand-left-outline" color={colors.primary} size={21} />
          </View>
        )}
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textMain }} numberOfLines={2}>
            {claim.itemName}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSub }} numberOfLines={1}>
            {claim.requesterName}
            {claim.requesterType ? ` (${claim.requesterType})` : ""} · 방문 {claim.visitDate}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            요청 ID {claim.claimId}
            {claim.requestedAt ? ` · ${formatDateTime(claim.requestedAt)}` : ""}
          </Text>
        </View>
        <ClaimStatusPill status={claim.status} />
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <DecisionButton title="물품 보기" tone="neutral" disabled={false} onPress={onOpenItem} />
        {isPending ? (
          <>
            <DecisionButton title={approveLoading ? "승인 중" : "승인"} tone="approve" disabled={approveLoading || rejectLoading} onPress={onApprove} />
            <DecisionButton title={rejectLoading ? "반려 중" : "반려"} tone="reject" disabled={approveLoading || rejectLoading} onPress={onReject} />
          </>
        ) : null}
      </View>
    </View>
  );
}

function DecisionButton({
  title,
  tone,
  disabled,
  onPress,
}: {
  title: string;
  tone: "approve" | "reject" | "neutral";
  disabled: boolean;
  onPress: () => void;
}) {
  const color = tone === "approve" ? colors.success : tone === "reject" ? colors.danger : colors.primary;
  const backgroundColor = tone === "approve" ? colors.successBg : tone === "reject" ? colors.dangerBg : colors.primaryBg;
  const icon = tone === "approve" ? "checkmark-circle-outline" : tone === "reject" ? "close-circle-outline" : "open-outline";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 44,
        borderRadius: 11,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Ionicons name={icon} color={color} size={18} />
      <Text style={{ fontSize: 14, fontWeight: "900", color }}>{title}</Text>
    </Pressable>
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
      <View style={{ alignItems: "center", paddingTop: 48 }}>
        <Text style={{ color: colors.textSub }}>회수 요청을 불러오는 중입니다.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        marginTop: 24,
        padding: 24,
        borderRadius: radius.card,
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        gap: 8,
      }}
    >
      <Ionicons name={error ? "alert-circle-outline" : "checkbox-outline"} color={colors.textMuted} size={30} />
      <Text style={{ fontSize: 15, fontWeight: "900", color: colors.textMain }}>
        {error ? "요청을 불러오지 못했습니다" : "회수 요청이 없습니다"}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSub, textAlign: "center" }}>
        {error ? "서버 연결과 권한을 확인해주세요." : "새 요청이 들어오면 이곳에 표시됩니다."}
      </Text>
    </View>
  );
}

function formatDateTime(value: string) {
  return value.replace("T", " ").slice(0, 16);
}

function getClaimDecisionErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    return data?.message ?? data?.error ?? fallback;
  }
  return fallback;
}

function updateClaimStatusInCache(queryClient: QueryClient, claimId: number, nextStatus: ClaimStatus) {
  const queries = queryClient.getQueryCache().findAll({
    predicate: (query) => isAdminClaimListKey(query.queryKey),
  });

  queries.forEach((query) => {
    queryClient.setQueryData(query.queryKey, (oldData: unknown) => {
      if (!isClaimRequestsResponse(oldData)) return oldData;

      const filters = getAdminClaimFilters(query.queryKey);
      const shouldRemoveFromFilteredList = !!filters?.status && filters.status !== nextStatus;
      const updateClaim = (claim: ClaimRequest) => (claim.claimId === claimId ? { ...claim, status: nextStatus } : claim);
      const filterClaim = (claim: ClaimRequest) => !shouldRemoveFromFilteredList || claim.claimId !== claimId;
      const claims = oldData.claims.map(updateClaim).filter(filterClaim);
      const requests = oldData.requests?.map(updateClaim).filter(filterClaim);

      return {
        ...oldData,
        claims,
        requests,
        total: shouldRemoveFromFilteredList ? Math.max(0, oldData.total - 1) : oldData.total,
      };
    });
  });

  queryClient.setQueryData<{ count: number }>(claimKeys.adminCount, (oldData) => {
    if (!oldData || nextStatus === "PENDING") return oldData;
    return { count: Math.max(0, oldData.count - 1) };
  });
}

function isAdminClaimListKey(queryKey: QueryKey) {
  return queryKey[0] === "admin" && queryKey[1] === "claims" && queryKey[2] !== "count";
}

function getAdminClaimFilters(queryKey: QueryKey) {
  const filters = queryKey[2];
  if (typeof filters === "object" && filters !== null && "status" in filters) {
    return filters as ClaimRequestParams;
  }
  return null;
}

function isClaimRequestsResponse(data: unknown): data is ClaimRequestsResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "claims" in data &&
    Array.isArray((data as ClaimRequestsResponse).claims) &&
    "total" in data
  );
}
