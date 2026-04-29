import { create } from "zustand";

/**
 * Sidebar routes — every screen in the app is one of these.
 * Object-first: the six nouns the user manages, then two utilities.
 */
export type Route =
  | "devices"
  | "smartgroups"
  | "ogs"
  | "tags"
  | "profiles"
  | "apps"
  | "api-explorer"
  | "settings";

/**
 * Drawer kinds — every action that pops a right-side slide-over.
 * `ctx` shape varies; the DrawerHost dispatches on `kind` to the right form.
 */
export type DrawerKind =
  | "apply-tag"
  | "move-og"
  | "add-to-sg"
  | "remove-from-sg"
  | "assign-profile"
  | "assign-app"
  | "create-tag"
  | "delete-sg"
  | "scope-picker";

export interface DrawerState {
  kind: DrawerKind;
  /** Pre-filled context — see each drawer form for the shape. */
  ctx: Record<string, unknown>;
}

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface UIState {
  activeRoute: Route;
  drawer: DrawerState | null;
  /** Selected endpoint in API Explorer (catalog index). null = no selection. */
  libraryEndpointIdx: number | null;
  /** When set, an overlay floats above the active route hosting a child
   * Webview pointed at this URL. Persists across sidebar navigation so the
   * operator can pop into Devices/Profiles/etc. without ending the live
   * Assist session. */
  remoteSession: { url: string; label: string | null; minimized: boolean } | null;
  toasts: Toast[];
  navigate: (route: Route) => void;
  openDrawer: (kind: DrawerKind, ctx: Record<string, unknown>) => void;
  closeDrawer: () => void;
  setLibraryEndpoint: (idx: number | null) => void;
  startRemoteSession: (url: string, label?: string) => void;
  endRemoteSession: () => void;
  /** Hide the overlay without destroying the underlying Webview, so the
   * operator can interact with the rest of the app and resume later. */
  minimizeRemoteSession: () => void;
  /** Bring the overlay back over the current route. */
  restoreRemoteSession: () => void;
  addToast: (message: string, type: Toast["type"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  activeRoute: "settings",
  drawer: null,
  libraryEndpointIdx: null,
  remoteSession: null,
  toasts: [],

  // Sidebar navigation auto-minimizes (not ends) any active session so the
  // operator can drop into another module and pop back without restarting.
  navigate: (activeRoute) =>
    set((s) => ({
      activeRoute,
      drawer: null,
      remoteSession: s.remoteSession
        ? { ...s.remoteSession, minimized: true }
        : null,
    })),
  openDrawer: (kind, ctx) => set({ drawer: { kind, ctx } }),
  closeDrawer: () => set({ drawer: null }),
  setLibraryEndpoint: (libraryEndpointIdx) => set({ libraryEndpointIdx }),
  startRemoteSession: (url, label) =>
    set({
      remoteSession: { url, label: label ?? null, minimized: false },
      drawer: null,
    }),
  endRemoteSession: () => set({ remoteSession: null }),
  minimizeRemoteSession: () =>
    set((s) =>
      s.remoteSession
        ? { remoteSession: { ...s.remoteSession, minimized: true } }
        : s
    ),
  restoreRemoteSession: () =>
    set((s) =>
      s.remoteSession
        ? { remoteSession: { ...s.remoteSession, minimized: false } }
        : s
    ),

  addToast: (message, type) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
