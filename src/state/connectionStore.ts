import { create } from "zustand";
import * as api from "../ipc/client";
import type { AuthMode, ConnectionInfo } from "../ipc/contracts";

interface ConnectionState {
  tenantUrl: string;
  apiKey: string;
  authMode: AuthMode;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  isConnected: boolean;
  isTesting: boolean;
  isSaving: boolean;
  isLoading: boolean;
  connectionError: string | null;
  setField: (field: string, value: string) => void;
  setAuthMode: (mode: AuthMode) => void;
  loadCredentials: () => Promise<void>;
  saveCredentials: () => Promise<void>;
  testConnection: () => Promise<ConnectionInfo>;
  clearCredentials: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  tenantUrl: "",
  apiKey: "",
  authMode: "basic",
  username: "",
  password: "",
  clientId: "",
  clientSecret: "",
  tokenUrl: "",
  isConnected: false,
  isTesting: false,
  isSaving: false,
  isLoading: true,
  connectionError: null,

  setField: (field, value) => set({ [field]: value }),
  setAuthMode: (mode) => set({ authMode: mode }),

  loadCredentials: async () => {
    set({ isLoading: true });
    try {
      const config = await api.loadCredentials();
      if (config) {
        set({
          tenantUrl: config.tenantUrl,
          apiKey: config.apiKey,
          authMode: config.authMode,
          username: config.username ?? "",
          password: config.password ?? "",
          clientId: config.clientId ?? "",
          clientSecret: config.clientSecret ?? "",
          tokenUrl: config.tokenUrl ?? "",
        });
        // Try auto-connect
        const info = await api.testConnection();
        set({ isConnected: info.connected, connectionError: info.error ?? null });
      }
    } catch {
      // No saved credentials, that's fine
    } finally {
      set({ isLoading: false });
    }
  },

  saveCredentials: async () => {
    const s = get();
    set({ isSaving: true });
    try {
      await api.saveCredentials({
        tenantUrl: s.tenantUrl,
        apiKey: s.apiKey,
        authMode: s.authMode,
        username: s.authMode === "basic" ? s.username : undefined,
        password: s.authMode === "basic" ? s.password : undefined,
        clientId: s.authMode === "oauth" ? s.clientId : undefined,
        clientSecret: s.authMode === "oauth" ? s.clientSecret : undefined,
        tokenUrl: s.authMode === "oauth" ? s.tokenUrl : undefined,
      });
    } finally {
      set({ isSaving: false });
    }
  },

  testConnection: async () => {
    set({ isTesting: true, connectionError: null });
    try {
      const info = await api.testConnection();
      set({
        isConnected: info.connected,
        connectionError: info.error ?? null,
      });
      return info;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      set({ isConnected: false, connectionError: msg });
      return { connected: false, error: msg };
    } finally {
      set({ isTesting: false });
    }
  },

  clearCredentials: async () => {
    await api.clearCredentials();
    set({
      tenantUrl: "",
      apiKey: "",
      authMode: "basic",
      username: "",
      password: "",
      clientId: "",
      clientSecret: "",
      tokenUrl: "",
      isConnected: false,
      connectionError: null,
    });
  },
}));
