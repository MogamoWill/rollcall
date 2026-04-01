import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { zustandStorage } from "@/lib/storage";
import type { Project, Shot, Checklist, FieldNote } from "@/types";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  shots: Shot[];
  checklists: Checklist[];
  fieldNotes: FieldNote[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (project: Omit<Project, "id" | "created_at" | "updated_at" | "user_id">) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  fetchShots: (projectId: string) => Promise<void>;
  addShot: (shot: Omit<Shot, "id">) => Promise<void>;
  toggleShot: (id: string) => Promise<void>;
  fetchChecklists: (projectId: string) => Promise<void>;
  toggleChecklistItem: (itemId: string, checked: boolean) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      shots: [],
      checklists: [],
      fieldNotes: [],
      loading: false,

      fetchProjects: async () => {
        set({ loading: true });
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("updated_at", { ascending: false });
        if (error) throw error;
        set({ projects: data ?? [], loading: false });
      },

      createProject: async (project) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { data, error } = await supabase
          .from("projects")
          .insert({ ...project, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        set((state) => ({ projects: [data, ...state.projects] }));
        return data;
      },

      updateProject: async (id, updates) => {
        const { error } = await supabase
          .from("projects")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProject: async (id) => {
        const { error } = await supabase.from("projects").delete().eq("id", id);
        if (error) throw error;
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },

      setCurrentProject: (project) => set({ currentProject: project }),

      fetchShots: async (projectId) => {
        const { data, error } = await supabase
          .from("shots")
          .select("*")
          .eq("project_id", projectId)
          .order("order");
        if (error) throw error;
        set({ shots: data ?? [] });
      },

      addShot: async (shot) => {
        const { data, error } = await supabase
          .from("shots")
          .insert(shot)
          .select()
          .single();
        if (error) throw error;
        set((state) => ({ shots: [...state.shots, data] }));
      },

      toggleShot: async (id) => {
        const shot = get().shots.find((s) => s.id === id);
        if (!shot) return;
        const { error } = await supabase
          .from("shots")
          .update({ is_completed: !shot.is_completed })
          .eq("id", id);
        if (error) throw error;
        set((state) => ({
          shots: state.shots.map((s) =>
            s.id === id ? { ...s, is_completed: !s.is_completed } : s
          ),
        }));
      },

      fetchChecklists: async (projectId) => {
        const { data, error } = await supabase
          .from("checklists")
          .select("*, items:checklist_items(*)")
          .eq("project_id", projectId)
          .order("phase");
        if (error) throw error;
        set({ checklists: data ?? [] });
      },

      toggleChecklistItem: async (itemId, checked) => {
        const { error } = await supabase
          .from("checklist_items")
          .update({ is_checked: checked })
          .eq("id", itemId);
        if (error) throw error;
        set((state) => ({
          checklists: state.checklists.map((cl) => ({
            ...cl,
            items: cl.items.map((item) =>
              item.id === itemId ? { ...item, is_checked: checked } : item
            ),
          })),
        }));
      },
    }),
    {
      name: "rollcall-project",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
        shots: state.shots,
        checklists: state.checklists,
        fieldNotes: state.fieldNotes,
      }),
    }
  )
);
