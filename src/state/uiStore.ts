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

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface UIState {
  activeModule: Module;
  toasts: Toast[];
  navigate: (module: Module) => void;
  addToast: (message: string, type: Toast["type"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  activeModule: "settings",
  toasts: [],

  navigate: (module) => set({ activeModule: module }),

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
