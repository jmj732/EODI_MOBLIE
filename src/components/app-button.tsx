import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, radius } from "@/theme";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  icon?: ComponentProps<typeof Ionicons>["name"];
  right?: ReactNode;
};

const bgColors = {
  primary: colors.primary,
  secondary: "#F3F4F6",
  danger: colors.danger,
};

const textColors = {
  primary: "#FFFFFF",
  secondary: "#374151",
  danger: "#FFFFFF",
};

export function AppButton({ title, onPress, disabled, loading, variant = "primary", icon, right }: AppButtonProps) {
  const isDisabled = disabled || loading;
  const textColor = isDisabled ? colors.textMuted : textColors[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: radius.button,
        backgroundColor: isDisabled ? "#E5E7EB" : bgColors[variant],
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#374151" : "#FFFFFF"} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} color={textColor} size={18} /> : null}
          <Text
            style={{
              color: textColor,
              fontWeight: "700",
              fontSize: 15,
            }}
          >
            {title}
          </Text>
          {right ? <View>{right}</View> : null}
        </>
      )}
    </Pressable>
  );
}
