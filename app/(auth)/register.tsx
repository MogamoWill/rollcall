import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      Alert.alert(
        "Inscription reussie",
        "Verifie ton email pour confirmer ton compte",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur d'inscription";
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: "#0F172A" }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-8 items-center">
          <View style={{ width: "100%", maxWidth: 420 }}>
          {/* Logo */}
          <View className="items-center mb-10">
            <View
              className="w-20 h-20 rounded-2xl items-center justify-center mb-5"
              style={{ backgroundColor: "#1a6bff" }}
            >
              <MaterialCommunityIcons
                name="movie-open-outline"
                size={44}
                color="#FFFFFF"
              />
            </View>
            <Text
              className="text-4xl font-bold mb-2"
              style={{ color: "#FFFFFF" }}
            >
              RollCall
            </Text>
            <Text className="text-base" style={{ color: "#94A3B8" }}>
              Creer un compte
            </Text>
          </View>

          <View className="mb-6" style={{ gap: 14 }}>
            <View>
              <Text
                className="text-xs font-semibold uppercase mb-1.5 tracking-wider"
                style={{ color: "#64748B" }}
              >
                Email
              </Text>
              <TextInput
                className="rounded-xl px-4 py-3.5 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="ton@email.com"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View>
              <Text
                className="text-xs font-semibold uppercase mb-1.5 tracking-wider"
                style={{ color: "#64748B" }}
              >
                Mot de passe
              </Text>
              <TextInput
                className="rounded-xl px-4 py-3.5 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Min. 6 caracteres"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <View>
              <Text
                className="text-xs font-semibold uppercase mb-1.5 tracking-wider"
                style={{ color: "#64748B" }}
              >
                Confirmer
              </Text>
              <TextInput
                className="rounded-xl px-4 py-3.5 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#475569"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            className="rounded-xl py-4 items-center mb-8"
            style={{
              backgroundColor: loading ? "#334155" : "#1a6bff",
            }}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">
              {loading ? "Inscription..." : "S'inscrire"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text style={{ color: "#64748B" }}>Deja un compte ? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="font-bold" style={{ color: "#1a6bff" }}>
                  Se connecter
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
