import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useProjectStore } from "@/stores/projectStore";
import type { Project, ProjectStatus } from "@/types";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; icon: string }> = {
  draft: { label: "Brouillon", color: "#94A3B8", icon: "edit-3" },
  pre_prod: { label: "Pré-prod", color: "#3B82F6", icon: "clipboard" },
  production: { label: "Tournage", color: "#F59E0B", icon: "video" },
  post_prod: { label: "Post-prod", color: "#8B5CF6", icon: "film" },
  delivered: { label: "Livré", color: "#22C55E", icon: "check-circle" },
  archived: { label: "Archivé", color: "#64748B", icon: "archive" },
};

export default function ProjectsScreen() {
  const { projects, loading, fetchProjects, createProject, deleteProject } =
    useProjectStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    description: "",
    location: "",
    status: "draft" as ProjectStatus,
  });

  useEffect(() => {
    fetchProjects().catch(() => {});
  }, [fetchProjects]);

  const filteredProjects = filterStatus
    ? projects.filter((p) => p.status === filterStatus)
    : projects;

  const handleCreate = async () => {
    if (!newProject.name) {
      Alert.alert("Erreur", "Le nom du projet est obligatoire");
      return;
    }
    try {
      await createProject(newProject);
      setShowAddModal(false);
      setNewProject({
        name: "",
        client: "",
        description: "",
        location: "",
        status: "draft",
      });
    } catch {
      Alert.alert("Erreur", "Impossible de créer le projet");
    }
  };

  const handleDelete = (project: Project) => {
    Alert.alert("Supprimer", `Supprimer "${project.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteProject(project.id).catch(() => {}),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Status filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-14 px-4 pt-3"
      >
        <TouchableOpacity
          className={`mr-2 px-4 py-2 rounded-full ${
            !filterStatus ? "bg-brand-500" : "bg-white border border-slate-200"
          }`}
          onPress={() => setFilterStatus(null)}
        >
          <Text
            className={`text-sm font-medium ${
              !filterStatus ? "text-white" : "text-slate-700"
            }`}
          >
            Tous
          </Text>
        </TouchableOpacity>
        {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map((status) => (
          <TouchableOpacity
            key={status}
            className={`mr-2 px-4 py-2 rounded-full ${
              filterStatus === status
                ? "bg-brand-500"
                : "bg-white border border-slate-200"
            }`}
            onPress={() =>
              setFilterStatus(filterStatus === status ? null : status)
            }
          >
            <Text
              className={`text-sm font-medium ${
                filterStatus === status ? "text-white" : "text-slate-700"
              }`}
            >
              {STATUS_CONFIG[status].label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Projects list */}
      <ScrollView className="flex-1 px-4 pt-4">
        {loading ? (
          <Text className="text-center text-slate-400 mt-8">Chargement...</Text>
        ) : filteredProjects.length === 0 ? (
          <View className="items-center mt-16">
            <Feather name="film" size={48} color="#CBD5E1" />
            <Text className="text-slate-400 mt-4 text-base">Aucun projet</Text>
          </View>
        ) : (
          filteredProjects.map((project) => {
            const config = STATUS_CONFIG[project.status];
            return (
              <TouchableOpacity
                key={project.id}
                className="bg-white rounded-2xl p-4 mb-2 border border-slate-100"
                onLongPress={() => handleDelete(project)}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-semibold text-slate-900">
                      {project.name}
                    </Text>
                    {project.client && (
                      <Text className="text-sm text-slate-500 mt-0.5">
                        {project.client}
                      </Text>
                    )}
                  </View>
                  <View
                    className="px-3 py-1 rounded-full flex-row items-center gap-1"
                    style={{ backgroundColor: config.color + "15" }}
                  >
                    <Feather
                      name={config.icon as keyof typeof Feather.glyphMap}
                      size={12}
                      color={config.color}
                    />
                    <Text
                      className="text-xs font-medium"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </Text>
                  </View>
                </View>

                {(project.location || project.shoot_date) && (
                  <View className="flex-row gap-4 mt-1">
                    {project.location && (
                      <View className="flex-row items-center gap-1">
                        <Feather name="map-pin" size={12} color="#94A3B8" />
                        <Text className="text-xs text-slate-400">
                          {project.location}
                        </Text>
                      </View>
                    )}
                    {project.shoot_date && (
                      <View className="flex-row items-center gap-1">
                        <Feather name="calendar" size={12} color="#94A3B8" />
                        <Text className="text-xs text-slate-400">
                          {new Date(project.shoot_date).toLocaleDateString(
                            "fr-FR"
                          )}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
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
              Nouveau projet
            </Text>
            <TouchableOpacity onPress={handleCreate}>
              <Text className="text-brand-500 text-base font-semibold">
                Créer
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5 pt-4">
            <View className="gap-4">
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50"
                placeholder="Nom du projet *"
                placeholderTextColor="#94A3B8"
                value={newProject.name}
                onChangeText={(t) =>
                  setNewProject({ ...newProject, name: t })
                }
              />
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50"
                placeholder="Client"
                placeholderTextColor="#94A3B8"
                value={newProject.client}
                onChangeText={(t) =>
                  setNewProject({ ...newProject, client: t })
                }
              />
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50"
                placeholder="Lieu de tournage"
                placeholderTextColor="#94A3B8"
                value={newProject.location}
                onChangeText={(t) =>
                  setNewProject({ ...newProject, location: t })
                }
              />
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50"
                placeholder="Description"
                placeholderTextColor="#94A3B8"
                value={newProject.description}
                onChangeText={(t) =>
                  setNewProject({ ...newProject, description: t })
                }
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
