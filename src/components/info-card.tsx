import { Text, View } from "react-native";

import { colors, radius, shadow, typography } from "@/theme";

type InfoCardProps = {
  title: string;
  value?: string | number | null;
  detail?: string;
};

export function InfoCard({ title, value, detail }: InfoCardProps) {
  return (
    <View
      style={{
        gap: 6,
        borderRadius: radius.card,
        backgroundColor: colors.cardBg,
        padding: 16,
        ...shadow,
      }}
    >
      <Text selectable style={{ ...typography.caption, color: colors.textSub }}>
        {title}
      </Text>
      {value !== undefined ? (
        <Text selectable style={{ fontSize: 22, fontWeight: "700", color: colors.textMain }}>
          {value}
        </Text>
      ) : null}
      {detail ? (
        <Text selectable style={{ fontSize: 14, lineHeight: 20, color: colors.textSub }}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}
