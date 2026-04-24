import { create } from "zustand";
import * as api from "../ipc/client";
import type { BulkActionResult, OrgGroup } from "../ipc/contracts";

interface OrgGroupState {
  groups: OrgGroup[];
  expandedIds: Set<number>;
  selectedOgId: number | null;
  isLoading: boolean;
  isMoving: boolean;
  error: string | null;
  lastResult: BulkActionResult | null;
  loadGroups: () => Promise<void>;
  expandGroup: (ogId: number) => Promise<void>;
  toggleExpand: (ogId: number) => void;
  selectGroup: (ogId: number) => void;
  moveDevices: (deviceIds: number[], targetOgId: number) => Promise<BulkActionResult>;
  clearResult: () => void;
}

export const useOrgGroupStore = create<OrgGroupState>((set, get) => ({
  groups: [],
  expandedIds: new Set(),
  selectedOgId: null,
  isLoading: false,
  isMoving: false,
  error: null,
  lastResult: null,

  loadGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const groups = await api.searchOrgGroups();
      set({ groups });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load groups" });
    } finally {
      set({ isLoading: false });
    }
  },

  expandGroup: async (ogId) => {
    try {
      const children = await api.getOgChildren(ogId);
      set((s) => {
        const updateChildren = (groups: OrgGroup[]): OrgGroup[] =>
          groups.map((g) => {
            if (g.id === ogId) return { ...g, children };
            if (g.children.length > 0)
              return { ...g, children: updateChildren(g.children) };
            return g;
          });
        const next = new Set(s.expandedIds);
        next.add(ogId);
        return { groups: updateChildren(s.groups), expandedIds: next };
      });
    } catch {
      // Non-critical
    }
  },

  toggleExpand: (ogId) =>
    set((s) => {
      const next = new Set(s.expandedIds);
      if (next.has(ogId)) {
        next.delete(ogId);
      } else {
        next.add(ogId);
        // Trigger child loading
        get().expandGroup(ogId);
      }
      return { expandedIds: next };
    }),

  selectGroup: (ogId) => set({ selectedOgId: ogId }),

  moveDevices: async (deviceIds, targetOgId) => {
    set({ isMoving: true, error: null });
    try {
      const result = await api.bulkMoveDevices(deviceIds, targetOgId);
      set({ lastResult: result });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to move devices";
      set({ error: msg });
      return { total: deviceIds.length, accepted: 0, failed: deviceIds.length, errors: [msg] };
    } finally {
      set({ isMoving: false });
    }
  },

  clearResult: () => set({ lastResult: null }),
}));
