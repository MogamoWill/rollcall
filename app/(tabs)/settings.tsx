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
import { Feather } from "@expo/vector-icons";
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
      Alert.alert("Erreur", "Entre ta clé API Monday");
      return;
    }
    try {
      await supabase.from("user_settings").upsert({
        user_id: user?.id,
        monday_api_key: mondayApiKey,
      });
      setMondayConnected(true);
      setMondayApiKey("");
      Alert.alert("Succès", "Monday.com connecté !");
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder la clé");
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
    Alert.alert("Déconnexion", "Tu veux te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-8">
        {/* Profile */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-brand-100 items-center justify-center">
              <Text className="text-xl font-bold text-brand-600">
                {user?.email?.charAt(0).toUpperCase() ?? "?"}
              </Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-slate-900">
                {user?.email ?? "Utilisateur"}
              </Text>
              <Text className="text-sm text-slate-500">Compte RollCall</Text>
            </View>
          </View>
        </View>

        {/* Integrations */}
        <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-1">
          Intégrations
        </Text>

        {/* Monday.com */}
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center">
                <Feather name="trello" size={20} color="#7C3AED" />
              </View>
              <View>
                <Text className="text-base font-semibold text-slate-900">
                  Monday.com
                </Text>
                <Text className="text-xs text-slate-500">
                  {mondayConnected ? "Connecté" : "Non connecté"}
                </Text>
              </View>
            </View>
            {mondayConnected && (
              <View className="bg-green-50 px-2 py-1 rounded-full">
                <Text className="text-green-600 text-xs font-medium">
                  Actif
                </Text>
              </View>
            )}
          </View>

          {mondayConnected ? (
            <TouchableOpacity
              className="border border-red-200 rounded-xl py-2.5 items-center"
              onPress={handleDisconnectMonday}
            >
              <Text className="text-red-500 font-medium text-sm">
                Déconnecter
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="gap-2">
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50"
                placeholder="Clé API Monday.com"
                placeholderTextColor="#94A3B8"
                value={mondayApiKey}
                onChangeText={setMondayApiKey}
                secureTextEntry
              />
              <TouchableOpacity
                className="bg-purple-500 rounded-xl py-2.5 items-center"
                onPress={handleSaveMondayKey}
              >
                <Text className="text-white font-medium text-sm">
                  Connecter
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Microsoft (Teams / Outlook) */}
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                <Feather name="calendar" size={20} color="#2563EB" />
              </View>
              <View>
                <Text className="text-base font-semibold text-slate-900">
                  Microsoft 365
                </Text>
                <Text className="text-xs text-slate-500">
                  Teams & Outlook Calendar
                </Text>
              </View>
            </View>
            {microsoftConnected ? (
              <View className="bg-green-50 px-2 py-1 rounded-full">
                <Text className="text-green-600 text-xs font-medium">
                  Actif
                </Text>
              </View>
            ) : (
              <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-xl">
                <Text className="text-white font-medium text-sm">
                  Connecter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* App info */}
        <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-1">
          Application
        </Text>

        <View className="bg-white rounded-2xl border border-slate-100">
          <View className="flex-row items-center justify-between p-4 border-b border-slate-50">
            <Text className="text-base text-slate-900">Version</Text>
            <Text className="text-sm text-slate-500">1.0.0 (MVP)</Text>
          </View>
          <TouchableOpacity
            className="p-4"
            onPress={handleSignOut}
          >
            <Text className="text-base text-red-500 font-medium">
              Se déconnecter
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
