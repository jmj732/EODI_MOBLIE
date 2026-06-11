import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { claimKeys, createClaim } from "@/api/claims";
import { getItemDetail, itemKeys } from "@/api/items";
import { AppButton } from "@/components/app-button";
import { useAuthStore } from "@/stores/auth-store";
import { colors, radius, shadow, typography } from "@/theme";
import { normalizeImageUrl } from "@/utils/image";


export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = parseInt(id, 10);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showClaim, setShowClaim] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date());
  const visitDateString = visitDate.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

  const { data: item, isLoading } = useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn: () => getItemDetail(itemId),
  });

  const claim = useMutation({
    mutationFn: () => createClaim(itemId, visitDateString),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimKeys.my() });
      setShowClaim(false);
      Alert.alert("완료", "회수 요청이 접수되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert("오류", "회수 요청에 실패했습니다."),
  });

  const handleSubmit = () => {
    claim.mutate();
  };

  if (isLoading || !item) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.appBg }}>
        <Stack.Screen options={{ title: "분실물 상세" }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const imageUrl = normalizeImageUrl(item.image);
  const canClaim = user?.role === "USER" && item.status === "LOST";

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBg }}>
      <Stack.Screen options={{ title: item.name }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: canClaim ? 100 : 24 }}>
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
            <DetailRow label="습득일" value={item.foundAt} />
            {(item.foundPlace || item.foundPlaceDetail) && (
              <DetailRow
                label="습득 장소"
                value={`${item.foundPlace ?? ""}${item.foundPlaceDetail ? ` ${item.foundPlaceDetail}` : ""}`.trim()}
              />
            )}
            {item.reporterName && (
              <DetailRow label="신고자" value={item.reporterName} />
            )}
            <DetailRow label="상태" value={statusLabel(item.status)} />
          </View>

          {item.status === "TO_BE_DISCARDED" && (
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
                ⚠️ 이 물품은 곧 폐기될 예정입니다. 본인 물건이라면 빠르게 신청하세요.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 스티키 하단 버튼 */}
      {canClaim && (
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
          <AppButton title="내 물건이에요" onPress={() => setShowClaim(true)} />
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
              <DateTimePicker
                value={visitDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={(_, date) => { if (date) setVisitDate(date); }}
                locale="ko-KR"
              />
            </View>
            <Text style={{ fontSize: 13, color: colors.textSub, textAlign: "center" }}>
              방문 예정일: {visitDateString}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppButton title="취소" variant="secondary" onPress={() => setShowClaim(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton title="신청하기" onPress={handleSubmit} loading={claim.isPending} />
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

function statusLabel(status: string) {
  const map: Record<string, string> = {
    LOST: "보관 중",
    GIVEN: "수령 완료",
    TO_BE_DISCARDED: "폐기 예정",
    DISCARDED: "폐기됨",
  };
  return map[status] ?? status;
}
