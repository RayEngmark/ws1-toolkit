import { useEffect, useRef } from "react";
import { useUIStore } from "../../state/uiStore";
import { useConnectionStore } from "../../state/connectionStore";
import { useSelectionStore } from "../../state/selectionStore";
import { Sidebar } from "../Sidebar/Sidebar";
import { Toolbar } from "../Toolbar/Toolbar";
import { StatusBar } from "../StatusBar/StatusBar";
import { ToastContainer } from "../Toast/Toast";
import { Settings } from "../../modules/Settings/Settings";
import { TagDevices } from "../../modules/TagDevices/TagDevices";
import { MoveDevices } from "../../modules/MoveDevices/MoveDevices";
import { AssignProfile } from "../../modules/AssignProfile/AssignProfile";
import { AssignApp } from "../../modules/AssignApp/AssignApp";
import { AddToSmartGroup } from "../../modules/AddToSmartGroup/AddToSmartGroup";
import { RemoveFromSmartGroup } from "../../modules/RemoveFromSmartGroup/RemoveFromSmartGroup";
import { LookupSmartGroup } from "../../modules/LookupSmartGroup/LookupSmartGroup";
import { LookupDevice } from "../../modules/LookupDevice/LookupDevice";
import { CreateTag } from "../../modules/CreateTag/CreateTag";
import { DynamicShell } from "../../dynamic/DynamicShell";
import { LibraryShell } from "../../library/LibraryShell";
import styles from "./AppShell.module.css";

const MODULE_MAP = {
  settings: Settings,
  "tag-devices": TagDevices,
  "move-devices": MoveDevices,
  "assign-profile": AssignProfile,
  "assign-app": AssignApp,
  "add-to-sg": AddToSmartGroup,
  "remove-from-sg": RemoveFromSmartGroup,
  "lookup-sg": LookupSmartGroup,
  "lookup-device": LookupDevice,
  "create-tag": CreateTag,
} as const;

export function AppShell() {
  const mode = useUIStore((s) => s.mode);
  const activeModule = useUIStore((s) => s.activeModule);
  const dynamicNav = useUIStore((s) => s.dynamicNav);
  const ActiveComponent = MODULE_MAP[activeModule];
  const loadCredentials = useConnectionStore((s) => s.loadCredentials);
  const clearSelection = useSelectionStore((s) => s.clear);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // Reset device selection any time the user leaves a view (mode switch, sidebar
  // nav in Classic, breadcrumb / tile / action click in Dynamic). Selection is
  // scoped to the current view session.
  const isFirstNav = useRef(true);
  useEffect(() => {
    if (isFirstNav.current) {
      isFirstNav.current = false;
      return;
    }
    clearSelection();
  }, [
    mode,
    activeModule,
    dynamicNav.level,
    dynamicNav.objectKey,
    dynamicNav.actionKey,
    clearSelection,
  ]);

  return (
    <div className="app-shell">
      <Toolbar />
      <div className={styles.body}>
        {mode === "classic" && (
          <>
            <Sidebar />
            <div className={styles.divider} />
            <div className={styles.main}>
              <div className={styles.content}>
                <ActiveComponent />
              </div>
              <StatusBar />
            </div>
          </>
        )}
        {mode === "library" && (
          <div className={styles.main}>
            <div className={styles.content}>
              <LibraryShell />
            </div>
            <StatusBar />
          </div>
        )}
        {mode === "dynamic" && (
          <div className={styles.main}>
            <div className={styles.content}>
              <DynamicShell />
            </div>
            <StatusBar />
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
