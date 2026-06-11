export const colors = {
  primary: "#2563EB",
  primaryBg: "#EFF6FF",
  warning: "#F97316",
  success: "#10B981",
  danger: "#EF4444",
  appBg: "#F9FAFB",
  cardBg: "#FFFFFF",
  border: "#E5E7EB",
  textMain: "#111827",
  textSub: "#6B7280",
  textMuted: "#9CA3AF",
};

export const typography = {
  h1: { fontSize: 22, fontWeight: "700" as const, lineHeight: 30 },
  h2: { fontSize: 18, fontWeight: "600" as const, lineHeight: 25 },
  body: { fontSize: 15, fontWeight: "500" as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 15 },
};

export const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
};

export const radius = {
  card: 16,
  button: 12,
  chip: 999,
};
