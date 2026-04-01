import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Shot, ShotType, ShotPriority } from "@/types";

interface ShotState {
  shots: Shot[];
  loading: boolean;
  fetchShots: (projectId: string) => Promise<void>;
  addShot: (shot: Omit<Shot, "id" | "is_completed">) => Promise<Shot>;
  toggleShot: (shotId: string) => Promise<void>;
  deleteShot: (shotId: string) => Promise<void>;
  reorderShots: (shots: Shot[]) => Promise<void>;
}

export const useShotStore = create<ShotState>((set, get) => ({
  shots: [],
  loading: false,

  fetchShots: async (projectId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("shots")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    set({ shots: (data as Shot[]) ?? [], loading: false });
  },

  addShot: async (shot) => {
    const maxOrder = Math.max(0, ...get().shots.map((s) => s.sort_order ?? 0));
    const { data, error } = await supabase
      .from("shots")
      .insert({
        project_id: shot.project_id,
        description: shot.description,
        shot_type: shot.shot_type,
        priority: shot.priority,
        notes: shot.notes,
        number: get().shots.length + 1,
        sort_order: maxOrder + 1,
        is_completed: false,
      })
      .select()
      .single();
    if (error) throw error;
    set({ shots: [...get().shots, data as Shot] });
    return data as Shot;
  },

  toggleShot: async (shotId) => {
    const shot = get().shots.find((s) => s.id === shotId);
    if (!shot) return;
    const { error } = await supabase
      .from("shots")
      .update({ is_completed: !shot.is_completed })
      .eq("id", shotId);
    if (error) throw error;
    set({
      shots: get().shots.map((s) =>
        s.id === shotId ? { ...s, is_completed: !s.is_completed } : s
      ),
    });
  },

  deleteShot: async (shotId) => {
    const { error } = await supabase.from("shots").delete().eq("id", shotId);
    if (error) throw error;
    set({ shots: get().shots.filter((s) => s.id !== shotId) });
  },

  reorderShots: async (shots) => {
    set({ shots });
    const updates = shots.map((s, i) =>
      supabase
        .from("shots")
        .update({ sort_order: i })
        .eq("id", s.id)
    );
    await Promise.all(updates);
  },
}));
