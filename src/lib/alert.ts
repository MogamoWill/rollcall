import { Alert, Platform } from "react-native";

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

/**
 * Cross-platform alert that works on both web and native.
 * On web, Alert.alert is a no-op, so we use window.confirm/alert.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
) {
  if (Platform.OS === "web") {
    if (buttons && buttons.length > 1) {
      // Confirmation dialog with cancel + action
      const actionButton = buttons.find((b) => b.style !== "cancel");
      const confirmed = window.confirm(`${title}\n${message ?? ""}`);
      if (confirmed && actionButton?.onPress) {
        actionButton.onPress();
      }
    } else if (buttons && buttons.length === 1 && buttons[0].onPress) {
      window.alert(`${title}\n${message ?? ""}`);
      buttons[0].onPress();
    } else {
      window.alert(`${title}${message ? `\n${message}` : ""}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
