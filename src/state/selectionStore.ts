import { create } from "zustand";
import type { Device } from "../ipc/contracts";

interface SelectionState {
  devices: Device[];
  add: (devices: Device[]) => void;
  remove: (id: number) => void;
  removeMany: (ids: number[]) => void;
  clear: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  devices: [],

  add: (devices) =>
    set((s) => {
      const existing = new Set(s.devices.map((d) => d.id));
      const merged = [...s.devices];
      for (const d of devices) {
        if (!existing.has(d.id)) {
          merged.push(d);
          existing.add(d.id);
        }
      }
      return { devices: merged };
    }),

  remove: (id) =>
    set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),

  removeMany: (ids) =>
    set((s) => {
      const remove = new Set(ids);
      return { devices: s.devices.filter((d) => !remove.has(d.id)) };
    }),

  clear: () => set({ devices: [] }),
}));
