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
  | "remote-session"
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
  /** When set, the remote-session route renders a child Webview pointed at
   * this URL. Cleared when the operator backs out of the session. */
  remoteSessionUrl: string | null;
  /** Display name shown above the embedded session — typically the device's
   * friendly name so the operator knows which machine is on the other end. */
  remoteSessionLabel: string | null;
  toasts: Toast[];
  navigate: (route: Route) => void;
  openDrawer: (kind: DrawerKind, ctx: Record<string, unknown>) => void;
  closeDrawer: () => void;
  setLibraryEndpoint: (idx: number | null) => void;
  startRemoteSession: (url: string, label?: string) => void;
  endRemoteSession: () => void;
  addToast: (message: string, type: Toast["type"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  activeRoute: "settings",
  drawer: null,
  libraryEndpointIdx: null,
  remoteSessionUrl: null,
  remoteSessionLabel: null,
  toasts: [],

  navigate: (activeRoute) => set({ activeRoute, drawer: null }),
  openDrawer: (kind, ctx) => set({ drawer: { kind, ctx } }),
  closeDrawer: () => set({ drawer: null }),
  setLibraryEndpoint: (libraryEndpointIdx) => set({ libraryEndpointIdx }),
  startRemoteSession: (url, label) =>
    set({
      remoteSessionUrl: url,
      remoteSessionLabel: label ?? null,
      activeRoute: "remote-session",
      drawer: null,
    }),
  endRemoteSession: () =>
    set({
      remoteSessionUrl: null,
      remoteSessionLabel: null,
      activeRoute: "devices",
    }),

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
