import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { showAlert } from "@/lib/alert";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useChecklistStore } from "@/stores/checklistStore";
import { useProjectStore } from "@/stores/projectStore";
import { PHASE_CONFIG } from "@/constants/checklistTemplates";
import type { ChecklistPhase } from "@/types";

const PHASES: ChecklistPhase[] = ["pre_prod", "production", "post_prod"];

export default function ChecklistsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, loading, fetchChecklists, addItem, toggleItem, deleteItem, applyTemplate } =
    useChecklistStore();
  const { projects } = useProjectStore();

  const [activePhase, setActivePhase] = useState<ChecklistPhase>("pre_prod");
  const [newItemText, setNewItemText] = useState("");

  const project = projects.find((p) => p.id === id);

  useEffect(() => {
    if (id) {
      fetchChecklists(id).catch(() => {});
    }
  }, [id, fetchChecklists]);

  const phaseItems = items.filter((i) => i.phase === activePhase);
  const completedCount = phaseItems.filter((i) => i.is_completed).length;
  const totalCount = phaseItems.length;

  const allCompleted = items.filter((i) => i.is_completed).length;
  const allTotal = items.length;

  const handleAddItem = useCallback(async () => {
    const text = newItemText.trim();
    if (!text || !id) return;
    try {
      await addItem(id, activePhase, text);
      setNewItemText("");
    } catch {
      showAlert("Erreur", "Impossible d'ajouter l'item");
    }
  }, [newItemText, id, activePhase, addItem]);

  const handleApplyTemplate = useCallback(async () => {
    if (!id) return;
    try {
      await applyTemplate(id, activePhase);
    } catch {
      showAlert("Erreur", "Impossible d'appliquer le template");
    }
  }, [id, activePhase, applyTemplate]);

  const handleToggle = useCallback(
    async (itemId: string) => {
      try {
        await toggleItem(itemId);
      } catch {
        showAlert("Erreur", "Impossible de modifier l'item");
      }
    },
    [toggleItem]
  );

  const handleDelete = useCallback(
    (itemId: string) => {
      showAlert("Supprimer", "Supprimer cet item ?", [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteItem(itemId).catch(() => {}),
        },
      ]);
    },
    [deleteItem]
  );

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const overallPercent = allTotal > 0 ? (allCompleted / allTotal) * 100 : 0;

  return (
    <View className="flex-1" style={{ backgroundColor: "#0F172A" }}>
      {/* Header */}
      <View
        className="px-5 pb-4"
        style={{
          paddingTop: 60,
          borderBottomWidth: 1,
          borderBottomColor: "#1E293B",
        }}
      >
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#F1F5F9" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold" style={{ color: "#F1F5F9" }}>
              Checklists
            </Text>
            {project && (
              <Text className="text-sm" style={{ color: "#64748B" }}>
                {project.name}
              </Text>
            )}
          </View>
        </View>

        {/* Overall progress */}
        {allTotal > 0 && (
          <View className="mt-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs" style={{ color: "#64748B" }}>
                Progression globale
              </Text>
              <Text className="text-xs font-semibold" style={{ color: "#E8A838" }}>
                {allCompleted}/{allTotal}
              </Text>
            </View>
            <View
              className="w-full rounded-full"
              style={{ height: 4, backgroundColor: "#334155" }}
            >
              <View
                className="rounded-full"
                style={{
                  height: 4,
                  width: `${overallPercent}%`,
                  backgroundColor: "#E8A838",
                }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Phase Tabs */}
      <View className="flex-row px-4 pt-3 pb-2" style={{ gap: 8 }}>
        {PHASES.map((phase) => {
          const config = PHASE_CONFIG[phase];
          const isActive = activePhase === phase;
          const phaseCount = items.filter((i) => i.phase === phase).length;
          const phaseDone = items.filter((i) => i.phase === phase && i.is_completed).length;
          return (
            <TouchableOpacity
              key={phase}
              className="flex-1 items-center py-2.5 rounded-xl"
              style={{
                backgroundColor: isActive ? config.color + "20" : "#1E293B",
                borderWidth: isActive ? 1 : 1,
                borderColor: isActive ? config.color + "50" : "#334155",
              }}
              onPress={() => setActivePhase(phase)}
            >
              <MaterialCommunityIcons
                name={config.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={18}
                color={isActive ? config.color : "#475569"}
              />
              <Text
                className="text-xs font-semibold mt-1"
                style={{ color: isActive ? config.color : "#475569" }}
              >
                {config.label}
              </Text>
              {phaseCount > 0 && (
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: isActive ? config.color : "#475569", opacity: 0.7 }}
                >
                  {phaseDone}/{phaseCount}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Phase Progress */}
      {totalCount > 0 && (
        <View className="px-5 pt-2 pb-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-semibold" style={{ color: "#94A3B8" }}>
              {completedCount}/{totalCount} compl\u00e9t\u00e9s
            </Text>
            <Text className="text-xs" style={{ color: "#475569" }}>
              {Math.round(progressPercent)}%
            </Text>
          </View>
          <View
            className="w-full rounded-full"
            style={{ height: 6, backgroundColor: "#334155" }}
          >
            <View
              className="rounded-full"
              style={{
                height: 6,
                width: `${progressPercent}%`,
                backgroundColor: PHASE_CONFIG[activePhase].color,
              }}
            />
          </View>
        </View>
      )}

      {/* Checklist Items */}
      <ScrollView className="flex-1 px-4 pt-3">
        {loading ? (
          <ActivityIndicator className="mt-8" color={PHASE_CONFIG[activePhase].color} />
        ) : phaseItems.length === 0 ? (
          <View className="items-center mt-12">
            <MaterialCommunityIcons
              name="checkbox-blank-outline"
              size={48}
              color="#334155"
            />
            <Text className="mt-3 text-sm" style={{ color: "#475569" }}>
              Aucun item dans cette phase
            </Text>
            <TouchableOpacity
              className="mt-4 px-5 py-3 rounded-xl flex-row items-center"
              style={{
                backgroundColor: PHASE_CONFIG[activePhase].color + "20",
                gap: 8,
              }}
              onPress={handleApplyTemplate}
            >
              <MaterialCommunityIcons
                name="playlist-plus"
                size={20}
                color={PHASE_CONFIG[activePhase].color}
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: PHASE_CONFIG[activePhase].color }}
              >
                Appliquer le template
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          phaseItems
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center rounded-xl mb-2 px-4 py-3.5"
                style={{
                  backgroundColor: "#1E293B",
                  gap: 12,
                }}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={
                    item.is_completed
                      ? "checkbox-marked-circle"
                      : "checkbox-blank-circle-outline"
                  }
                  size={22}
                  color={item.is_completed ? "#14B8A6" : "#475569"}
                />
                <Text
                  className="flex-1 text-sm"
                  style={{
                    color: item.is_completed ? "#64748B" : "#E2E8F0",
                    textDecorationLine: item.is_completed ? "line-through" : "none",
                  }}
                >
                  {item.title}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#475569" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
        )}
        <View className="h-32" />
      </ScrollView>

      {/* Add Item Input */}
      <View
        className="px-4 pb-8 pt-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: "#1E293B",
          backgroundColor: "#0F172A",
        }}
      >
        <View
          className="flex-row items-center rounded-xl px-4"
          style={{
            backgroundColor: "#1E293B",
            borderWidth: 1,
            borderColor: "#334155",
          }}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#475569" />
          <TextInput
            className="flex-1 py-3 px-3 text-sm"
            style={{ color: "#F1F5F9" }}
            placeholder="Ajouter un item..."
            placeholderTextColor="#475569"
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          {newItemText.trim().length > 0 && (
            <TouchableOpacity onPress={handleAddItem}>
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={PHASE_CONFIG[activePhase].color}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
