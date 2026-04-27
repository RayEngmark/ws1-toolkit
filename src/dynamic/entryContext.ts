/**
 * Stub during the IA rework. Originally this returned the active dynamic-mode
 * object/action so verb modules could reorder their UI. With object-first
 * navigation, that context now flows from the drawer's open call (Phase 2).
 *
 * Returning null here means every verb module renders its default layout —
 * which is fine for Phase 1 since none of them are reachable from the sidebar.
 */
export function useEntryContext():
  | { objectKey: string; actionKey?: string }
  | null {
  return null;
}
