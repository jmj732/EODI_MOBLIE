import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Text, View } from "react-native";

import { cancelClaim, claimKeys, getMyClaims } from "@/api/claims";
import { AppButton } from "@/components/app-button";
import { Screen } from "@/components/screen";
import { StatusBadge } from "@/components/status-badge";
import { colors, shadow } from "@/theme";

export default function MyClaimsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: claimKeys.my(1),
    queryFn: () => getMyClaims(1, 10),
  });

  const cancel = useMutation({
    mutationFn: cancelClaim,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: claimKeys.my() }),
    onError: () => Alert.alert("오류", "요청 취소에 실패했습니다."),
  });

  const handleCancel = (claimId: number) => {
    Alert.alert("취소 확인", "회수 요청을 취소하시겠습니까?", [
      { text: "아니요", style: "cancel" },
      { text: "취소", style: "destructive", onPress: () => cancel.mutate(claimId) },
    ]);
  };

  return (
    <Screen title="내 요청" subtitle="회수 신청 현황을 확인합니다.">
      {isLoading ? <Text style={{ color: colors.textSub }}>불러오는 중</Text> : null}
      {error ? <Text selectable style={{ color: colors.danger }}>내역을 불러오지 못했습니다.</Text> : null}
      {!isLoading && (data?.claims ?? []).length === 0 ? (
        <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 24 }}>
          회수 요청 내역이 없습니다.
        </Text>
      ) : null}
      <View style={{ gap: 12 }}>
        {(data?.claims ?? []).map((claim) => (
          <View
            key={claim.claimId}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 16,
              gap: 10,
              ...shadow,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textMain, flex: 1 }} numberOfLines={2}>
                {claim.itemName}
              </Text>
              <StatusBadge status={claim.status} />
            </View>
            <Text style={{ fontSize: 13, color: colors.textSub }}>방문 예정일 {claim.visitDate}</Text>
            {claim.status === "PENDING" && (
              <AppButton
                title="요청 취소"
                variant="danger"
                onPress={() => handleCancel(claim.claimId)}
                loading={cancel.isPending && cancel.variables === claim.claimId}
              />
            )}
          </View>
        ))}
      </View>
    </Screen>
  );
}
