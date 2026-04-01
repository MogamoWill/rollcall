import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { showAlert } from "@/lib/alert";
import { useLocalSearchParams, router } from "expo-router";
import { useShotStore } from "@/stores/shotStore";
import { useProjectStore } from "@/stores/projectStore";
import type { ShotType, ShotPriority } from "@/types";

const SHOT_TYPE_LABELS: Record<ShotType, string> = {
  wide: "Plan large",
  medium: "Plan moyen",
  close_up: "Gros plan",
  detail: "Insert/Detail",
  drone: "Drone",
  tracking: "Travelling",
  static: "Plan fixe",
  other: "Autre",
};

const SHOT_TYPES: ShotType[] = [
  "wide",
  "medium",
  "close_up",
  "detail",
  "drone",
  "tracking",
  "static",
  "other",
];

const PRIORITY_CONFIG: Record<
  ShotPriority,
  { label: string; color: string }
> = {
  must_have: { label: "Indispensable", color: "#EF4444" },
  nice_to_have: { label: "Important", color: "#F59E0B" },
  optional: { label: "Optionnel", color: "#94A3B8" },
};

const PRIORITIES: ShotPriority[] = ["must_have", "nice_to_have", "optional"];

type FilterTab = "all" | "todo" | "done";

export default function ShotsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shots, loading, fetchShots, addShot, toggleShot, deleteShot } =
    useShotStore();
  const projects = useProjectStore((s) => s.projects);
  const project = projects.find((p) => p.id === id);

  const [filter, setFilter] = useState<FilterTab>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShot, setNewShot] = useState({
    description: "",
    shot_type: "medium" as ShotType,
    priority: "must_have" as ShotPriority,
    notes: "",
  });

  useEffect(() => {
    if (id) {
      fetchShots(id).catch(() => {});
    }
  }, [id, fetchShots]);

  const filteredShots =
    filter === "all"
      ? shots
      : filter === "todo"
        ? shots.filter((s) => !s.is_completed)
        : shots.filter((s) => s.is_completed);

  const completedCount = shots.filter((s) => s.is_completed).length;
  const totalCount = shots.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const handleAddShot = async () => {
    if (!newShot.description.trim()) {
      showAlert("Erreur", "La description est obligatoire");
      return;
    }
    try {
      await addShot({
        project_id: id!,
        description: newShot.description.trim(),
        shot_type: newShot.shot_type,
        priority: newShot.priority,
        notes: newShot.notes.trim() || undefined,
        sort_order: shots.length + 1,
      });
      setShowAddModal(false);
      setNewShot({
        description: "",
        shot_type: "medium",
        priority: "must_have",
        notes: "",
      });
    } catch {
      showAlert("Erreur", "Impossible d'ajouter le plan");
    }
  };

  const handleDelete = (shotId: string, description: string) => {
    showAlert("Supprimer", `Supprimer "${description}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteShot(shotId).catch(() => {}),
      },
    ]);
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "todo", label: "A tourner" },
    { key: "done", label: "Tournes" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#1E293B",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 12 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#E8A838"
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            {project && (
              <Text
                style={{
                  color: "#64748B",
                  fontSize: 13,
                  marginBottom: 2,
                }}
              >
                {project.name}
              </Text>
            )}
            <Text
              style={{
                color: "#F1F5F9",
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              Shot List
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginTop: 12 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 13 }}>
              {completedCount}/{totalCount} plans tournes
            </Text>
            <Text style={{ color: "#E8A838", fontSize: 13, fontWeight: "600" }}>
              {totalCount > 0 ? Math.round(progress * 100) : 0}%
            </Text>
          </View>
          <View
            style={{
              height: 6,
              backgroundColor: "#1E293B",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                backgroundColor: "#E8A838",
                borderRadius: 3,
              }}
            />
          </View>
        </View>

        {/* Filter tabs */}
        <View style={{ flexDirection: "row", marginTop: 14, gap: 8 }}>
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? "#E8A838" : "#1E293B",
                  borderWidth: isActive ? 0 : 1,
                  borderColor: "#334155",
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#FFFFFF" : "#94A3B8",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Shot list */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}
      >
        {loading ? (
          <ActivityIndicator
            color="#E8A838"
            size="large"
            style={{ marginTop: 40 }}
          />
        ) : filteredShots.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <MaterialCommunityIcons
              name="movie-open-outline"
              size={52}
              color="#334155"
            />
            <Text style={{ color: "#475569", fontSize: 15, marginTop: 16 }}>
              {filter === "all"
                ? "Aucun plan dans la shot list"
                : filter === "todo"
                  ? "Tous les plans sont tournes !"
                  : "Aucun plan tourne"}
            </Text>
          </View>
        ) : (
          filteredShots.map((shot, index) => {
            const typeLabel = SHOT_TYPE_LABELS[shot.shot_type];
            const priorityConfig = PRIORITY_CONFIG[shot.priority];
            return (
              <TouchableOpacity
                key={shot.id}
                onLongPress={() => handleDelete(shot.id, shot.description)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: "#1E293B",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: shot.is_completed
                    ? "#22C55E"
                    : priorityConfig.color,
                  opacity: shot.is_completed ? 0.7 : 1,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Checkbox */}
                  <TouchableOpacity
                    onPress={() => toggleShot(shot.id)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: shot.is_completed
                        ? "#22C55E"
                        : "#475569",
                      backgroundColor: shot.is_completed
                        ? "#22C55E20"
                        : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      marginTop: 2,
                    }}
                  >
                    {shot.is_completed && (
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color="#22C55E"
                      />
                    )}
                  </TouchableOpacity>

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    {/* Shot number + description */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#E8A838",
                          fontSize: 13,
                          fontWeight: "700",
                          marginRight: 8,
                        }}
                      >
                        #{index + 1}
                      </Text>
                      <Text
                        style={{
                          color: "#F1F5F9",
                          fontSize: 15,
                          fontWeight: "500",
                          flex: 1,
                          textDecorationLine: shot.is_completed
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {shot.description}
                      </Text>
                    </View>

                    {/* Badges row */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {/* Shot type badge */}
                      <View
                        style={{
                          backgroundColor: "#E8A83815",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: "#E8A838",
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          {typeLabel}
                        </Text>
                      </View>

                      {/* Priority dot + label */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: priorityConfig.color,
                          }}
                        />
                        <Text
                          style={{
                            color: "#64748B",
                            fontSize: 11,
                          }}
                        >
                          {priorityConfig.label}
                        </Text>
                      </View>
                    </View>

                    {/* Notes */}
                    {shot.notes ? (
                      <Text
                        style={{
                          color: "#475569",
                          fontSize: 12,
                          marginTop: 6,
                          fontStyle: "italic",
                        }}
                      >
                        {shot.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
        style={{
          position: "absolute",
          bottom: 30,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#E8A838",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#E8A838",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Shot Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
          {/* Modal header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#1E293B",
            }}
          >
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={{ color: "#E8A838", fontSize: 16 }}>Annuler</Text>
            </TouchableOpacity>
            <Text
              style={{ color: "#F1F5F9", fontSize: 18, fontWeight: "700" }}
            >
              Nouveau plan
            </Text>
            <TouchableOpacity onPress={handleAddShot}>
              <Text
                style={{
                  color: "#E8A838",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Ajouter
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            {/* Description */}
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Description *
            </Text>
            <TextInput
              style={{
                backgroundColor: "#1E293B",
                borderWidth: 1,
                borderColor: "#334155",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: "#F1F5F9",
                fontSize: 16,
                marginBottom: 24,
              }}
              placeholder="Ex: Plan large du lieu de tournage"
              placeholderTextColor="#475569"
              value={newShot.description}
              onChangeText={(t) =>
                setNewShot({ ...newShot, description: t })
              }
              multiline
            />

            {/* Shot type selector */}
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Type de plan
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 24 }}
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                {SHOT_TYPES.map((type) => {
                  const isSelected = newShot.shot_type === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() =>
                        setNewShot({ ...newShot, shot_type: type })
                      }
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: isSelected
                          ? "#E8A838"
                          : "#1E293B",
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: "#334155",
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? "#FFFFFF" : "#94A3B8",
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {SHOT_TYPE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Priority selector */}
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Priorite
            </Text>
            <View
              style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}
            >
              {PRIORITIES.map((priority) => {
                const config = PRIORITY_CONFIG[priority];
                const isSelected = newShot.priority === priority;
                return (
                  <TouchableOpacity
                    key={priority}
                    onPress={() =>
                      setNewShot({ ...newShot, priority })
                    }
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 10,
                      backgroundColor: isSelected
                        ? config.color + "20"
                        : "#1E293B",
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected
                        ? config.color
                        : "#334155",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: config.color,
                        marginBottom: 6,
                      }}
                    />
                    <Text
                      style={{
                        color: isSelected ? config.color : "#94A3B8",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Notes (optionnel)
            </Text>
            <TextInput
              style={{
                backgroundColor: "#1E293B",
                borderWidth: 1,
                borderColor: "#334155",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: "#F1F5F9",
                fontSize: 16,
                minHeight: 80,
                textAlignVertical: "top",
                marginBottom: 40,
              }}
              placeholder="Notes supplementaires..."
              placeholderTextColor="#475569"
              value={newShot.notes}
              onChangeText={(t) =>
                setNewShot({ ...newShot, notes: t })
              }
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
