import { create } from "zustand";
import * as api from "../ipc/client";
import type { Device } from "../ipc/contracts";

interface DeviceState {
  devices: Device[];
  selectedIds: Set<number>;
  searchQuery: string;
  searchBy: string;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  setSearchQuery: (query: string) => void;
  setSearchBy: (by: string) => void;
  search: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  toggleSelect: (id: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  selectedIds: new Set(),
  searchQuery: "",
  searchBy: "Serialnumber",
  isLoading: false,
  error: null,
  page: 0,
  pageSize: 50,
  total: 0,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchBy: (by) => set({ searchBy: by }),

  search: async () => {
    const { searchQuery, searchBy, pageSize } = get();
    if (!searchQuery.trim()) return;

    set({ isLoading: true, error: null, page: 0 });
    try {
      const result = await api.searchDevices(searchQuery, searchBy, 0, pageSize);
      set({
        devices: result.devices,
        total: result.total,
        page: result.page,
        selectedIds: new Set(),
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Search failed", devices: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  loadPage: async (page) => {
    const { searchQuery, searchBy, pageSize } = get();
    set({ isLoading: true, error: null });
    try {
      const result = await api.searchDevices(searchQuery, searchBy, page, pageSize);
      set({
        devices: result.devices,
        total: result.total,
        page: result.page,
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load page" });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectAll: () =>
    set((s) => ({
      selectedIds: new Set(s.devices.map((d) => d.id)),
    })),

  clearSelection: () => set({ selectedIds: new Set() }),
}));
