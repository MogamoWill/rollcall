import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProjectStore } from "@/stores/projectStore";
import { useEquipmentStore } from "@/stores/equipmentStore";
import { useBoardStore } from "@/stores/boardStore";
import type { ProjectStatus } from "@/types";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Brouillon",
  pre_prod: "Pre-prod",
  production: "Tournage",
  post_prod: "Post-prod",
  delivered: "Livre",
  archived: "Archive",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: "#94A3B8",
  pre_prod: "#3B82F6",
  production: "#F59E0B",
  post_prod: "#8B5CF6",
  delivered: "#22C55E",
  archived: "#64748B",
};

export default function DashboardScreen() {
  const { projects, fetchProjects } = useProjectStore();
  const { items, fetchEquipment } = useEquipmentStore();
  const { boards, fetchBoards } = useBoardStore();

  useEffect(() => {
    fetchProjects().catch(() => {});
    fetchEquipment().catch(() => {});
    fetchBoards().catch(() => {});
  }, [fetchProjects, fetchEquipment, fetchBoards]);

  const activeProjects = projects.filter(
    (p) => !["delivered", "archived"].includes(p.status)
  );

  const totalTasks = boards.reduce((acc, b) => {
    return (
      acc +
      (b.columns ?? []).reduce((colAcc, col) => {
        return colAcc + (col.cards?.length ?? 0);
      }, 0)
    );
  }, 0);

  const upcomingShoots = projects
    .filter((p) => p.shoot_date && p.status !== "archived")
    .sort(
      (a, b) =>
        new Date(a.shoot_date!).getTime() - new Date(b.shoot_date!).getTime()
    )
    .slice(0, 3);

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: "#0F172A" }}>
      <View style={{ maxWidth: 720, width: "100%", alignSelf: "center" }}>
      <View className="px-5 pt-6 pb-8">
        {/* Welcome */}
        <View className="mb-6">
          <Text className="text-sm font-semibold" style={{ color: "#64748B" }}>
            Bienvenue sur
          </Text>
          <View className="flex-row items-center mt-1" style={{ gap: 10 }}>
            <MaterialCommunityIcons
              name="movie-open-outline"
              size={28}
              color="#E8A838"
            />

            <Text className="text-3xl font-bold" style={{ color: "#F1F5F9" }}>
              RollCall
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row mb-6" style={{ gap: 10 }}>
          <View
            className="flex-1 rounded-xl p-4"
            style={{ backgroundColor: "#1E293B", borderLeftWidth: 3, borderLeftColor: "#E8A838" }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mb-3"
              style={{ backgroundColor: "#E8A83820" }}
            >
              <MaterialCommunityIcons
                name="movie-open"
                size={22}
                color="#E8A838"
              />
            </View>
            <Text className="text-2xl font-bold" style={{ color: "#F1F5F9" }}>
              {activeProjects.length}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Projets en cours
            </Text>
          </View>

          <View
            className="flex-1 rounded-xl p-4"
            style={{ backgroundColor: "#1E293B", borderLeftWidth: 3, borderLeftColor: "#2DD4BF" }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mb-3"
              style={{ backgroundColor: "#2DD4BF20" }}
            >
              <MaterialCommunityIcons
                name="camera"
                size={22}
                color="#2DD4BF"
              />
            </View>
            <Text className="text-2xl font-bold" style={{ color: "#F1F5F9" }}>
              {items.length}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Equipement total
            </Text>
          </View>

          <View
            className="flex-1 rounded-xl p-4"
            style={{ backgroundColor: "#1E293B", borderLeftWidth: 3, borderLeftColor: "#F97316" }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mb-3"
              style={{ backgroundColor: "#F9731620" }}
            >
              <MaterialCommunityIcons
                name="checkbox-marked-outline"
                size={22}
                color="#F97316"
              />
            </View>
            <Text className="text-2xl font-bold" style={{ color: "#F1F5F9" }}>
              {totalTasks}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Tâches à faire
            </Text>
          </View>
        </View>

        {/* Prochain tournage */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3" style={{ gap: 8, borderLeftWidth: 3, borderLeftColor: "#E8A838", paddingLeft: 10 }}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={18}
              color="#E8A838"
            />
            <Text className="text-sm font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
              Prochain tournage
            </Text>
          </View>
          {upcomingShoots.length === 0 ? (
            <View
              className="rounded-xl p-6 items-center"
              style={{ backgroundColor: "#1E293B", borderWidth: 1, borderColor: "#334155" }}
            >
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={36}
                color="#334155"
              />
              <Text className="mt-2" style={{ color: "#475569" }}>
                Aucun tournage planifie
              </Text>
            </View>
          ) : (
            upcomingShoots.map((project) => (
              <TouchableOpacity
                key={project.id}
                className="rounded-xl p-4 mb-2"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                }}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{ color: "#F1F5F9" }}
                    >
                      {project.name}
                    </Text>
                    {project.client && (
                      <Text className="text-sm" style={{ color: "#64748B" }}>
                        {project.client}
                      </Text>
                    )}
                    {project.location && (
                      <View
                        className="flex-row items-center mt-1"
                        style={{ gap: 4 }}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={12}
                          color="#475569"
                        />
                        <Text className="text-xs" style={{ color: "#475569" }}>
                          {project.location}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-sm font-bold"
                      style={{ color: "#E8A838" }}
                    >
                      {new Date(project.shoot_date!).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "short",
                        }
                      )}
                    </Text>
                    <View
                      className="px-2.5 py-1 rounded-full mt-1.5"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[project.status] + "20",
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: STATUS_COLORS[project.status] }}
                      >
                        {STATUS_LABELS[project.status]}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Activity / Quick Actions */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3" style={{ gap: 8, borderLeftWidth: 3, borderLeftColor: "#E8A838", paddingLeft: 10 }}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={18}
              color="#E8A838"
            />
            <Text className="text-sm font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
              Actions rapides
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <TouchableOpacity
              className="rounded-xl p-4 flex-row items-center"
              style={{ backgroundColor: "#E8A838", gap: 12 }}
              onPress={() => router.push("/projects")}
              activeOpacity={0.8}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={22}
                  color="#0F172A"
                />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-base" style={{ color: "#0F172A" }}>
                  Nouveau projet
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: "rgba(15,23,42,0.6)" }}
                >
                  Démarrer un nouveau tournage
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="rgba(15,23,42,0.4)"
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="rounded-xl p-4 flex-row items-center"
              style={{
                backgroundColor: "#1E293B",
                borderLeftWidth: 3,
                borderLeftColor: "#2DD4BF",
                gap: 12,
              }}
              onPress={() => router.push("/equipment")}
              activeOpacity={0.7}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#2DD4BF20" }}
              >
                <MaterialCommunityIcons
                  name="checkbox-marked-outline"
                  size={22}
                  color="#2DD4BF"
                />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-base" style={{ color: "#F1F5F9" }}>
                  Checker mon matos
                </Text>
                <Text className="text-xs" style={{ color: "#64748B" }}>
                  Vérifier l'inventaire équipement
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#334155"
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="rounded-xl p-4 flex-row items-center"
              style={{
                backgroundColor: "#1E293B",
                borderLeftWidth: 3,
                borderLeftColor: "#F97316",
                gap: 12,
              }}
              onPress={() => router.push("/board")}
              activeOpacity={0.7}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#F9731620" }}
              >
                <MaterialCommunityIcons
                  name="view-column"
                  size={22}
                  color="#F97316"
                />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-base" style={{ color: "#F1F5F9" }}>
                  Board Kanban
                </Text>
                <Text className="text-xs" style={{ color: "#64748B" }}>
                  Gérer tes tâches de production
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#334155"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </View>
    </ScrollView>
  );
}
