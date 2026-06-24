import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { getIntroduce, updateIntroduce } from "@/api/introduce";
import { AppButton } from "@/components/app-button";
import { FeedbackBanner, type FeedbackMessage } from "@/components/feedback-banner";
import { MarkdownContent } from "@/components/markdown-content";
import { Screen } from "@/components/screen";
import { colors, radius } from "@/theme";

export default function AdminIntroduceScreen() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const introduce = useQuery({
    queryKey: ["introduce"],
    queryFn: getIntroduce,
  });

  useEffect(() => {
    if (introduce.data?.content !== undefined) {
      setContent(introduce.data.content);
    }
  }, [introduce.data?.content]);

  const save = useMutation({
    mutationFn: () => updateIntroduce(content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["introduce"] });
      setFeedback({ tone: "success", title: "저장 완료", message: "소개글이 저장되었습니다." });
    },
    onError: () => setFeedback({ tone: "error", title: "저장 실패", message: "소개글 저장에 실패했습니다." }),
  });

  return (
    <Screen title="소개글 관리" subtitle="서비스 소개 마크다운 콘텐츠를 수정합니다.">
      {introduce.isLoading ? <Text style={{ color: colors.textSub }}>불러오는 중</Text> : null}
      {introduce.error ? (
        <Text selectable style={{ color: colors.danger }}>
          소개글을 불러오지 못했습니다.
        </Text>
      ) : null}
      <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />
      <View style={{ gap: 12 }}>
        <TextInput
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholder="소개글을 입력하세요."
          placeholderTextColor={colors.textMuted}
          style={{
            minHeight: 260,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            color: colors.textMain,
            backgroundColor: colors.cardBg,
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
        <AppButton title="저장" onPress={() => save.mutate()} loading={save.isPending} />
      </View>
    </Screen>
  );
}
