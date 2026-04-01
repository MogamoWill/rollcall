import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { zustandStorage } from "@/lib/storage";
import type { Equipment, EquipmentKit, EquipmentUniverse } from "@/types";

interface EquipmentState {
  items: Equipment[];
  kits: EquipmentKit[];
  loading: boolean;
  fetchEquipment: () => Promise<void>;
  addEquipment: (item: Omit<Equipment, "id" | "created_at" | "updated_at" | "user_id">) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  fetchKits: () => Promise<void>;
  getByUniverse: (universe: EquipmentUniverse) => Equipment[];
}

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      items: [],
      kits: [],
      loading: false,

      fetchEquipment: async () => {
        set({ loading: true });
        const { data, error } = await supabase
          .from("equipment_items")
          .select("*")
          .order("universe")
          .order("name");
        if (error) throw error;
        set({ items: data ?? [], loading: false });
      },

      addEquipment: async (item) => {
        // For high-value items, generate a QR code value using the Supabase-generated ID
        const { data, error } = await supabase
          .from("equipment_items")
          .insert(item)
          .select()
          .single();
        if (error) throw error;
        // If high-value, set qr_code to the item ID for tracking
        if (data.is_high_value && !data.qr_code) {
          const qrValue = `rollcall:equipment:${data.id}`;
          const { error: updateError } = await supabase
            .from("equipment_items")
            .update({ qr_code: qrValue })
            .eq("id", data.id);
          if (!updateError) {
            data.qr_code = qrValue;
          }
        }
        set((state) => ({ items: [...state.items, data] }));
      },

      updateEquipment: async (id, updates) => {
        const { error } = await supabase
          .from("equipment_items")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        }));
      },

      deleteEquipment: async (id) => {
        const { error } = await supabase.from("equipment_items").delete().eq("id", id);
        if (error) throw error;
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      fetchKits: async () => {
        const { data, error } = await supabase
          .from("equipment_kits")
          .select("*, items:kit_items(*, equipment(*))");
        if (error) throw error;
        set({ kits: data ?? [] });
      },

      getByUniverse: (universe) => {
        return get().items.filter((i) => i.universe === universe);
      },
    }),
    {
      name: "rollcall-equipment",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ items: state.items, kits: state.kits }),
    }
  )
);
