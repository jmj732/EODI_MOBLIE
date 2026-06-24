import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { logout as logoutApi } from "@/api/auth";
import { getIntroduce, updateIntroduce } from "@/api/introduce";
import { FeedbackBanner, type FeedbackMessage } from "@/components/feedback-banner";
import { MarkdownContent } from "@/components/markdown-content";
import { useAuthStore } from "@/stores/auth-store";
import { colors, radius, shadow, typography } from "@/theme";
import { confirmDestructive } from "@/utils/confirm";

export default function AdminMoreScreen() {
  const queryClient = useQueryClient();
  const { user, accessToken, clearSession } = useAuthStore();
  const introduce = useQuery({
    queryKey: ["introduce"],
    queryFn: getIntroduce,
  });
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    if (introduce.data?.content !== undefined) {
      setContent(introduce.data.content);
    }
  }, [introduce.data?.content]);

  const saveIntroduce = useMutation({
    mutationFn: () => updateIntroduce(content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["introduce"] });
      setFeedback({ tone: "success", title: "저장 완료", message: "소개글이 저장되었습니다." });
    },
    onError: () => setFeedback({ tone: "error", title: "저장 실패", message: "소개글 저장에 실패했습니다." }),
  });

  const handleLogout = () => {
    confirmDestructive({
      title: "로그아웃",
      message: "관리자 계정에서 로그아웃할까요?",
      confirmText: "로그아웃",
      onConfirm: async () => {
        await clearSession();
        queryClient.clear();
        if (accessToken) {
          void logoutApi(accessToken).catch(() => {
            // Local logout is already complete.
          });
        }
      },
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.appBg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 5 }}>
        <Text style={{ ...typography.h1, color: colors.textMain }}>더보기</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSub }}>
          관리자 정보와 서비스 소개글을 관리합니다.
        </Text>
      </View>
      <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      <View
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: radius.card,
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadow,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              backgroundColor: colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="shield-checkmark" color={colors.primary} size={25} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: colors.textMain }}>{user?.name ?? "관리자"}</Text>
            <Text style={{ fontSize: 13, color: colors.textSub }} numberOfLines={1}>
              {user?.email ?? "이메일 없음"}
            </Text>
          </View>
        </View>
        <View
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: radius.chip,
            backgroundColor: colors.primaryBg,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "900", color: colors.primary }}>ADMIN</Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: radius.card,
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="document-text-outline" color={colors.accent} size={20} />
          <Text style={{ fontSize: 16, fontWeight: "900", color: colors.textMain }}>소개글 관리</Text>
        </View>
        {introduce.isLoading ? <Text style={{ color: colors.textSub }}>소개글을 불러오는 중입니다.</Text> : null}
        {introduce.isError ? <Text style={{ color: colors.danger }}>소개글을 불러오지 못했습니다.</Text> : null}
        <TextInput
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholder="서비스 소개글을 입력하세요."
          placeholderTextColor={colors.textMuted}
          style={{
            minHeight: 220,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            color: colors.textMain,
            backgroundColor: colors.appBg,
            lineHeight: 20,
          }}
        />
        {content.trim() ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.card,
              backgroundColor: colors.cardBg,
              padding: 14,
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "900", color: colors.textMain }}>미리보기</Text>
            <MarkdownContent content={content} />
          </View>
        ) : null}
        <Pressable
          disabled={saveIntroduce.isPending || !content.trim()}
          onPress={() => saveIntroduce.mutate()}
          style={{
            minHeight: 48,
            borderRadius: radius.button,
            backgroundColor: saveIntroduce.isPending || !content.trim() ? "#E5E7EB" : colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "900", color: saveIntroduce.isPending || !content.trim() ? colors.textMuted : "#FFFFFF" }}>
            {saveIntroduce.isPending ? "저장 중" : "소개글 저장"}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => ({
          minHeight: 52,
          borderRadius: radius.button,
          backgroundColor: colors.dangerBg,
          borderWidth: 1,
          borderColor: "#FECACA",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <Ionicons name="log-out-outline" color={colors.danger} size={20} />
        <Text style={{ fontSize: 15, fontWeight: "900", color: colors.danger }}>로그아웃</Text>
      </Pressable>
    </ScrollView>
  );
}
