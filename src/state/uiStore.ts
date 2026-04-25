import { create } from "zustand";

export type Module =
  | "settings"
  | "tag-devices"
  | "move-devices"
  | "assign-profile"
  | "assign-app"
  | "add-to-sg"
  | "remove-from-sg"
  | "lookup-sg"
  | "lookup-device"
  | "create-tag";

export type Mode = "classic" | "library" | "dynamic";

export type DynamicLevel = "home" | "object" | "action";

export interface DynamicNav {
  level: DynamicLevel;
  objectKey?: string;
  actionKey?: string;
}

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface UIState {
  mode: Mode;
  /** Active module for Classic mode */
  activeModule: Module;
  /** Drill-down state for Dynamic mode (kept in store but not exposed via toolbar tabs right now) */
  dynamicNav: DynamicNav;
  /** Selected endpoint in Library mode (catalog index). null = no selection. */
  libraryEndpointIdx: number | null;
  toasts: Toast[];
  setMode: (mode: Mode) => void;
  navigate: (module: Module) => void;
  setDynamicNav: (nav: DynamicNav) => void;
  setLibraryEndpoint: (idx: number | null) => void;
  addToast: (message: string, type: Toast["type"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  mode: "classic",
  activeModule: "settings",
  dynamicNav: { level: "home" },
  libraryEndpointIdx: null,
  toasts: [],

  setMode: (mode) => set({ mode }),
  navigate: (module) => set({ activeModule: module }),
  setDynamicNav: (dynamicNav) => set({ dynamicNav }),
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
