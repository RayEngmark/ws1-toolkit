import { useEffect, useRef } from "react";
import { useUIStore, type Route } from "../../state/uiStore";
import { useConnectionStore } from "../../state/connectionStore";
import { useSelectionStore } from "../../state/selectionStore";
import { Sidebar } from "../Sidebar/Sidebar";
import { StatusBar } from "../StatusBar/StatusBar";
import { ToastContainer } from "../Toast/Toast";
import { FooterSlotProvider } from "./FooterSlot";
import { Settings } from "../../modules/Settings/Settings";
import { LookupDevice } from "../../modules/LookupDevice/LookupDevice";
import { SmartGroups } from "../../modules/SmartGroups/SmartGroups";
import { OrgGroups } from "../../modules/OrgGroups/OrgGroups";
import { Tags } from "../../modules/Tags/Tags";
import { Profiles } from "../../modules/Profiles/Profiles";
import { Apps } from "../../modules/Apps/Apps";
import { LibraryShell } from "../../library/LibraryShell";
import styles from "./AppShell.module.css";

const ROUTE_VIEW: Record<Route, () => React.ReactElement> = {
  devices: () => <LookupDevice />,
  smartgroups: () => <SmartGroups />,
  ogs: () => <OrgGroups />,
  tags: () => <Tags />,
  profiles: () => <Profiles />,
  apps: () => <Apps />,
  "api-explorer": () => <LibraryShell />,
  settings: () => <Settings />,
};

export function AppShell() {
  const activeRoute = useUIStore((s) => s.activeRoute);
  const loadCredentials = useConnectionStore((s) => s.loadCredentials);
  const clearSelection = useSelectionStore((s) => s.clear);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // Reset device selection any time the user changes routes — selection is
  // scoped to the current view session.
  const isFirstNav = useRef(true);
  useEffect(() => {
    if (isFirstNav.current) {
      isFirstNav.current = false;
      return;
    }
    clearSelection();
  }, [activeRoute, clearSelection]);

  const View = ROUTE_VIEW[activeRoute];

  return (
    <div className="app-shell">
      <FooterSlotProvider className={styles.actionFooterSlot}>
        <div className={styles.body}>
          <Sidebar />
          <div className={styles.divider} />
          <div className={styles.main}>
            <div className={styles.content}>
              <View />
            </div>
          </div>
        </div>
      </FooterSlotProvider>
      <StatusBar />
      <ToastContainer />
    </div>
  );
}
