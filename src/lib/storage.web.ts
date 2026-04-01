import type { StateStorage } from "zustand/middleware";

export const zustandStorage: StateStorage = {
  getItem: async (name: string) => {
    return localStorage.getItem(name) ?? null;
  },
  setItem: async (name: string, value: string) => {
    localStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    localStorage.removeItem(name);
  },
};
