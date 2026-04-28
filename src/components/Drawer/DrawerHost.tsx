import { useUIStore } from "../../state/uiStore";
import {
  ApplyTagDrawer,
  AssignAppDrawer,
  AssignProfileDrawer,
  CreateTagDrawer,
  MoveOgDrawer,
  SmartGroupMembershipDrawer,
} from "./forms";
import { ScopePickerDrawer } from "./ScopePickerDrawer";

/**
 * Watches uiStore.drawer; renders the right drawer form. Mounted once at the
 * AppShell level. Returns null when no drawer is open.
 */
export function DrawerHost() {
  const drawer = useUIStore((s) => s.drawer);
  if (!drawer) return null;

  switch (drawer.kind) {
    case "apply-tag":
      return <ApplyTagDrawer ctx={drawer.ctx as never} />;
    case "move-og":
      return <MoveOgDrawer ctx={drawer.ctx as never} />;
    case "add-to-sg":
      return (
        <SmartGroupMembershipDrawer
          ctx={{ ...(drawer.ctx as Record<string, unknown>), mode: "add" } as never}
        />
      );
    case "remove-from-sg":
      return (
        <SmartGroupMembershipDrawer
          ctx={{ ...(drawer.ctx as Record<string, unknown>), mode: "remove" } as never}
        />
      );
    case "assign-profile":
      return <AssignProfileDrawer ctx={drawer.ctx as never} />;
    case "assign-app":
      return <AssignAppDrawer ctx={drawer.ctx as never} />;
    case "create-tag":
      return <CreateTagDrawer ctx={drawer.ctx as never} />;
    case "delete-sg":
      // Not yet wired — the IPC for SG deletion isn't on the JS side. Close
      // silently rather than render a broken form.
      return null;
    case "scope-picker":
      return <ScopePickerDrawer />;
  }
}
