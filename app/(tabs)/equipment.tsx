import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
