import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { createElement, useState } from "react";
import type { CSSProperties } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { claimKeys, createClaim, getMyClaims } from "@/api/claims";
import { getItemDetail, itemKeys, searchItems } from "@/api/items";
import { AppButton } from "@/components/app-button";
import { FeedbackBanner, type FeedbackMessage } from "@/components/feedback-banner";
import { useAuthStore } from "@/stores/auth-store";
import { colors, radius, shadow, typography } from "@/theme";
import type { ItemStatus } from "@/types/item";
import { normalizeImageUrl } from "@/utils/image";


export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = parseInt(id, 10);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showClaim, setShowClaim] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date());
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const visitDateString = visitDate.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

  const { data: item, isLoading } = useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn: () => getItemDetail(itemId),
  });

  const statusFallback = useQuery({
    queryKey: ["items", "detail-status", itemId] as const,
    queryFn: () => searchItems({ page: 1, size: 200, sort: "LATEST" }),
    enabled: !!item,
  });

  const myClaims = useQuery({
    queryKey: claimKeys.my(1),
    queryFn: () => getMyClaims(1, 100),
    enabled: user?.role === "USER",
  });

  const claim = useMutation({
    mutationFn: () => createClaim(itemId, visitDateString),
    onSuccess: () => {
      setClaimSubmitted(true);
      void queryClient.invalidateQueries({ queryKey: ["claims", "my"] });
      setShowClaim(false);
      setFeedback({
        tone: "success",
        title: "회수 요청 완료",
        message: "요청이 접수되었습니다. 내 회수 요청에서 진행 상태를 확인할 수 있습니다.",
        actionLabel: "내 요청 보기",
        onAction: () => router.push("/user/claims"),
      });
    },
    onError: (error) => setFeedback({ tone: "error", title: "회수 요청 실패", message: getClaimErrorMessage(error) }),
  });

  const handleSubmit = () => {
    if (claim.isPending) return;
    if (hasPendingClaim) {
      setShowClaim(false);
      setFeedback({ tone: "warning", title: "이미 신청한 물품", message: "내 회수 요청 내역에서 진행 상태를 확인하세요." });
      return;
    }
    claim.mutate();
  };

  if (isLoading || !item) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.appBg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const imageUrl = normalizeImageUrl(item.image);
  const itemFromSearch = statusFallback.data?.content.find((candidate) => candidate.id === itemId);
  const displayStatus = item.status ?? itemFromSearch?.status;
  const isClaimableStatus = displayStatus === "LOST" || displayStatus === "TO_BE_DISCARDED";
  const pendingClaim = myClaims.data?.claims.find((claimItem) => claimItem.itemId === itemId && claimItem.status === "PENDING");
  const hasPendingClaim = claimSubmitted || !!pendingClaim;
  const showClaimFooter = user?.role === "USER" && isClaimableStatus;
  const canClaim = showClaimFooter && !hasPendingClaim && !myClaims.isLoading;

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: showClaimFooter ? 100 : 24 }}>
        {/* 히어로 이미지 */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 260 }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width: "100%",
              height: 200,
              backgroundColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.textMuted }}>이미지 없음</Text>
          </View>
        )}

        <View style={{ padding: 20, gap: 16 }}>
          <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />
          {/* 제목 + 카테고리 */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ ...typography.h1, color: colors.textMain, flex: 1 }}>{item.name}</Text>
            <View
              style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.chip, backgroundColor: colors.primaryBg }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{item.category}</Text>
            </View>
          </View>

          {/* 상세 정보 */}
          <View
            style={{ backgroundColor: colors.cardBg, borderRadius: radius.card, padding: 16, gap: 12, ...shadow }}
          >
            <DetailRow label="상태" value={statusLabel(displayStatus)} />
            <DetailRow label="종류" value={item.category} />
            <DetailRow label="습득일" value={item.foundAt} />
            {(item.foundPlace || item.foundPlaceDetail) && (
              <DetailRow
                label="습득 장소"
                value={`${item.foundPlace ?? ""}${item.foundPlaceDetail ? ` ${item.foundPlaceDetail}` : ""}`.trim()}
              />
            )}
            {item.reporterName && (
              <DetailRow
                label="신고자"
                value={`${item.reporterName}${item.reporterStudentCode ? ` (${item.reporterStudentCode})` : ""}`}
              />
            )}
            {item.disposalDate ? <DetailRow label="폐기 예정" value={item.disposalDate} /> : null}
            {item.approvalStatus ? <DetailRow label="승인 상태" value={approvalLabel(item.approvalStatus)} /> : null}
          </View>

          {displayStatus === "TO_BE_DISCARDED" && (
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                backgroundColor: "#FFF7ED",
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderLeftWidth: 3,
                borderLeftColor: colors.warning,
              }}
            >
              <Text style={{ fontSize: 13, color: "#9A3412", flex: 1, lineHeight: 18 }}>
                이 물품은 곧 폐기될 예정입니다. 본인 물건이라면 빠르게 신청하세요.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        hitSlop={8}
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 14,
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.92)",
          alignItems: "center",
          justifyContent: "center",
          ...shadow,
        }}
      >
        <Ionicons name="chevron-back" color={colors.textMain} size={25} />
      </Pressable>

      {/* 스티키 하단 버튼 */}
      {showClaimFooter && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            backgroundColor: colors.cardBg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <AppButton
            title={hasPendingClaim ? "회수 요청 대기 중" : myClaims.isLoading ? "신청 여부 확인 중" : "내 물건이에요"}
            onPress={() => setShowClaim(true)}
            disabled={!canClaim}
          />
        </View>
      )}

      {/* 회수 요청 바텀 시트 */}
      <Modal visible={showClaim} transparent animationType="slide">
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          onPress={() => setShowClaim(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              gap: 16,
            }}
            onPress={() => {}}
          >
            {/* 핸들 */}
            <View
              style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center" }}
            />
            <Text style={{ ...typography.h2, color: colors.textMain }}>회수 요청</Text>
            <View style={{ backgroundColor: colors.primaryBg, borderRadius: 10, padding: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textMain }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>
                {item.foundAt} · {item.foundPlace ?? ""}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <VisitDatePicker value={visitDate} onChange={setVisitDate} />
            </View>
            <Text style={{ fontSize: 13, color: colors.textSub, textAlign: "center" }}>
              방문 예정일: {visitDateString}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppButton title="취소" variant="secondary" onPress={() => setShowClaim(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton title="신청하기" onPress={handleSubmit} loading={claim.isPending} disabled={hasPendingClaim} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <Text style={{ fontSize: 13, color: colors.textSub, width: 64 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.textMain, flex: 1 }}>{value}</Text>
    </View>
  );
}

function statusLabel(status?: ItemStatus) {
  const map: Record<ItemStatus, string> = {
    LOST: "보관중",
    GIVEN: "지급 완료",
    TO_BE_DISCARDED: "폐기 예정",
    DISCARDED: "폐기 완료",
  };
  return status ? map[status] : "확인 중";
}

function approvalLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: "대기",
    APPROVED: "승인",
    REJECTED: "반려",
  };
  return map[status] ?? status;
}

function VisitDatePicker({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const valueString = value.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const todayString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

  if (Platform.OS === "web") {
    return createElement("input", {
      type: "date",
      value: valueString,
      min: todayString,
      onChange: (event: { target: { value: string } }) => {
        if (event.target.value) {
          onChange(new Date(`${event.target.value}T00:00:00+09:00`));
        }
      },
      style: {
        width: "100%",
        minHeight: 48,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.appBg,
        color: colors.textMain,
        fontSize: 16,
        fontWeight: 700,
        padding: "0 14px",
      } satisfies CSSProperties,
    });
  }

  return (
    <DateTimePicker
      value={value}
      mode="date"
      display={Platform.OS === "ios" ? "spinner" : "default"}
      minimumDate={new Date()}
      onChange={(_, date) => {
        if (date) onChange(date);
      }}
      locale="ko-KR"
    />
  );
}

function getClaimErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    return data?.message ?? data?.error ?? "회수 요청에 실패했습니다.";
  }
  return "회수 요청에 실패했습니다.";
}
