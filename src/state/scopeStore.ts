import { create } from "zustand";
import * as api from "../ipc/client";
import type { OrgGroup } from "../ipc/contracts";

const LS_KEY_ID = "scope-og-id";
const LS_KEY_NAME = "scope-og-name";

interface ScopeState {
  /** Currently scoped OG. Null only briefly at boot before we resolve the
   * tenant root from `searchOrgGroups()`. After `init()`, always set. */
  activeOgId: number | null;
  activeOgName: string | null;
  /** True while we're fetching the OG tree to seed the default. */
  isInitializing: boolean;

  /** Fetch the OG tree and pick the first root as default if nothing is
   * persisted. Idempotent — call when the connection is established. */
  init: () => Promise<void>;
  /** Explicitly set the active OG. Persisted to localStorage. */
  setScope: (og: { id: number; name: string }) => void;
}

function readPersisted(): { id: number; name: string } | null {
  try {
    const idStr = localStorage.getItem(LS_KEY_ID);
    const name = localStorage.getItem(LS_KEY_NAME);
    if (!idStr || !name) return null;
    const id = Number.parseInt(idStr, 10);
    if (!Number.isFinite(id)) return null;
    return { id, name };
  } catch {
    return null;
  }
}

function writePersisted(og: { id: number; name: string } | null) {
  try {
    if (og) {
      localStorage.setItem(LS_KEY_ID, String(og.id));
      localStorage.setItem(LS_KEY_NAME, og.name);
    } else {
      localStorage.removeItem(LS_KEY_ID);
      localStorage.removeItem(LS_KEY_NAME);
    }
  } catch {
    // localStorage unavailable — scope simply won't persist this session.
  }
}

const persisted = readPersisted();

export const useScopeStore = create<ScopeState>((set, get) => ({
  activeOgId: persisted?.id ?? null,
  activeOgName: persisted?.name ?? null,
  isInitializing: false,

  init: async () => {
    if (get().activeOgId !== null) return;
    if (get().isInitializing) return;
    set({ isInitializing: true });
    try {
      const tree = await api.searchOrgGroups();
      const root = pickRoot(tree);
      if (root) {
        set({ activeOgId: root.id, activeOgName: root.name });
        writePersisted({ id: root.id, name: root.name });
      }
    } finally {
      set({ isInitializing: false });
    }
  },

  setScope: (og) => {
    set({ activeOgId: og.id, activeOgName: og.name });
    writePersisted(og);
  },
}));

function pickRoot(tree: OrgGroup[]): OrgGroup | null {
  if (tree.length === 0) return null;
  return tree[0];
}
