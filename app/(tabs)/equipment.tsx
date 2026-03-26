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
import { Feather } from "@expo/vector-icons";
import { useEquipmentStore } from "@/stores/equipmentStore";
import {
  UNIVERSE_LABELS,
  UNIVERSE_ICONS,
  type EquipmentUniverse,
  type Equipment,
} from "@/types";

const UNIVERSES = Object.keys(UNIVERSE_LABELS) as EquipmentUniverse[];

export default function EquipmentScreen() {
  const { items, loading, fetchEquipment, addEquipment, deleteEquipment } =
    useEquipmentStore();
  const [selectedUniverse, setSelectedUniverse] =
    useState<EquipmentUniverse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    brand: "",
    model: "",
    serial_number: "",
    universe: "camera" as EquipmentUniverse,
    is_high_value: false,
    notes: "",
  });

  useEffect(() => {
    fetchEquipment().catch(() => {});
  }, [fetchEquipment]);

  const filteredItems = selectedUniverse
    ? items.filter((i) => i.universe === selectedUniverse)
    : items;

  const handleAdd = async () => {
    if (!newItem.name) {
      Alert.alert("Erreur", "Le nom est obligatoire");
      return;
    }
    try {
      await addEquipment(newItem);
      setShowAddModal(false);
      setNewItem({
        name: "",
        brand: "",
        model: "",
        serial_number: "",
        universe: "camera",
        is_high_value: false,
        notes: "",
      });
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter l'équipement");
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

  const getUniverseCount = (universe: EquipmentUniverse) =>
    items.filter((i) => i.universe === universe).length;

  return (
    <View className="flex-1 bg-slate-50">
      {/* Universe filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-14 px-4 pt-3"
      >
        <TouchableOpacity
          className={`mr-2 px-4 py-2 rounded-full ${
            !selectedUniverse ? "bg-brand-500" : "bg-white border border-slate-200"
          }`}
          onPress={() => setSelectedUniverse(null)}
        >
          <Text
            className={`text-sm font-medium ${
              !selectedUniverse ? "text-white" : "text-slate-700"
            }`}
          >
            Tout ({items.length})
          </Text>
        </TouchableOpacity>
        {UNIVERSES.map((u) => {
          const count = getUniverseCount(u);
          if (count === 0 && selectedUniverse !== u) return null;
          return (
            <TouchableOpacity
              key={u}
              className={`mr-2 px-4 py-2 rounded-full flex-row items-center gap-1.5 ${
                selectedUniverse === u
                  ? "bg-brand-500"
                  : "bg-white border border-slate-200"
              }`}
              onPress={() =>
                setSelectedUniverse(selectedUniverse === u ? null : u)
              }
            >
              <Feather
                name={UNIVERSE_ICONS[u] as keyof typeof Feather.glyphMap}
                size={14}
                color={selectedUniverse === u ? "#FFFFFF" : "#64748B"}
              />
              <Text
                className={`text-sm font-medium ${
                  selectedUniverse === u ? "text-white" : "text-slate-700"
                }`}
              >
                {UNIVERSE_LABELS[u]} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Equipment List */}
      <ScrollView className="flex-1 px-4 pt-4">
        {loading ? (
          <Text className="text-center text-slate-400 mt-8">Chargement...</Text>
        ) : filteredItems.length === 0 ? (
          <View className="items-center mt-16">
            <Feather name="camera-off" size={48} color="#CBD5E1" />
            <Text className="text-slate-400 mt-4 text-base">
              Aucun équipement
            </Text>
            <Text className="text-slate-400 text-sm">
              Ajoute ton premier matos
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white rounded-2xl p-4 mb-2 border border-slate-100 flex-row items-center"
              onLongPress={() => handleDelete(item)}
            >
              <View className="w-10 h-10 rounded-xl bg-brand-50 items-center justify-center mr-3">
                <Feather
                  name={
                    UNIVERSE_ICONS[item.universe] as keyof typeof Feather.glyphMap
                  }
                  size={20}
                  color="#1a6bff"
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900">
                  {item.name}
                </Text>
                <Text className="text-sm text-slate-500">
                  {[item.brand, item.model].filter(Boolean).join(" ") ||
                    UNIVERSE_LABELS[item.universe]}
                </Text>
              </View>
              {item.is_high_value && (
                <View className="bg-amber-50 px-2.5 py-1 rounded-full mr-2">
                  <Text className="text-amber-600 text-xs font-medium">
                    QR
                  </Text>
                </View>
              )}
              <Feather name="chevron-right" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))
        )}
        <View className="h-24" />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-brand-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowAddModal(true)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text className="text-brand-500 text-base">Annuler</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-slate-900">
              Nouvel équipement
            </Text>
            <TouchableOpacity onPress={handleAdd}>
              <Text className="text-brand-500 text-base font-semibold">
                Ajouter
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5 pt-4">
            {/* Universe Picker */}
            <Text className="text-sm font-medium text-slate-700 mb-2">
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
                  className={`mr-2 px-4 py-2 rounded-full ${
                    newItem.universe === u
                      ? "bg-brand-500"
                      : "bg-slate-100"
                  }`}
                  onPress={() => setNewItem({ ...newItem, universe: u })}
                >
                  <Text
                    className={`text-sm ${
                      newItem.universe === u
                        ? "text-white font-medium"
                        : "text-slate-600"
                    }`}
                  >
                    {UNIVERSE_LABELS[u]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View className="gap-4">
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50"
                placeholder="Nom *"
                placeholderTextColor="#94A3B8"
                value={newItem.name}
                onChangeText={(t) => setNewItem({ ...newItem, name: t })}
              />
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50"
                placeholder="Marque"
                placeholderTextColor="#94A3B8"
                value={newItem.brand}
                onChangeText={(t) => setNewItem({ ...newItem, brand: t })}
              />
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50"
                placeholder="Modèle"
                placeholderTextColor="#94A3B8"
                value={newItem.model}
                onChangeText={(t) => setNewItem({ ...newItem, model: t })}
              />
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50"
                placeholder="Numéro de série"
                placeholderTextColor="#94A3B8"
                value={newItem.serial_number}
                onChangeText={(t) =>
                  setNewItem({ ...newItem, serial_number: t })
                }
              />

              {/* High value toggle */}
              <View className="flex-row items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <View>
                  <Text className="text-base text-slate-900 font-medium">
                    Haute valeur
                  </Text>
                  <Text className="text-sm text-slate-500">
                    Active le QR code de suivi
                  </Text>
                </View>
                <Switch
                  value={newItem.is_high_value}
                  onValueChange={(v) =>
                    setNewItem({ ...newItem, is_high_value: v })
                  }
                  trackColor={{ true: "#1a6bff" }}
                />
              </View>

              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50"
                placeholder="Notes"
                placeholderTextColor="#94A3B8"
                value={newItem.notes}
                onChangeText={(t) => setNewItem({ ...newItem, notes: t })}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
