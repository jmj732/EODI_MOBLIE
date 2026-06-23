import { Text, View } from "react-native";

import type { ClaimStatus } from "@/types/item";

const config: Record<ClaimStatus, { label: string; bg: string; color: string }> = {
  PENDING: { label: "승인 대기", bg: "#FFF7ED", color: "#C2410C" },
  APPROVED: { label: "승인 완료", bg: "#ECFDF5", color: "#065F46" },
  REJECTED: { label: "반려됨", bg: "#FEF2F2", color: "#991B1B" },
};

export function StatusBadge({ status }: { status: ClaimStatus }) {
  const { label, bg, color } = config[status];
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: bg,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color }}>{label}</Text>
    </View>
  );
}
