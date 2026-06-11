import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

import { getRewardHistory, rewardKeys } from "@/api/rewards";
import { InfoCard } from "@/components/info-card";
import { Screen } from "@/components/screen";

const filters = {};

export default function RewardHistoryScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: rewardKeys.history(filters),
    queryFn: () => getRewardHistory(filters),
  });

  return (
    <Screen title="지급 로그" subtitle="상점 지급 이력을 최신순으로 확인합니다.">
      {isLoading ? <Text>불러오는 중</Text> : null}
      {error ? <Text selectable>상점 지급 로그를 불러오지 못했습니다.</Text> : null}
      <View style={{ gap: 10 }}>
        {(data?.rewards ?? []).map((reward) => (
          <InfoCard
            key={reward.rewardId}
            title={reward.itemName}
            value={reward.givenAt}
            detail={`담당 ${reward.givenBy}`}
          />
        ))}
      </View>
    </Screen>
  );
}
