import { ActivityIndicator, Pressable, Text } from "react-native";

import { colors, radius } from "@/theme";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
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

export function AppButton({ title, onPress, disabled, loading, variant = "primary" }: AppButtonProps) {
  const isDisabled = disabled || loading;
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
        paddingHorizontal: 16,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#374151" : "#FFFFFF"} />
      ) : (
        <Text
          style={{
            color: isDisabled ? colors.textMuted : textColors[variant],
            fontWeight: "600",
            fontSize: 15,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
