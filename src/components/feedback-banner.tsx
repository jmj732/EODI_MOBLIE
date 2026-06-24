import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { colors, radius } from "@/theme";

export type FeedbackTone = "success" | "error" | "warning" | "info";

export type FeedbackMessage = {
  tone: FeedbackTone;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const toneMap = {
  success: {
    icon: "checkmark-circle-outline",
    color: colors.success,
    backgroundColor: colors.successBg,
    borderColor: "#BBF7D0",
  },
  error: {
    icon: "alert-circle-outline",
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderColor: "#FECACA",
  },
  warning: {
    icon: "warning-outline",
    color: colors.warning,
    backgroundColor: colors.warningBg,
    borderColor: "#FDE68A",
  },
  info: {
    icon: "information-circle-outline",
    color: colors.primary,
    backgroundColor: colors.primaryBg,
    borderColor: "#BFDBFE",
  },
} satisfies Record<
  FeedbackTone,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    backgroundColor: string;
    borderColor: string;
  }
>;

export function FeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: FeedbackMessage | null;
  onDismiss?: () => void;
}) {
  if (!feedback) return null;

  const tone = toneMap[feedback.tone];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        padding: 12,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: tone.borderColor,
        backgroundColor: tone.backgroundColor,
      }}
    >
      <Ionicons name={tone.icon} color={tone.color} size={20} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 14, fontWeight: "900", color: colors.textMain }}>{feedback.title}</Text>
        {feedback.message ? <Text style={{ fontSize: 13, lineHeight: 18, color: colors.textSub }}>{feedback.message}</Text> : null}
        {feedback.actionLabel && feedback.onAction ? (
          <Pressable onPress={feedback.onAction} style={{ alignSelf: "flex-start", paddingTop: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: "900", color: tone.color }}>{feedback.actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" color={colors.textMuted} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}
