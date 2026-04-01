import QRCode from "react-native-qrcode-svg";
import { View, Text } from "react-native";

interface Props {
  value: string;
  size?: number;
  label?: string;
}

export function EquipmentQRCode({ value, size = 200, label }: Props) {
  return (
    <View
      style={{
        alignItems: "center",
        padding: 20,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
      }}
    >
      <QRCode
        value={value}
        size={size}
        backgroundColor="#FFFFFF"
        color="#0F172A"
      />
      {label && (
        <Text
          style={{
            marginTop: 12,
            fontSize: 14,
            fontWeight: "600",
            color: "#0F172A",
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}
