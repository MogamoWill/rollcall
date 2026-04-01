import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { zustandStorage } from "@/lib/storage";
import type { ChecklistPhase } from "@/types";
import { DEFAULT_TEMPLATES } from "@/constants/checklistTemplates";

export interface ProjectChecklist {
  id: string;
  project_id: string;
  phase: ChecklistPhase;
  title: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

interface ChecklistState {
  items: ProjectChecklist[];
  loading: boolean;
  fetchChecklists: (projectId: string) => Promise<void>;
  addItem: (projectId: string, phase: ChecklistPhase, title: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  applyTemplate: (projectId: string, phase: ChecklistPhase) => Promise<void>;
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      fetchChecklists: async (projectId: string) => {
        set({ loading: true });
        const { data, error } = await supabase
          .from("project_checklists")
          .select("*")
          .eq("project_id", projectId)
          .order("sort_order", { ascending: true });
        if (error) throw error;
        set({ items: data ?? [], loading: false });
      },

      addItem: async (projectId, phase, title) => {
        const currentItems = get().items.filter((i) => i.phase === phase);
        const maxOrder = currentItems.length > 0
          ? Math.max(...currentItems.map((i) => i.sort_order))
          : -1;

        const { data, error } = await supabase
          .from("project_checklists")
          .insert({
            project_id: projectId,
            phase,
            title,
            is_completed: false,
            sort_order: maxOrder + 1,
          })
          .select()
          .single();
        if (error) throw error;
        set((state) => ({ items: [...state.items, data] }));
      },

      toggleItem: async (id: string) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;
        const { error } = await supabase
          .from("project_checklists")
          .update({ is_completed: !item.is_completed })
          .eq("id", id);
        if (error) throw error;
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, is_completed: !i.is_completed } : i
          ),
        }));
      },

      deleteItem: async (id: string) => {
        const { error } = await supabase
          .from("project_checklists")
          .delete()
          .eq("id", id);
        if (error) throw error;
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      applyTemplate: async (projectId, phase) => {
        const templateItems = DEFAULT_TEMPLATES[phase];
        const rows = templateItems.map((t, idx) => ({
          project_id: projectId,
          phase,
          title: t.title,
          is_completed: false,
          sort_order: idx,
        }));

        const { data, error } = await supabase
          .from("project_checklists")
          .insert(rows)
          .select();
        if (error) throw error;
        set((state) => ({ items: [...state.items, ...(data ?? [])] }));
      },
    }),
    {
      name: "rollcall-checklists",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
