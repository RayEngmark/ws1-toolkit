import { create } from "zustand";
import * as api from "../ipc/client";
import type { BulkActionResult, Tag } from "../ipc/contracts";

interface TagState {
  availableTags: Tag[];
  selectedTagIds: Set<number>;
  deviceTags: Map<number, Tag[]>;
  isLoading: boolean;
  error: string | null;
  lastResult: BulkActionResult | null;
  loadTags: (ogId: number) => Promise<void>;
  loadDeviceTags: (deviceId: number) => Promise<void>;
  toggleTag: (id: number) => void;
  clearTagSelection: () => void;
  addTagsToDevices: (tagId: number, deviceIds: number[]) => Promise<BulkActionResult>;
  removeTagsFromDevices: (tagId: number, deviceIds: number[]) => Promise<BulkActionResult>;
  clearResult: () => void;
}

export const useTagStore = create<TagState>((set) => ({
  availableTags: [],
  selectedTagIds: new Set(),
  deviceTags: new Map(),
  isLoading: false,
  error: null,
  lastResult: null,

  loadTags: async (ogId) => {
    set({ isLoading: true, error: null });
    try {
      const tags = await api.getTags(ogId);
      set({ availableTags: tags });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load tags" });
    } finally {
      set({ isLoading: false });
    }
  },

  loadDeviceTags: async (deviceId) => {
    try {
      const tags = await api.getDeviceTags(deviceId);
      set((s) => {
        const next = new Map(s.deviceTags);
        next.set(deviceId, tags);
        return { deviceTags: next };
      });
    } catch {
      // Non-critical, skip
    }
  },

  toggleTag: (id) =>
    set((s) => {
      const next = new Set(s.selectedTagIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedTagIds: next };
    }),

  clearTagSelection: () => set({ selectedTagIds: new Set() }),

  addTagsToDevices: async (tagId, deviceIds) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.addTagsToDevices(tagId, deviceIds);
      set({ lastResult: result });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add tags";
      set({ error: msg });
      return { total: deviceIds.length, accepted: 0, failed: deviceIds.length, errors: [msg] };
    } finally {
      set({ isLoading: false });
    }
  },

  removeTagsFromDevices: async (tagId, deviceIds) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.removeTagsFromDevices(tagId, deviceIds);
      set({ lastResult: result });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to remove tags";
      set({ error: msg });
      return { total: deviceIds.length, accepted: 0, failed: deviceIds.length, errors: [msg] };
    } finally {
      set({ isLoading: false });
    }
  },

  clearResult: () => set({ lastResult: null }),
}));
