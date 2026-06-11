import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Text, View } from "react-native";

import { approveClaim, claimKeys, getClaimCount, getClaimRequests, rejectClaim } from "@/api/claims";
import { AppButton } from "@/components/app-button";
import { InfoCard } from "@/components/info-card";
import { Screen } from "@/components/screen";

const filters = { page: 1, size: 10, sort: "LATEST" as const };

export default function AdminClaimsScreen() {
  const queryClient = useQueryClient();

  const requests = useQuery({
    queryKey: claimKeys.adminList(filters),
    queryFn: () => getClaimRequests(filters),
  });
  const count = useQuery({
    queryKey: claimKeys.adminCount,
    queryFn: getClaimCount,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
  };

  const approve = useMutation({
    mutationFn: approveClaim,
    onSuccess: invalidate,
    onError: () => Alert.alert("오류", "승인 처리에 실패했습니다."),
  });

  const reject = useMutation({
    mutationFn: rejectClaim,
    onSuccess: invalidate,
    onError: () => Alert.alert("오류", "반려 처리에 실패했습니다."),
  });

  return (
    <Screen title="회수 요청" subtitle="대기 중인 회수 요청을 승인하거나 반려합니다.">
      <InfoCard title="대기 요청" value={count.data?.count ?? 0} detail="처리가 필요한 회수 요청 수" />
      {requests.isLoading ? <Text>불러오는 중</Text> : null}
      {requests.error ? <Text selectable>회수 요청을 불러오지 못했습니다.</Text> : null}
      <View style={{ gap: 10 }}>
        {(requests.data?.claims ?? []).map((claim) => (
          <View key={claim.claimId} style={{ gap: 8 }}>
            <InfoCard
              title={claim.itemName}
              value={claim.status}
              detail={`${claim.requesterName} · 방문 ${claim.visitDate}`}
            />
            {claim.status === "PENDING" && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title="승인"
                    onPress={() => approve.mutate(claim.claimId)}
                    loading={approve.isPending && approve.variables === claim.claimId}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title="반려"
                    variant="danger"
                    onPress={() => reject.mutate(claim.claimId)}
                    loading={reject.isPending && reject.variables === claim.claimId}
                  />
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    </Screen>
  );
}
