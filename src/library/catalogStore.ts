import { create } from "zustand";
import { CATALOG as BUNDLED_CATALOG, type CatalogEndpoint } from "./catalog";

/**
 * Holds the active API catalog. By default we use the bundled markdown-derived
 * list; once the user successfully imports the spec from their tenant, the
 * imported list takes over.
 */
interface CatalogState {
  endpoints: CatalogEndpoint[];
  /** Where the active catalog came from. */
  source: "bundled" | "imported";
  /** When did we last import (epoch ms)? */
  importedAt: number | null;
  /** URL the spec came from on the last successful import. */
  sourceUrl: string | null;
  setImported: (endpoints: CatalogEndpoint[], sourceUrl: string) => void;
  resetToBundled: () => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  endpoints: BUNDLED_CATALOG as unknown as CatalogEndpoint[],
  source: "bundled",
  importedAt: null,
  sourceUrl: null,

  setImported: (endpoints, sourceUrl) =>
    set({
      endpoints,
      source: "imported",
      importedAt: Date.now(),
      sourceUrl,
    }),

  resetToBundled: () =>
    set({
      endpoints: BUNDLED_CATALOG as unknown as CatalogEndpoint[],
      source: "bundled",
      importedAt: null,
      sourceUrl: null,
    }),
}));
