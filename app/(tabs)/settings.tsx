import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const [mondayApiKey, setMondayApiKey] = useState("");
  const [mondayConnected, setMondayConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .single();
    if (data) {
      setMondayConnected(!!data.monday_api_key);
      setMicrosoftConnected(!!data.microsoft_token);
    }
  };

  const handleSaveMondayKey = async () => {
    if (!mondayApiKey) {
      Alert.alert("Erreur", "Entre ta cle API Monday");
      return;
    }
    try {
      await supabase.from("user_settings").upsert({
        user_id: user?.id,
        monday_api_key: mondayApiKey,
      });
      setMondayConnected(true);
      setMondayApiKey("");
      Alert.alert("Succes", "Monday.com connecte !");
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder la cle");
    }
  };

  const handleDisconnectMonday = async () => {
    await supabase
      .from("user_settings")
      .update({ monday_api_key: null })
      .eq("user_id", user?.id);
    setMondayConnected(false);
  };

  const handleSignOut = () => {
    Alert.alert("Deconnexion", "Tu veux te deconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Deconnecter", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: "#0F172A" }}>
      <View style={{ maxWidth: 720, width: "100%", alignSelf: "center" }}>
      <View className="px-5 pt-4 pb-8">
        {/* Profile */}
        <View
          className="rounded-xl p-5 mb-4"
          style={{
            backgroundColor: "#1E293B",
            borderWidth: 1,
            borderColor: "#334155",
          }}
        >
          <View className="flex-row items-center" style={{ gap: 14 }}>
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: "#E8A83820" }}
            >
              <Text className="text-xl font-bold" style={{ color: "#E8A838" }}>
                {user?.email?.charAt(0).toUpperCase() ?? "?"}
              </Text>
            </View>
            <View>
              <Text className="text-lg font-bold" style={{ color: "#F1F5F9" }}>
                {user?.email ?? "Utilisateur"}
              </Text>
              <Text className="text-sm" style={{ color: "#64748B" }}>
                Compte RollCall
              </Text>
            </View>
          </View>
        </View>

        {/* Integrations */}
        <View className="mb-2 mt-4" style={{ borderLeftWidth: 3, borderLeftColor: "#E8A838", paddingLeft: 10 }}>
          <Text
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#94A3B8" }}
          >
            Intégrations
          </Text>
        </View>

        {/* Monday.com */}
        <View
          className="rounded-xl p-4 mb-2"
          style={{
            backgroundColor: "#1E293B",
            borderWidth: 1,
            borderColor: "#334155",
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#7C3AED20" }}
              >
                <MaterialCommunityIcons
                  name="view-dashboard"
                  size={20}
                  color="#7C3AED"
                />
              </View>
              <View>
                <Text
                  className="text-base font-semibold"
                  style={{ color: "#F1F5F9" }}
                >
                  Monday.com
                </Text>
                <Text className="text-xs" style={{ color: "#64748B" }}>
                  {mondayConnected ? "Connecte" : "Non connecte"}
                </Text>
              </View>
            </View>
            {mondayConnected && (
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#22C55E20" }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: "#22C55E" }}
                >
                  Actif
                </Text>
              </View>
            )}
          </View>

          {mondayConnected ? (
            <TouchableOpacity
              className="rounded-xl py-2.5 items-center"
              style={{ borderWidth: 1, borderColor: "#EF444440" }}
              onPress={handleDisconnectMonday}
            >
              <Text
                className="font-medium text-sm"
                style={{ color: "#EF4444" }}
              >
                Deconnecter
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 8 }}>
              <TextInput
                className="rounded-xl px-4 py-2.5 text-sm"
                style={{
                  backgroundColor: "#0F172A",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Cle API Monday.com"
                placeholderTextColor="#475569"
                value={mondayApiKey}
                onChangeText={setMondayApiKey}
                secureTextEntry
              />
              <TouchableOpacity
                className="rounded-xl py-2.5 items-center"
                style={{ backgroundColor: "#7C3AED" }}
                onPress={handleSaveMondayKey}
              >
                <Text className="text-white font-semibold text-sm">
                  Connecter
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Microsoft (Teams / Outlook) */}
        <View
          className="rounded-xl p-4 mb-2"
          style={{
            backgroundColor: "#1E293B",
            borderWidth: 1,
            borderColor: "#334155",
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#2563EB20" }}
              >
                <MaterialCommunityIcons
                  name="microsoft-outlook"
                  size={20}
                  color="#2563EB"
                />
              </View>
              <View>
                <Text
                  className="text-base font-semibold"
                  style={{ color: "#F1F5F9" }}
                >
                  Microsoft 365
                </Text>
                <Text className="text-xs" style={{ color: "#64748B" }}>
                  Teams & Outlook Calendar
                </Text>
              </View>
            </View>
            {microsoftConnected ? (
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#22C55E20" }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: "#22C55E" }}
                >
                  Actif
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: "#2563EB" }}
              >
                <Text className="text-white font-semibold text-sm">
                  Connecter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* App info */}
        <View className="mb-2 mt-6" style={{ borderLeftWidth: 3, borderLeftColor: "#E8A838", paddingLeft: 10 }}>
          <Text
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#94A3B8" }}
          >
            Application
          </Text>
        </View>

        <View
          className="rounded-xl"
          style={{
            backgroundColor: "#1E293B",
            borderWidth: 1,
            borderColor: "#334155",
          }}
        >
          <View
            className="flex-row items-center justify-between p-4"
            style={{ borderBottomWidth: 1, borderBottomColor: "#334155" }}
          >
            <Text className="text-base" style={{ color: "#F1F5F9" }}>
              Version
            </Text>
            <Text className="text-sm" style={{ color: "#64748B" }}>
              1.0.0 (MVP)
            </Text>
          </View>
          <TouchableOpacity className="p-4" onPress={handleSignOut}>
            <Text
              className="text-base font-semibold"
              style={{ color: "#EF4444" }}
            >
              Se deconnecter
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </ScrollView>
  );
}
