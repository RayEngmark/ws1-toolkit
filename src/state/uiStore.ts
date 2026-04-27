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

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface UIState {
  activeRoute: Route;
  /** Selected endpoint in API Explorer (catalog index). null = no selection. */
  libraryEndpointIdx: number | null;
  toasts: Toast[];
  navigate: (route: Route) => void;
  setLibraryEndpoint: (idx: number | null) => void;
  addToast: (message: string, type: Toast["type"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  activeRoute: "settings",
  libraryEndpointIdx: null,
  toasts: [],

  navigate: (activeRoute) => set({ activeRoute }),
  setLibraryEndpoint: (libraryEndpointIdx) => set({ libraryEndpointIdx }),

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
