import { useEffect } from "react";
import { useUIStore } from "../../state/uiStore";
import { useConnectionStore } from "../../state/connectionStore";
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
  const activeModule = useUIStore((s) => s.activeModule);
  const ActiveComponent = MODULE_MAP[activeModule];
  const loadCredentials = useConnectionStore((s) => s.loadCredentials);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  return (
    <div className="app-shell">
      <Toolbar />
      <div className={styles.body}>
        <Sidebar />
        <div className={styles.divider} />
        <div className={styles.main}>
          <div className={styles.content}>
            <ActiveComponent />
          </div>
          <StatusBar />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
