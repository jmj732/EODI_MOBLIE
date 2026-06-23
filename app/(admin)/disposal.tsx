import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Modal, Text, TextInput, View } from "react-native";

import {
  extendDisposal,
  getDisposalCount,
  getDisposalReason,
  itemKeys,
  searchItems,
  submitDisposalReason,
} from "@/api/items";
import { AppButton } from "@/components/app-button";
import { InfoCard } from "@/components/info-card";
import { Screen } from "@/components/screen";
import type { ItemSummary } from "@/types/item";

function DisposalItemCard({ item }: { item: ItemSummary }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("30");

  const disposalReason = useQuery({
    queryKey: itemKeys.disposalReason(item.id),
    queryFn: () => getDisposalReason(item.id),
  });

  const submit = useMutation({
    mutationFn: () => submitDisposalReason(item.id, reason, parseInt(days, 10)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.disposalReason(item.id) });
      setShowForm(false);
      setReason("");
    },
    onError: () => Alert.alert("오류", "사유 등록에 실패했습니다."),
  });

  const extend = useMutation({
    mutationFn: () => extendDisposal(item.id, disposalReason.data!.reasonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.disposalReason(item.id) });
    },
    onError: () => Alert.alert("오류", "폐기 연장에 실패했습니다."),
  });

  return (
    <View style={{ gap: 8 }}>
      <InfoCard
        title={item.name}
        value={item.category}
        detail={`${item.foundAt}${item.discardedAt ? ` · 폐기 예정 ${item.discardedAt}` : ""}`}
      />
      {disposalReason.data ? (
        <View style={{ gap: 8 }}>
          <InfoCard
            title="폐기 사유"
            value={disposalReason.data.reason}
            detail={`담당 ${disposalReason.data.teacherName} · ${disposalReason.data.extensionDays}일`}
          />
          <AppButton
            title="폐기 연장"
            variant="secondary"
            onPress={() => extend.mutate()}
            loading={extend.isPending}
          />
        </View>
      ) : (
        <AppButton title="사유 등록" onPress={() => setShowForm(true)} />
      )}

      <Modal visible={showForm} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              padding: 24,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              gap: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>폐기 사유 등록</Text>
            <TextInput
              placeholder="폐기 사유"
              value={reason}
              onChangeText={setReason}
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 8,
                padding: 12,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
            <TextInput
              placeholder="보관 연장 일수"
              value={days}
              onChangeText={setDays}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 12 }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <AppButton title="취소" variant="secondary" onPress={() => setShowForm(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="등록"
                  onPress={() => submit.mutate()}
                  loading={submit.isPending}
                  disabled={!reason.trim()}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function DisposalScreen() {
  const count = useQuery({
    queryKey: itemKeys.disposalCount,
    queryFn: getDisposalCount,
  });

  const items = useQuery({
    queryKey: itemKeys.search({ page: 1, size: 20, status: ["TO_BE_DISCARDED"], sort: "LATEST" }),
    queryFn: () => searchItems({ page: 1, size: 20, status: ["TO_BE_DISCARDED"], sort: "LATEST" }),
  });

  return (
    <Screen title="폐기 관리" subtitle="폐기 예정 물품과 보류 사유를 관리합니다.">
      <InfoCard
        title="폐기 예정"
        value={count.data?.count ?? 0}
        detail="현재 폐기 예정 상태의 물품 수"
      />
      {items.isLoading ? <Text>불러오는 중</Text> : null}
      {items.error ? <Text selectable>폐기 예정 목록을 불러오지 못했습니다.</Text> : null}
      <View style={{ gap: 12 }}>
        {(items.data?.items ?? []).map((item) => (
          <DisposalItemCard key={item.id} item={item} />
        ))}
      </View>
    </Screen>
  );
}
