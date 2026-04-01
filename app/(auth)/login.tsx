import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { showAlert } from "@/lib/alert";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      showAlert("Erreur", "Remplis tous les champs");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur de connexion";
      showAlert("Erreur", message);
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
      const message =
        error instanceof Error ? error.message : "Erreur Google";
      showAlert("Erreur", message);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur Apple";
      showAlert("Erreur", message);
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
          {/* Logo & Branding */}
          <View className="items-center mb-10">
            <View
              className="w-20 h-20 rounded-xl items-center justify-center mb-5"
              style={{ backgroundColor: "#E8A838" }}
            >
              <MaterialCommunityIcons
                name="movie-open-outline"
                size={44}
                color="#FFFFFF"
              />
            </View>
            <Text
              className="text-4xl font-bold mb-2"
              style={{ color: "#FDF4E7" }}
            >
              RollCall
            </Text>
            <Text className="text-base" style={{ color: "#94A3B8" }}>
              Ton assistant réalisateur
            </Text>
          </View>

          {/* Email/Password */}
          <View className="mb-6" style={{ gap: 14 }}>
            <View>
              <Text
                className="text-xs font-bold uppercase mb-1.5 tracking-widest"
                style={{ color: "#64748B", borderLeftWidth: 2, borderLeftColor: "#E8A838", paddingLeft: 8 }}
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
                className="text-xs font-bold uppercase mb-1.5 tracking-widest"
                style={{ color: "#64748B", borderLeftWidth: 2, borderLeftColor: "#E8A838", paddingLeft: 8 }}
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
                placeholder="Ton mot de passe"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className="rounded-xl py-4 items-center mb-6"
            style={{
              backgroundColor: loading ? "#334155" : "#E8A838",
            }}
            onPress={handleEmailLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text className="font-bold text-base" style={{ color: "#0F172A" }}>
              {loading ? "Connexion..." : "Se connecter"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px" style={{ backgroundColor: "#1E293B" }} />
            <Text className="mx-4 text-sm" style={{ color: "#475569" }}>
              ou
            </Text>
            <View className="flex-1 h-px" style={{ backgroundColor: "#1E293B" }} />
          </View>

          {/* Social Login */}
          <View className="mb-8" style={{ gap: 12 }}>
            <TouchableOpacity
              className="flex-row items-center justify-center rounded-xl py-3.5"
              style={{
                borderWidth: 1,
                borderColor: "#E8A83840",
                backgroundColor: "#1E293B",
                gap: 10,
              }}
              onPress={handleGoogleLogin}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="google" size={20} color="#E2E8F0" />
              <Text className="font-semibold text-base" style={{ color: "#E2E8F0" }}>
                Connexion avec Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-center rounded-xl py-3.5"
              style={{
                backgroundColor: "#FFFFFF",
                gap: 10,
              }}
              onPress={handleAppleLogin}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="apple" size={22} color="#000000" />
              <Text className="font-semibold text-base" style={{ color: "#000000" }}>
                Connexion avec Apple
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View className="flex-row justify-center">
            <Text style={{ color: "#64748B" }}>Pas encore de compte ? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="font-bold" style={{ color: "#E8A838" }}>
                  S'inscrire
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
