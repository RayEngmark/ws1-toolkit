import { create } from "zustand";
import * as api from "../ipc/client";
import type { ConnectionInfo } from "../ipc/contracts";

/** OAuth-only credentials + a working flag set. */
interface ConnectionState {
  tenantUrl: string;
  apiKey: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  specUrl: string;
  isConnected: boolean;
  isTesting: boolean;
  isSaving: boolean;
  isLoading: boolean;
  connectionError: string | null;
  setField: (field: string, value: string) => void;
  loadCredentials: () => Promise<void>;
  saveCredentials: () => Promise<void>;
  testConnection: () => Promise<ConnectionInfo>;
  connect: () => Promise<ConnectionInfo>;
  clearCredentials: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  tenantUrl: "",
  apiKey: "",
  clientId: "",
  clientSecret: "",
  tokenUrl: "",
  specUrl: "",
  isConnected: false,
  isTesting: false,
  isSaving: false,
  isLoading: true,
  connectionError: null,

  setField: (field, value) => set({ [field]: value }),

  loadCredentials: async () => {
    set({ isLoading: true });
    try {
      const config = await api.loadCredentials();
      if (config) {
        set({
          tenantUrl: config.tenantUrl,
          apiKey: config.apiKey,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          tokenUrl: config.tokenUrl,
          specUrl: config.specUrl ?? "",
        });
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
        tenantUrl: s.tenantUrl.trim(),
        apiKey: s.apiKey.trim(),
        clientId: s.clientId.trim(),
        clientSecret: s.clientSecret.trim(),
        tokenUrl: s.tokenUrl.trim(),
        specUrl: s.specUrl.trim() || undefined,
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

  connect: async () => {
    const s = get();
    set({ isSaving: true, isTesting: true, connectionError: null });
    try {
      await api.saveCredentials({
        tenantUrl: s.tenantUrl.trim(),
        apiKey: s.apiKey.trim(),
        clientId: s.clientId.trim(),
        clientSecret: s.clientSecret.trim(),
        tokenUrl: s.tokenUrl.trim(),
        specUrl: s.specUrl.trim() || undefined,
      });
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
      set({ isSaving: false, isTesting: false });
    }
  },

  clearCredentials: async () => {
    await api.clearCredentials();
    set({
      tenantUrl: "",
      apiKey: "",
      clientId: "",
      clientSecret: "",
      tokenUrl: "",
      specUrl: "",
      isConnected: false,
      connectionError: null,
    });
  },
}));
