import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useEquipmentStore } from "@/stores/equipmentStore";
import {
  UNIVERSE_LABELS,
  type EquipmentUniverse,
  type Equipment,
} from "@/types";
import {
  EQUIPMENT_FIELDS,
  getAttributeSummary,
  type EquipmentFieldConfig,
} from "@/constants/equipmentFields";
import { EquipmentQRCode } from "@/components/QRCode";
import {
  identifyFromPhoto,
  searchEquipment,
  type IdentifiedEquipment,
} from "@/lib/equipmentAI";

const UNIVERSES = Object.keys(UNIVERSE_LABELS) as EquipmentUniverse[];

const UNIVERSE_MCI_ICONS: Record<EquipmentUniverse, string> = {
  camera: "camera",
  lens: "camera-iris",
  lighting: "flashlight",
  audio: "microphone",
  cable: "cable-data",
  power: "battery-charging",
  grip: "arrow-expand-all",
  monitoring: "monitor",
  storage: "harddisk",
  accessory: "wrench",
};

// Category tabs as requested
const CATEGORY_TABS: { key: EquipmentUniverse | "all"; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "camera", label: "Boitiers" },
  { key: "lens", label: "Objectifs" },
  { key: "cable", label: "Cables" },
  { key: "power", label: "Multiprises" },
  { key: "accessory", label: "Color Checker" },
  { key: "lighting", label: "Lumieres" },
  { key: "audio", label: "Audio" },
  { key: "grip", label: "Grip" },
  { key: "monitoring", label: "Monitoring" },
  { key: "storage", label: "Stockage" },
];

const INITIAL_NEW_ITEM = {
  name: "",
  brand: "",
  model: "",
  serial_number: "",
  universe: "camera" as EquipmentUniverse,
  is_high_value: false,
  notes: "",
  attributes: {} as Record<string, any>,
};

export default function EquipmentScreen() {
  const { items, loading, fetchEquipment, addEquipment, deleteEquipment } =
    useEquipmentStore();
  const [selectedCategory, setSelectedCategory] = useState<
    EquipmentUniverse | "all"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ ...INITIAL_NEW_ITEM });
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { scannedId } = useLocalSearchParams<{ scannedId?: string }>();

  // AI identification state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIdentified, setAiIdentified] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IdentifiedEquipment[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyAIResult = useCallback(
    (result: IdentifiedEquipment) => {
      const universe = (
        UNIVERSES.includes(result.universe as EquipmentUniverse)
          ? result.universe
          : "accessory"
      ) as EquipmentUniverse;
      setNewItem((prev) => ({
        ...prev,
        universe,
        name: result.name || prev.name,
        brand: result.brand || prev.brand,
        model: result.model || prev.model,
        attributes: result.attributes || prev.attributes,
      }));
      setAiIdentified(result.name || result.brand + " " + result.model);
      setTimeout(() => setAiIdentified(null), 4000);
    },
    []
  );

  const handleTakePhoto = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert("Permission requise", "L'acces a la camera est necessaire pour identifier l'equipement.");
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) return;
      setShowCamera(false);
      setAiLoading(true);

      // Compress and convert to base64
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipulated.base64) {
        throw new Error("Failed to convert image to base64");
      }

      const result = await identifyFromPhoto(manipulated.base64);
      applyAIResult(result);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'identifier l'equipement. Reessayez ou remplissez manuellement.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (text.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        setAiLoading(true);
        const results = await searchEquipment(text);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setAiLoading(false);
      }
    }, 500);
  };

  const handleSelectSuggestion = (item: IdentifiedEquipment) => {
    applyAIResult(item);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  useEffect(() => {
    fetchEquipment().catch(() => {});
  }, [fetchEquipment]);

  // Handle scanned QR code result
  useEffect(() => {
    if (scannedId && items.length > 0) {
      // The QR code value is "rollcall:equipment:<id>" or just the id
      const itemId = scannedId.replace("rollcall:equipment:", "");
      const found = items.find(
        (i) => i.id === itemId || i.qr_code === scannedId
      );
      if (found) {
        setSelectedItem(found);
        setShowDetailModal(true);
      } else {
        Alert.alert("Non trouve", "Aucun equipement ne correspond a ce QR code");
      }
    }
  }, [scannedId, items]);

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((i) => i.universe === selectedCategory);

  const handleAdd = async () => {
    if (!newItem.name) {
      Alert.alert("Erreur", "Le nom est obligatoire");
      return;
    }
    try {
      await addEquipment(newItem);
      setShowAddModal(false);
      setNewItem({ ...INITIAL_NEW_ITEM });
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter l'equipement");
    }
  };

  const handleDelete = (item: Equipment) => {
    Alert.alert("Supprimer", `Supprimer ${item.name} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteEquipment(item.id).catch(() => {}),
      },
    ]);
  };

  const getUniverseCount = (universe: EquipmentUniverse | "all") =>
    universe === "all"
      ? items.length
      : items.filter((i) => i.universe === universe).length;

  const setAttribute = (key: string, value: any) => {
    setNewItem((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  };

  const handleUniverseChange = (u: EquipmentUniverse) => {
    setNewItem((prev) => ({
      ...prev,
      universe: u,
      attributes: {},
    }));
  };

  const renderField = (field: EquipmentFieldConfig) => {
    const value = newItem.attributes[field.key];

    if (field.type === "select" && field.options) {
      return (
        <View key={field.key} style={{ marginBottom: 14 }}>
          <Text
            className="text-sm font-medium mb-2"
            style={{ color: "#64748B" }}
          >
            {field.label}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {field.options.map((option) => {
              const isSelected = value === option;
              return (
                <TouchableOpacity
                  key={option}
                  className="mr-2 px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: isSelected ? "#E8A838" : "#1E293B",
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: "#334155",
                  }}
                  onPress={() =>
                    setAttribute(field.key, isSelected ? undefined : option)
                  }
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: isSelected ? "#FFFFFF" : "#94A3B8",
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    if (field.type === "text") {
      return (
        <View key={field.key} style={{ marginBottom: 14 }}>
          <TextInput
            className="rounded-xl px-4 py-3 text-base"
            style={{
              backgroundColor: "#1E293B",
              borderWidth: 1,
              borderColor: "#334155",
              color: "#F1F5F9",
            }}
            placeholder={field.placeholder || field.label}
            placeholderTextColor="#475569"
            value={value || ""}
            onChangeText={(t) => setAttribute(field.key, t || undefined)}
          />
        </View>
      );
    }

    if (field.type === "toggle") {
      return (
        <View
          key={field.key}
          className="flex-row items-center justify-between rounded-xl px-4 py-3"
          style={{
            backgroundColor: "#1E293B",
            borderWidth: 1,
            borderColor: "#334155",
            marginBottom: 14,
          }}
        >
          <Text
            className="text-base font-medium"
            style={{ color: "#F1F5F9" }}
          >
            {field.label}
          </Text>
          <Switch
            value={!!value}
            onValueChange={(v) => setAttribute(field.key, v || undefined)}
            trackColor={{ false: "#334155", true: "#E8A838" }}
            thumbColor="#FFFFFF"
          />
        </View>
      );
    }

    return null;
  };

  const universeFields = EQUIPMENT_FIELDS[newItem.universe] || [];

  return (
    <View className="flex-1" style={{ backgroundColor: "#0F172A" }}>
      <View style={{ maxWidth: 720, width: "100%", alignSelf: "center", flex: 1 }}>
      {/* Header with scan button + category tabs */}
      <View className="flex-row items-center pt-3 pb-2 px-4" style={{ gap: 8 }}>
        <TouchableOpacity
          style={{ backgroundColor: "#E8A83820", padding: 8, borderRadius: 8 }}
          onPress={() => router.push("/scanner")}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={22}
            color="#E8A838"
          />
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 44, flex: 1 }}
        >
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.key;
          const count = getUniverseCount(tab.key);
          return (
            <TouchableOpacity
              key={tab.key}
              className="mr-2 px-4 py-2 rounded-full flex-row items-center"
              style={{
                backgroundColor: isActive ? "#E8A838" : "#1E293B",
                borderWidth: isActive ? 0 : 1,
                borderColor: "#334155",
                gap: 6,
              }}
              onPress={() => setSelectedCategory(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: isActive ? "#FFFFFF" : "#94A3B8" }}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  className="rounded-full px-1.5 py-0.5"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.2)"
                      : "#334155",
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: isActive ? "#FFFFFF" : "#64748B" }}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      </View>

      {/* Equipment List */}
      <ScrollView className="flex-1 px-4 pt-3">
        {loading ? (
          <Text className="text-center mt-8" style={{ color: "#475569" }}>
            Chargement...
          </Text>
        ) : filteredItems.length === 0 ? (
          <View className="items-center mt-16">
            <MaterialCommunityIcons
              name="camera-off"
              size={52}
              color="#334155"
            />
            <Text className="mt-4 text-base" style={{ color: "#475569" }}>
              Aucun equipement
            </Text>
            <Text className="text-sm" style={{ color: "#334155" }}>
              Ajoute ton premier matos
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const summary = getAttributeSummary(item);
            return (
              <TouchableOpacity
                key={item.id}
                className="rounded-xl p-4 mb-2 flex-row items-center"
                style={{
                  backgroundColor: "#1E293B",
                  borderLeftWidth: 3,
                  borderLeftColor: "#E8A838",
                }}
                onLongPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: "#E8A83815" }}
                >
                  <MaterialCommunityIcons
                    name={
                      UNIVERSE_MCI_ICONS[item.universe] as keyof typeof MaterialCommunityIcons.glyphMap
                    }
                    size={22}
                    color="#E8A838"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-base font-semibold"
                    style={{ color: "#F1F5F9" }}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-sm" style={{ color: "#64748B" }}>
                    {[item.brand, item.model].filter(Boolean).join(" ") ||
                      UNIVERSE_LABELS[item.universe]}
                  </Text>
                  {summary ? (
                    <Text
                      className="text-xs mt-0.5"
                      style={{ color: "#94A3B8" }}
                    >
                      {summary}
                    </Text>
                  ) : null}
                </View>
                {item.is_high_value && (
                  <View
                    className="flex-row items-center px-2.5 py-1 rounded-full mr-2"
                    style={{ backgroundColor: "#F59E0B20", gap: 4 }}
                  >
                    <MaterialCommunityIcons
                      name="qrcode"
                      size={12}
                      color="#F59E0B"
                    />
                    <Text
                      className="text-xs font-bold"
                      style={{ color: "#F59E0B" }}
                    >
                      QR
                    </Text>
                  </View>
                )}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color="#334155"
                />
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-24" />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
        style={{
          backgroundColor: "#E8A838",
          shadowColor: "#E8A838",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>
      </View>

      {/* Detail Modal (QR code view) */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1" style={{ backgroundColor: "#0F172A" }}>
          <View
            className="flex-row items-center justify-between px-5 pt-4 pb-3"
            style={{ borderBottomWidth: 1, borderBottomColor: "#1E293B" }}
          >
            <TouchableOpacity onPress={() => { setShowDetailModal(false); setSelectedItem(null); }}>
              <Text className="text-base" style={{ color: "#E8A838" }}>Fermer</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={{ color: "#F1F5F9" }}>
              {selectedItem?.name ?? "Détail"}
            </Text>
            <View style={{ width: 50 }} />
          </View>
          {selectedItem && (
            <ScrollView className="px-5 pt-6" contentContainerStyle={{ alignItems: "center" }}>
              {selectedItem.is_high_value && selectedItem.qr_code && (
                <EquipmentQRCode
                  value={selectedItem.qr_code}
                  size={200}
                  label={selectedItem.name}
                />
              )}
              <View className="w-full mt-6" style={{ gap: 12 }}>
                {selectedItem.brand && (
                  <View className="flex-row justify-between p-3 rounded-xl" style={{ backgroundColor: "#1E293B" }}>
                    <Text style={{ color: "#64748B" }}>Marque</Text>
                    <Text style={{ color: "#F1F5F9", fontWeight: "600" }}>{selectedItem.brand}</Text>
                  </View>
                )}
                {selectedItem.model && (
                  <View className="flex-row justify-between p-3 rounded-xl" style={{ backgroundColor: "#1E293B" }}>
                    <Text style={{ color: "#64748B" }}>Modèle</Text>
                    <Text style={{ color: "#F1F5F9", fontWeight: "600" }}>{selectedItem.model}</Text>
                  </View>
                )}
                {selectedItem.serial_number && (
                  <View className="flex-row justify-between p-3 rounded-xl" style={{ backgroundColor: "#1E293B" }}>
                    <Text style={{ color: "#64748B" }}>N° série</Text>
                    <Text style={{ color: "#F1F5F9", fontWeight: "600" }}>{selectedItem.serial_number}</Text>
                  </View>
                )}
                {selectedItem.attributes && Object.entries(selectedItem.attributes).map(([key, val]) => (
                  val ? (
                    <View key={key} className="flex-row justify-between p-3 rounded-xl" style={{ backgroundColor: "#1E293B" }}>
                      <Text style={{ color: "#64748B" }}>{key}</Text>
                      <Text style={{ color: "#F1F5F9", fontWeight: "600" }}>{String(val)}</Text>
                    </View>
                  ) : null
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <View className="flex-1" style={{ backgroundColor: "#000000" }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
            <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5" style={{ paddingTop: 60 }}>
              <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowCamera(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-base font-semibold" style={{ color: "#FFFFFF" }}>Photographier l'equipement</Text>
              <View style={{ width: 40 }} />
            </View>
            <View className="flex-1 items-center justify-center">
              <View style={{ width: 250, height: 250, borderWidth: 2, borderColor: "rgba(232,168,56,0.5)", borderRadius: 20, borderStyle: "dashed" }} />
              <Text className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.7)" }}>Centrez l'equipement dans le cadre</Text>
            </View>
            <View className="absolute bottom-0 left-0 right-0 items-center" style={{ paddingBottom: 50 }}>
              <TouchableOpacity className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: "#E8A838", borderWidth: 4, borderColor: "rgba(255,255,255,0.3)" }} onPress={handleCapture} activeOpacity={0.7}>
                <MaterialCommunityIcons name="camera" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1" style={{ backgroundColor: "#0F172A" }}>
          <View
            className="flex-row items-center justify-between px-5 pt-4 pb-3"
            style={{ borderBottomWidth: 1, borderBottomColor: "#1E293B" }}
          >
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text className="text-base" style={{ color: "#E8A838" }}>
                Annuler
              </Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={{ color: "#F1F5F9" }}>
              Nouvel equipement
            </Text>
            <TouchableOpacity onPress={handleAdd}>
              <Text
                className="text-base font-semibold"
                style={{ color: "#E8A838" }}
              >
                Ajouter
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5 pt-4">
            {/* AI Identification Section */}
            <View
              className="rounded-xl p-4 mb-5"
              style={{
                backgroundColor: "#1E293B",
                borderWidth: 1,
                borderColor: "#334155",
              }}
            >
              <Text
                className="text-xs font-bold mb-3"
                style={{
                  color: "#E8A838",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                IDENTIFICATION INTELLIGENTE
              </Text>

              {/* Camera button */}
              <TouchableOpacity
                className="flex-row items-center justify-center rounded-xl py-3.5 mb-3"
                style={{
                  backgroundColor: "#E8A838",
                  opacity: aiLoading ? 0.6 : 1,
                  gap: 10,
                }}
                onPress={handleTakePhoto}
                disabled={aiLoading}
                activeOpacity={0.8}
              >
                {aiLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <MaterialCommunityIcons
                    name="camera"
                    size={22}
                    color="#FFFFFF"
                  />
                )}
                <Text
                  className="text-base font-semibold"
                  style={{ color: "#FFFFFF" }}
                >
                  {aiLoading ? "Analyse en cours..." : "Identifier par photo"}
                </Text>
              </TouchableOpacity>

              {/* Search field */}
              <View style={{ position: "relative" }}>
                <View
                  className="flex-row items-center rounded-xl px-3"
                  style={{
                    backgroundColor: "#0F172A",
                    borderWidth: 1,
                    borderColor: "#334155",
                  }}
                >
                  <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color="#475569"
                  />
                  <TextInput
                    className="flex-1 py-3 px-2 text-base"
                    style={{ color: "#F1F5F9" }}
                    placeholder="Rechercher un equipement..."
                    placeholderTextColor="#475569"
                    value={searchQuery}
                    onChangeText={handleSearchQueryChange}
                  />
                  {aiLoading && searchQuery.length >= 3 && (
                    <ActivityIndicator color="#E8A838" size="small" />
                  )}
                </View>

                {/* Search suggestions dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <View
                    className="rounded-xl mt-1 overflow-hidden"
                    style={{
                      backgroundColor: "#0F172A",
                      borderWidth: 1,
                      borderColor: "#334155",
                    }}
                  >
                    {searchResults.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        className="flex-row items-center px-3 py-3"
                        style={{
                          borderBottomWidth:
                            index < searchResults.length - 1 ? 1 : 0,
                          borderBottomColor: "#1E293B",
                          gap: 10,
                        }}
                        onPress={() => handleSelectSuggestion(item)}
                        activeOpacity={0.7}
                      >
                        <View
                          className="w-8 h-8 rounded-lg items-center justify-center"
                          style={{ backgroundColor: "#E8A83815" }}
                        >
                          <MaterialCommunityIcons
                            name={
                              (UNIVERSE_MCI_ICONS[
                                item.universe as EquipmentUniverse
                              ] || "wrench") as keyof typeof MaterialCommunityIcons.glyphMap
                            }
                            size={16}
                            color="#E8A838"
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-sm font-semibold"
                            style={{ color: "#F1F5F9" }}
                          >
                            {item.name}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: "#64748B" }}
                          >
                            {item.brand}
                          </Text>
                        </View>
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#334155" }}
                        >
                          <Text
                            className="text-xs"
                            style={{ color: "#94A3B8" }}
                          >
                            {UNIVERSE_LABELS[
                              item.universe as EquipmentUniverse
                            ] || item.universe}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* AI identified confirmation banner */}
              {aiIdentified && (
                <View
                  className="flex-row items-center mt-3 px-3 py-2.5 rounded-xl"
                  style={{
                    backgroundColor: "#2DD4BF15",
                    borderWidth: 1,
                    borderColor: "#2DD4BF40",
                    gap: 8,
                  }}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color="#2DD4BF"
                  />
                  <Text
                    className="text-sm font-medium flex-1"
                    style={{ color: "#2DD4BF" }}
                  >
                    {aiIdentified} identifie
                  </Text>
                </View>
              )}
            </View>

            {/* Universe Picker */}
            <Text
              className="text-sm font-medium mb-2"
              style={{ color: "#64748B" }}
            >
              Univers
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {UNIVERSES.map((u) => (
                <TouchableOpacity
                  key={u}
                  className="mr-2 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor:
                      newItem.universe === u ? "#E8A838" : "#1E293B",
                    borderWidth: newItem.universe === u ? 0 : 1,
                    borderColor: "#334155",
                  }}
                  onPress={() => handleUniverseChange(u)}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color:
                        newItem.universe === u ? "#FFFFFF" : "#94A3B8",
                      fontWeight: newItem.universe === u ? "600" : "400",
                    }}
                  >
                    {UNIVERSE_LABELS[u]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ gap: 14 }}>
              <TextInput
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Nom *"
                placeholderTextColor="#475569"
                value={newItem.name}
                onChangeText={(t) => setNewItem({ ...newItem, name: t })}
              />
              <TextInput
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Marque"
                placeholderTextColor="#475569"
                value={newItem.brand}
                onChangeText={(t) => setNewItem({ ...newItem, brand: t })}
              />
              <TextInput
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Modele"
                placeholderTextColor="#475569"
                value={newItem.model}
                onChangeText={(t) => setNewItem({ ...newItem, model: t })}
              />
              <TextInput
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Numero de serie"
                placeholderTextColor="#475569"
                value={newItem.serial_number}
                onChangeText={(t) =>
                  setNewItem({ ...newItem, serial_number: t })
                }
              />

              {/* High value toggle */}
              <View
                className="flex-row items-center justify-between rounded-xl px-4 py-3"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                }}
              >
                <View>
                  <Text
                    className="text-base font-medium"
                    style={{ color: "#F1F5F9" }}
                  >
                    Haute valeur
                  </Text>
                  <Text className="text-sm" style={{ color: "#64748B" }}>
                    Active le QR code de suivi
                  </Text>
                </View>
                <Switch
                  value={newItem.is_high_value}
                  onValueChange={(v) =>
                    setNewItem({ ...newItem, is_high_value: v })
                  }
                  trackColor={{ false: "#334155", true: "#E8A838" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TextInput
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Notes"
                placeholderTextColor="#475569"
                value={newItem.notes}
                onChangeText={(t) => setNewItem({ ...newItem, notes: t })}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Dynamic universe-specific fields */}
            {universeFields.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text
                  className="text-xs font-bold mb-3"
                  style={{
                    color: "#64748B",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  CARACTERISTIQUES
                </Text>
                {universeFields.map(renderField)}
              </View>
            )}

            <View className="h-12" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
