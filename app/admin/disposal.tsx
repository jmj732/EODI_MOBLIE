import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, Text, TextInput, View } from "react-native";

import {
  extendDisposal,
  getDisposalCount,
  getDisposalReason,
  itemKeys,
  searchItems,
  submitDisposalReason,
} from "@/api/items";
import { FeedbackBanner, type FeedbackMessage } from "@/components/feedback-banner";
import { colors, radius, shadow, typography } from "@/theme";
import type { DisposalReasonResponse, ItemSummary } from "@/types/item";
import { confirmDestructive } from "@/utils/confirm";

const filters = { page: 1, size: 30, status: ["TO_BE_DISCARDED" as const], sort: "LATEST" as const };

export default function AdminDisposalScreen() {
  const count = useQuery({
    queryKey: itemKeys.disposalCount,
    queryFn: getDisposalCount,
  });

  const items = useQuery({
    queryKey: itemKeys.search(filters),
    queryFn: () => searchItems(filters),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBg }}>
      <FlatList
        data={items.data?.content ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={items.isRefetching || count.isRefetching} onRefresh={() => {
            void items.refetch();
            void count.refetch();
          }} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <View style={{ gap: 5 }}>
              <Text style={{ ...typography.h1, color: colors.textMain }}>폐기 물품 관리</Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSub }}>
                폐기 예정 물품의 사유를 등록하고 확정 처리합니다.
              </Text>
            </View>
            <View
              style={{
                padding: 16,
                borderRadius: radius.card,
                backgroundColor: colors.warningBg,
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "900", color: colors.warning }}>폐기 예정</Text>
              <Text style={{ marginTop: 4, fontSize: 26, fontWeight: "900", color: colors.textMain }}>
                {count.data?.count ?? items.data?.totalElements ?? 0}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState loading={items.isLoading} error={items.isError} />}
        renderItem={({ item }) => <DisposalItemCard item={item} />}
      />
    </View>
  );
}

function DisposalItemCard({ item }: { item: ItemSummary }) {
  const queryClient = useQueryClient();
  const [formVisible, setFormVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("30");
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [formFeedback, setFormFeedback] = useState<FeedbackMessage | null>(null);

  const reasonQuery = useQuery({
    queryKey: itemKeys.disposalReason(item.id),
    queryFn: () => getDisposalReason(item.id),
    retry: false,
  });

  const invalidateDisposal = () => {
    void queryClient.invalidateQueries({ queryKey: itemKeys.disposalReason(item.id) });
    void queryClient.invalidateQueries({ queryKey: itemKeys.disposalCount });
    void queryClient.invalidateQueries({ queryKey: itemKeys.all });
  };

  const submitReason = useMutation({
    mutationFn: () => submitDisposalReason(item.id, reason.trim(), Number(days)),
    onSuccess: () => {
      invalidateDisposal();
      setFormVisible(false);
      setReason("");
      setDays("30");
      setFormFeedback(null);
      setFeedback({ tone: "success", title: "사유 등록 완료", message: "폐기 보류 사유가 저장되었습니다." });
    },
    onError: () => setFormFeedback({ tone: "error", title: "등록 실패", message: "폐기 사유 등록에 실패했습니다." }),
  });

  const confirmDiscard = useMutation({
    mutationFn: (reasonId: number) => extendDisposal(item.id, reasonId),
    onSuccess: () => {
      invalidateDisposal();
      setFeedback({ tone: "success", title: "폐기 확정 완료", message: "물품이 폐기 처리되었습니다." });
    },
    onError: () => setFeedback({ tone: "error", title: "처리 실패", message: "폐기 확정 처리에 실패했습니다." }),
  });

  const disposalReason = reasonQuery.data;
  const canConfirm = !!disposalReason?.reasonId;

  const handleSubmitReason = () => {
    if (!reason.trim()) {
      setFormFeedback({ tone: "warning", title: "입력 오류", message: "폐기 사유를 입력해주세요." });
      return;
    }
    const extensionDays = Number(days);
    if (!Number.isInteger(extensionDays) || extensionDays < 1 || extensionDays > 365) {
      setFormFeedback({ tone: "warning", title: "입력 오류", message: "연장 일수는 1~365 사이 숫자여야 합니다." });
      return;
    }
    submitReason.mutate();
  };

  const handleConfirmDiscard = () => {
    if (!disposalReason?.reasonId) return;
    confirmDestructive({
      title: "폐기 확정",
      message: `"${item.name}"을(를) 폐기 처리할까요?`,
      confirmText: "확정",
      onConfirm: () => confirmDiscard.mutate(disposalReason.reasonId),
    });
  };

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
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: colors.warningBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="trash-outline" color={colors.warning} size={21} />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textMain }} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSub }} numberOfLines={1}>
            {item.category} · {item.foundAt}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
            {item.discardedAt ? `폐기 예정 ${item.discardedAt}` : "폐기 예정일 정보 없음"}
          </Text>
        </View>
      </View>

      {disposalReason ? <ReasonBox reason={disposalReason} /> : null}
      <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      <View style={{ flexDirection: "row", gap: 8 }}>
        <DisposalAction
          title={disposalReason ? "사유 수정" : "사유 등록"}
          icon="create-outline"
          tone="neutral"
          onPress={() => {
            setFormFeedback(null);
            setFormVisible(true);
          }}
        />
        <DisposalAction
          title={confirmDiscard.isPending ? "처리 중" : "폐기 확정"}
          icon="checkmark-done-outline"
          tone="danger"
          disabled={!canConfirm || confirmDiscard.isPending}
          onPress={handleConfirmDiscard}
        />
      </View>

      <ReasonModal
        visible={formVisible}
        reason={reason}
        days={days}
        feedback={formFeedback}
        submitting={submitReason.isPending}
        onReasonChange={setReason}
        onDaysChange={setDays}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmitReason}
      />
    </View>
  );
}

function ReasonBox({ reason }: { reason: DisposalReasonResponse }) {
  return (
    <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.appBg, gap: 5 }}>
      <Text style={{ fontSize: 13, fontWeight: "900", color: colors.textMain }}>등록된 사유</Text>
      <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSub }}>{reason.reason}</Text>
      <Text style={{ fontSize: 12, color: colors.textMuted }}>
        담당 {reason.teacherName} · 연장 {reason.extensionDays}일
      </Text>
    </View>
  );
}

function DisposalAction({
  title,
  icon,
  tone,
  disabled,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "neutral" | "danger";
  disabled?: boolean;
  onPress: () => void;
}) {
  const color = tone === "danger" ? colors.danger : colors.primary;
  const backgroundColor = tone === "danger" ? colors.dangerBg : colors.primaryBg;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 42,
        borderRadius: 11,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Ionicons name={icon} color={color} size={17} />
      <Text style={{ fontSize: 14, fontWeight: "900", color }}>{title}</Text>
    </Pressable>
  );
}

function ReasonModal({
  visible,
  reason,
  days,
  feedback,
  submitting,
  onReasonChange,
  onDaysChange,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  reason: string;
  days: string;
  feedback: FeedbackMessage | null;
  submitting: boolean;
  onReasonChange: (value: string) => void;
  onDaysChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" }}>
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            gap: 14,
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center" }} />
          <Text style={{ fontSize: 20, fontWeight: "900", color: colors.textMain }}>폐기 사유 등록</Text>
          <FeedbackBanner feedback={feedback} />
          <TextInput
            placeholder="폐기 사유"
            placeholderTextColor={colors.textMuted}
            value={reason}
            onChangeText={onReasonChange}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 96,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 13,
              fontSize: 15,
              color: colors.textMain,
              backgroundColor: colors.appBg,
            }}
          />
          <TextInput
            placeholder="연장 일수"
            placeholderTextColor={colors.textMuted}
            value={days}
            onChangeText={onDaysChange}
            keyboardType="numeric"
            style={{
              minHeight: 48,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 13,
              fontSize: 15,
              color: colors.textMain,
              backgroundColor: colors.appBg,
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <FooterButton title="취소" tone="neutral" onPress={onClose} />
            <FooterButton title={submitting ? "등록 중" : "등록"} tone="primary" disabled={submitting} onPress={onSubmit} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FooterButton({
  title,
  tone,
  disabled,
  onPress,
}: {
  title: string;
  tone: "primary" | "neutral";
  disabled?: boolean;
  onPress: () => void;
}) {
  const active = tone === "primary";
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: radius.button,
        backgroundColor: disabled ? "#E5E7EB" : active ? colors.primary : "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "900", color: disabled ? colors.textMuted : active ? "#FFFFFF" : colors.textMain }}>{title}</Text>
    </Pressable>
  );
}

function EmptyState({ loading, error }: { loading: boolean; error: boolean }) {
  if (loading) {
    return (
      <View style={{ alignItems: "center", paddingTop: 48 }}>
        <Text style={{ color: colors.textSub }}>폐기 예정 물품을 불러오는 중입니다.</Text>
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
      <Ionicons name={error ? "alert-circle-outline" : "trash-outline"} color={colors.textMuted} size={30} />
      <Text style={{ fontSize: 15, fontWeight: "900", color: colors.textMain }}>
        {error ? "폐기 목록을 불러오지 못했습니다" : "폐기 예정 물품이 없습니다"}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSub, textAlign: "center" }}>
        {error ? "서버 연결과 권한을 확인해주세요." : "폐기 예정 상태가 되면 이곳에 표시됩니다."}
      </Text>
    </View>
  );
}
