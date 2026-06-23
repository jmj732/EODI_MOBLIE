import { PropsWithChildren } from "react";
import { ScrollView, Text, View } from "react-native";

import { colors, typography } from "@/theme";

type ScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

export function Screen({ title, subtitle, children }: ScreenProps) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.appBg }}
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      {(title || subtitle) && (
        <View style={{ gap: 4 }}>
          {title ? (
            <Text style={{ ...typography.h1, color: colors.textMain }}>{title}</Text>
          ) : null}
          {subtitle ? (
            <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textSub }}>{subtitle}</Text>
          ) : null}
        </View>
      )}
      {children}
    </ScrollView>
  );
}
