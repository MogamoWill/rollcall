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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProjectStore } from "@/stores/projectStore";
import type { Project, ProjectStatus } from "@/types";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; icon: string }
> = {
  draft: { label: "Brouillon", color: "#94A3B8", icon: "pencil-outline" },
  pre_prod: { label: "Pre-prod", color: "#3B82F6", icon: "clipboard-text-outline" },
  production: { label: "Tournage", color: "#F59E0B", icon: "video-outline" },
  post_prod: { label: "Post-prod", color: "#8B5CF6", icon: "movie-edit" },
  delivered: { label: "Livre", color: "#22C55E", icon: "check-circle-outline" },
  archived: { label: "Archive", color: "#64748B", icon: "archive-outline" },
};

const PHASE_STEPS: ProjectStatus[] = [
  "draft",
  "pre_prod",
  "production",
  "post_prod",
  "delivered",
];

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
      Alert.alert("Erreur", "Impossible de creer le projet");
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

  const getPhaseIndex = (status: ProjectStatus) =>
    PHASE_STEPS.indexOf(status);

  return (
    <View className="flex-1" style={{ backgroundColor: "#0F172A" }}>
      <View style={{ maxWidth: 720, width: "100%", alignSelf: "center", flex: 1 }}>
      {/* Status filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pt-3 pb-2"
        style={{ maxHeight: 52 }}
      >
        <TouchableOpacity
          className="mr-2 px-4 py-2 rounded-full"
          style={{
            backgroundColor: !filterStatus ? "#E8A838" : "#1E293B",
            borderWidth: !filterStatus ? 0 : 1,
            borderColor: "#334155",
          }}
          onPress={() => setFilterStatus(null)}
        >
          <Text
            className="text-sm font-semibold"
            style={{ color: !filterStatus ? "#FFFFFF" : "#94A3B8" }}
          >
            Tous
          </Text>
        </TouchableOpacity>
        {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map((status) => {
          const isActive = filterStatus === status;
          return (
            <TouchableOpacity
              key={status}
              className="mr-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: isActive ? "#E8A838" : "#1E293B",
                borderWidth: isActive ? 0 : 1,
                borderColor: "#334155",
              }}
              onPress={() =>
                setFilterStatus(filterStatus === status ? null : status)
              }
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: isActive ? "#FFFFFF" : "#94A3B8" }}
              >
                {STATUS_CONFIG[status].label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Projects list */}
      <ScrollView className="flex-1 px-4 pt-3">
        {loading ? (
          <Text className="text-center mt-8" style={{ color: "#475569" }}>
            Chargement...
          </Text>
        ) : filteredProjects.length === 0 ? (
          <View className="items-center mt-16">
            <MaterialCommunityIcons
              name="movie-open-outline"
              size={52}
              color="#334155"
            />
            <Text className="mt-4 text-base" style={{ color: "#475569" }}>
              Aucun projet
            </Text>
          </View>
        ) : (
          filteredProjects.map((project) => {
            const config = STATUS_CONFIG[project.status];
            const phaseIdx = getPhaseIndex(project.status);
            return (
              <TouchableOpacity
                key={project.id}
                className="rounded-xl p-4 mb-3"
                style={{
                  backgroundColor: "#1E293B",
                  borderLeftWidth: 3,
                  borderLeftColor: config.color,
                }}
                onLongPress={() => handleDelete(project)}
                activeOpacity={0.7}
              >
                {/* Header row */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text
                      className="text-base font-bold"
                      style={{ color: "#F1F5F9" }}
                    >
                      {project.name}
                    </Text>
                    {project.client && (
                      <Text
                        className="text-sm mt-0.5"
                        style={{ color: "#64748B" }}
                      >
                        {project.client}
                      </Text>
                    )}
                  </View>
                  <View
                    className="px-3 py-1.5 rounded-full flex-row items-center"
                    style={{
                      backgroundColor: config.color + "20",
                      gap: 4,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={config.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={13}
                      color={config.color}
                    />
                    <Text
                      className="text-xs font-bold"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </Text>
                  </View>
                </View>

                {/* Phase indicator */}
                {project.status !== "archived" && (
                  <View className="flex-row items-center mb-3" style={{ gap: 3 }}>
                    {PHASE_STEPS.map((step, idx) => {
                      const stepConfig = STATUS_CONFIG[step];
                      const isCompleted = idx <= phaseIdx;
                      const isCurrent = idx === phaseIdx;
                      return (
                        <View key={step} className="flex-1 items-center">
                          <View
                            className="w-full rounded-full"
                            style={{
                              height: 4,
                              backgroundColor: isCompleted
                                ? stepConfig.color
                                : "#334155",
                              opacity: isCurrent ? 1 : isCompleted ? 0.6 : 0.3,
                            }}
                          />
                          <Text
                            className="text-xs mt-1"
                            style={{
                              color: isCurrent
                                ? stepConfig.color
                                : "#475569",
                              fontWeight: isCurrent ? "700" : "400",
                              fontSize: 9,
                            }}
                          >
                            {stepConfig.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Meta info */}
                {(project.location || project.shoot_date) && (
                  <View className="flex-row" style={{ gap: 12 }}>
                    {project.location && (
                      <View
                        className="flex-row items-center"
                        style={{ gap: 4 }}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={12}
                          color="#475569"
                        />
                        <Text
                          className="text-xs"
                          style={{ color: "#475569" }}
                        >
                          {project.location}
                        </Text>
                      </View>
                    )}
                    {project.shoot_date && (
                      <View
                        className="flex-row items-center"
                        style={{ gap: 4 }}
                      >
                        <MaterialCommunityIcons
                          name="calendar-outline"
                          size={12}
                          color="#475569"
                        />
                        <Text
                          className="text-xs"
                          style={{ color: "#475569" }}
                        >
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
              Nouveau projet
            </Text>
            <TouchableOpacity onPress={handleCreate}>
              <Text
                className="text-base font-semibold"
                style={{ color: "#E8A838" }}
              >
                Creer
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5 pt-4">
            <View style={{ gap: 14 }}>
              <TextInput
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Nom du projet *"
                placeholderTextColor="#475569"
                value={newProject.name}
                onChangeText={(t) =>
                  setNewProject({ ...newProject, name: t })
                }
              />
              <TextInput
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Client"
                placeholderTextColor="#475569"
                value={newProject.client}
                onChangeText={(t) =>
                  setNewProject({ ...newProject, client: t })
                }
              />
              <TextInput
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Lieu de tournage"
                placeholderTextColor="#475569"
                value={newProject.location}
                onChangeText={(t) =>
                  setNewProject({ ...newProject, location: t })
                }
              />
              <TextInput
                className="rounded-xl px-4 py-3 text-base"
                style={{
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Description"
                placeholderTextColor="#475569"
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
    </View>
  );
}
