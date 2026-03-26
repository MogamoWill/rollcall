import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useProjectStore } from "@/stores/projectStore";
import { useEquipmentStore } from "@/stores/equipmentStore";
import { useBoardStore } from "@/stores/boardStore";
import type { ProjectStatus } from "@/types";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Brouillon",
  pre_prod: "Pré-prod",
  production: "Tournage",
  post_prod: "Post-prod",
  delivered: "Livré",
  archived: "Archivé",
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
  const upcomingShoots = projects
    .filter((p) => p.shoot_date && p.status !== "archived")
    .sort(
      (a, b) =>
        new Date(a.shoot_date!).getTime() - new Date(b.shoot_date!).getTime()
    )
    .slice(0, 3);

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-8">
        {/* Welcome */}
        <Text className="text-2xl font-bold text-slate-900 mb-6">
          🎬 RollCall
        </Text>

        {/* Quick Stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
            <Feather name="film" size={24} color="#3B82F6" />
            <Text className="text-2xl font-bold text-slate-900 mt-2">
              {activeProjects.length}
            </Text>
            <Text className="text-sm text-slate-500">Projets actifs</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
            <Feather name="camera" size={24} color="#8B5CF6" />
            <Text className="text-2xl font-bold text-slate-900 mt-2">
              {items.length}
            </Text>
            <Text className="text-sm text-slate-500">Équipements</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100">
            <Feather name="columns" size={24} color="#F59E0B" />
            <Text className="text-2xl font-bold text-slate-900 mt-2">
              {boards.length}
            </Text>
            <Text className="text-sm text-slate-500">Boards</Text>
          </View>
        </View>

        {/* Upcoming Shoots */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-slate-900 mb-3">
            Prochains tournages
          </Text>
          {upcomingShoots.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 border border-slate-100 items-center">
              <Feather name="calendar" size={32} color="#CBD5E1" />
              <Text className="text-slate-400 mt-2">
                Aucun tournage planifié
              </Text>
            </View>
          ) : (
            upcomingShoots.map((project) => (
              <TouchableOpacity
                key={project.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 mb-2"
                onPress={() => router.push(`/project/${project.id}`)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-slate-900">
                      {project.name}
                    </Text>
                    {project.client && (
                      <Text className="text-sm text-slate-500">
                        {project.client}
                      </Text>
                    )}
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-medium text-brand-500">
                      {new Date(project.shoot_date!).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                    <View
                      className="px-2 py-0.5 rounded-full mt-1"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[project.status] + "20",
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
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

        {/* Quick Actions */}
        <Text className="text-lg font-bold text-slate-900 mb-3">
          Actions rapides
        </Text>
        <View className="gap-2">
          <TouchableOpacity
            className="bg-brand-500 rounded-2xl p-4 flex-row items-center gap-3"
            onPress={() => router.push("/projects")}
          >
            <Feather name="plus-circle" size={22} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base">
              Nouveau projet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 flex-row items-center gap-3 border border-slate-100"
            onPress={() => router.push("/equipment")}
          >
            <Feather name="check-square" size={22} color="#1a6bff" />
            <Text className="text-slate-900 font-semibold text-base">
              Checker mon matos
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
