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
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import { Feather } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur de connexion";
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur Google";
      Alert.alert("Erreur", message);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur Apple";
      Alert.alert("Erreur", message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        {/* Header */}
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-slate-900">🎬 RollCall</Text>
          <Text className="text-lg text-slate-500 mt-2">
            Ton assistant tournage
          </Text>
        </View>

        {/* Email/Password */}
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
        </View>

        <TouchableOpacity
          className="bg-brand-500 rounded-xl py-4 items-center mb-6"
          onPress={handleEmailLogin}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "Connexion..." : "Se connecter"}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="mx-4 text-slate-400 text-sm">ou</Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        {/* Social Login */}
        <View className="gap-3 mb-8">
          <TouchableOpacity
            className="flex-row items-center justify-center border border-slate-200 rounded-xl py-3.5 gap-3"
            onPress={handleGoogleLogin}
          >
            <Feather name="mail" size={20} color="#0F172A" />
            <Text className="text-slate-900 font-medium text-base">
              Continuer avec Google
            </Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              className="flex-row items-center justify-center bg-black rounded-xl py-3.5 gap-3"
              onPress={handleAppleLogin}
            >
              <Feather name="smartphone" size={20} color="#FFFFFF" />
              <Text className="text-white font-medium text-base">
                Continuer avec Apple
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Register link */}
        <View className="flex-row justify-center">
          <Text className="text-slate-500">Pas encore de compte ? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-brand-500 font-semibold">S'inscrire</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
