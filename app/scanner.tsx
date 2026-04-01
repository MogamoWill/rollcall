import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F172A",
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
        }}
      >
        <MaterialCommunityIcons name="camera-off" size={64} color="#334155" />
        <Text
          style={{
            color: "#F1F5F9",
            fontSize: 18,
            fontWeight: "700",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Acces camera requis
        </Text>
        <Text style={{ color: "#64748B", textAlign: "center", marginTop: 8 }}>
          Pour scanner les QR codes de ton materiel
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#E8A838",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            marginTop: 24,
          }}
          onPress={requestPermission}
        >
          <Text style={{ color: "#0F172A", fontWeight: "700" }}>
            Autoriser la camera
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Text style={{ color: "#E8A838" }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    router.back();
    router.push({ pathname: "/(tabs)/equipment", params: { scannedId: data } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {/* Overlay */}
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: 60,
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            Scanner QR Code
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Scan frame */}
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 250,
              height: 250,
              borderWidth: 2,
              borderColor: "#E8A838",
              borderRadius: 16,
            }}
          />
          <Text style={{ color: "#FFFFFF", marginTop: 16, fontSize: 14 }}>
            Pointe le QR code de ton equipement
          </Text>
        </View>

        {/* Bottom */}
        <View style={{ paddingBottom: 60, alignItems: "center" }}>
          {scanned && (
            <TouchableOpacity
              style={{
                backgroundColor: "#E8A838",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
              onPress={() => setScanned(false)}
            >
              <Text style={{ color: "#0F172A", fontWeight: "700" }}>
                Scanner a nouveau
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
