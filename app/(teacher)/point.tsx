import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Text, View } from "react-native";

import { getRewardEligibleCount, getRewardRequests, giveReward, rewardKeys } from "@/api/rewards";
import { AppButton } from "@/components/app-button";
import { InfoCard } from "@/components/info-card";
import { Screen } from "@/components/screen";

export default function PointScreen() {
  const queryClient = useQueryClient();

  const requests = useQuery({
    queryKey: rewardKeys.requests,
    queryFn: getRewardRequests,
  });
  const count = useQuery({
    queryKey: rewardKeys.eligibleCount,
    queryFn: getRewardEligibleCount,
  });

  const give = useMutation({
    mutationFn: giveReward,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
    onError: () => Alert.alert("오류", "상점 지급에 실패했습니다."),
  });

  return (
    <Screen title="상점 지급" subtitle="회수 완료된 물품의 습득 신고자에게 상점을 지급합니다.">
      <InfoCard title="지급 대기" value={count.data?.count ?? 0} detail="상점 지급이 필요한 물품 수" />
      {requests.isLoading ? <Text>불러오는 중</Text> : null}
      {requests.error ? <Text selectable>상점 지급 대상을 불러오지 못했습니다.</Text> : null}
      <View style={{ gap: 10 }}>
        {(requests.data?.rewards ?? []).map((reward) => (
          <View key={reward.itemId} style={{ gap: 8 }}>
            <InfoCard
              title={reward.itemName}
              value={reward.rewardGiven ? "지급 완료" : "지급 대기"}
              detail={`${reward.studentName} · ${reward.studentCode ?? "-"}`}
            />
            {!reward.rewardGiven && (
              <AppButton
                title="상점 지급"
                onPress={() => give.mutate(reward.itemId)}
                loading={give.isPending && give.variables === reward.itemId}
              />
            )}
          </View>
        ))}
      </View>
    </Screen>
  );
}
