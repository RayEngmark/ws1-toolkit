import { create } from "zustand";

export type Module = "settings" | "devices" | "tagger" | "ogmover";

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
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
