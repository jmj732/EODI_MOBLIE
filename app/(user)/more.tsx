import { router } from "expo-router";
import { Alert, Linking, Text, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { Screen } from "@/components/screen";
import { useAuthStore } from "@/stores/auth-store";
import { colors, shadow } from "@/theme";

// TODO: 실제 카카오 오픈채팅 URL로 교체
const KAKAO_CHAT_URL = "https://open.kakao.com/o/placeholder";

const REWARD_RULES = [
  "분실물 습득 후 즉시 생활부에 신고한 학생에게 상점 1점 부여",
  "동일 학기 내 3회 이상 신고 시 추가 상점 1점 부여",
  "습득 후 24시간 이내 미신고 시 혜택 미적용",
];

export default function MoreScreen() {
  const { user, clearSession } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/");
        },
      },
    ]);
  };

  const handleChat = async () => {
    const canOpen = await Linking.canOpenURL(KAKAO_CHAT_URL);
    if (canOpen) {
      await Linking.openURL(KAKAO_CHAT_URL);
    } else {
      Alert.alert("오류", "카카오톡을 열 수 없습니다.");
    }
  };

  return (
    <Screen title="더보기">
      {/* 프로필 */}
      <View style={{ backgroundColor: colors.cardBg, borderRadius: 16, padding: 16, gap: 8, ...shadow }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textMain }}>{user?.name}</Text>
        <Text style={{ fontSize: 14, color: colors.textSub }}>{user?.email}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: colors.primaryBg,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>{user?.role}</Text>
          </View>
          {user?.studentCode && (
            <View
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#F3F4F6" }}
            >
              <Text style={{ fontSize: 12, color: colors.textSub }}>학번 {user.studentCode}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 상벌점제 규정 */}
      <View style={{ backgroundColor: colors.cardBg, borderRadius: 16, padding: 16, gap: 10, ...shadow }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textMain }}>상벌점제 규정</Text>
        {REWARD_RULES.map((rule, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>·</Text>
            <Text style={{ fontSize: 13, color: colors.textSub, flex: 1, lineHeight: 18 }}>{rule}</Text>
          </View>
        ))}
      </View>

      {/* 문의 */}
      <AppButton title="1:1 오픈채팅 문의" variant="secondary" onPress={() => void handleChat()} />

      {/* 로그아웃 */}
      <AppButton title="로그아웃" variant="danger" onPress={handleLogout} />
    </Screen>
  );
}
