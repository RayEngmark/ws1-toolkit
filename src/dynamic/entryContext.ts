import { useUIStore } from "../state/uiStore";

/**
 * Returns the navigation entry context when the user is in Dynamic mode —
 * which object they drilled in from and which action they picked. Action
 * pages use this to reorder their UI so the "thing they came in with"
 * is the first thing they pick on the page.
 *
 * In Classic mode, returns null — pages render their default order with
 * full controls (target switchers, etc.) since there's no implied context.
 */
export function useEntryContext():
  | { objectKey: string; actionKey?: string }
  | null {
  const mode = useUIStore((s) => s.mode);
  const dynamicNav = useUIStore((s) => s.dynamicNav);
  if (mode !== "dynamic") return null;
  if (!dynamicNav.objectKey) return null;
  return {
    objectKey: dynamicNav.objectKey,
    actionKey: dynamicNav.actionKey,
  };
}
