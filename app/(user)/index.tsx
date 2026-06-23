import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import { itemKeys, searchItems } from "@/api/items";
import { useAuthStore } from "@/stores/auth-store";
import { colors, shadow, typography } from "@/theme";

const STEPS = [
  { title: "분실물 검색", desc: "찾기 탭에서 물품명이나 카테고리로 검색하세요." },
  { title: "회수 요청 신청", desc: '"내 물건이에요" 버튼을 눌러 방문 날짜를 선택하세요.' },
  { title: "승인 후 수령", desc: "생활부 승인 후 지정 날짜에 생활부를 방문하세요." },
];

export default function HomeScreen() {
  const { user } = useAuthStore();

  const expiring = useQuery({
    queryKey: itemKeys.search({ status: ["TO_BE_DISCARDED"], page: 1, size: 10, sort: "LATEST" }),
    queryFn: () => searchItems({ status: ["TO_BE_DISCARDED"], page: 1, size: 10, sort: "LATEST" }),
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.appBg }}
      contentContainerStyle={{ padding: 20, gap: 24 }}
    >
      {/* 인사 */}
      <View style={{ gap: 4 }}>
        <Text style={{ ...typography.h1, color: colors.textMain }}>
          안녕하세요, {user?.name ?? ""}님
        </Text>
        <Text style={{ fontSize: 15, color: colors.textSub }}>분실물 현황을 확인하세요.</Text>
      </View>

      {/* 폐기 직전 분실물 */}
      {(expiring.data?.items?.length ?? 0) > 0 && (
        <View
          style={{
            backgroundColor: "#FFF7ED",
            borderRadius: 16,
            padding: 16,
            gap: 12,
            borderLeftWidth: 4,
            borderLeftColor: colors.warning,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#9A3412" }}>
            ⚠️ 폐기 직전 분실물
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {expiring.data!.items.map((item) => (
              <View
                key={item.id}
                style={{
                  width: 148,
                  backgroundColor: colors.cardBg,
                  borderRadius: 12,
                  padding: 12,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: "#FED7AA",
                  ...shadow,
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: colors.textMain }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textSub }}>{item.category}</Text>
                <Text style={{ ...typography.caption, color: colors.warning, fontWeight: "600" }}>
                  {item.foundAt}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 분실물 되찾는 방법 */}
      <View style={{ gap: 12 }}>
        <Text style={{ ...typography.h2, color: colors.textMain }}>분실물 되찾는 방법</Text>
        {STEPS.map((step, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              gap: 14,
              backgroundColor: colors.cardBg,
              borderRadius: 14,
              padding: 14,
              alignItems: "flex-start",
              ...shadow,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textMain }}>
                {step.title}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSub, lineHeight: 18 }}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
