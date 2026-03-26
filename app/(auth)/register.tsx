import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

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
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      Alert.alert(
        "Inscription réussie",
        "Vérifie ton email pour confirmer ton compte",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur d'inscription";
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-slate-900">🎬 RollCall</Text>
          <Text className="text-lg text-slate-500 mt-2">Créer un compte</Text>
        </View>

        <View className="gap-4 mb-6">
          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 bg-slate-50"
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 bg-slate-50"
            placeholder="Mot de passe"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 bg-slate-50"
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className="bg-brand-500 rounded-xl py-4 items-center mb-8"
          onPress={handleRegister}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "Inscription..." : "S'inscrire"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-slate-500">Déjà un compte ? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-brand-500 font-semibold">Se connecter</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
