import { Alert, Platform } from "react-native";

type ConfirmDestructiveOptions = {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
};

export function confirmDestructive({ title, message, confirmText, onConfirm }: ConfirmDestructiveOptions) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: "취소", style: "cancel" },
    {
      text: confirmText,
      style: "destructive",
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
