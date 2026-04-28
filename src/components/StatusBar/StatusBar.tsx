import { useConnectionStore } from "../../state/connectionStore";
import { useSelectionStore } from "../../state/selectionStore";
import { useUIStore, type Route } from "../../state/uiStore";
import { CircleFilled } from "../../lib/icons";
import styles from "./StatusBar.module.css";

const ROUTE_LABELS: Record<Route, string> = {
  devices: "Devices",
  smartgroups: "Smart Groups",
  ogs: "Org Groups",
  tags: "Tags",
  profiles: "Profiles",
  apps: "Apps",
  "api-explorer": "API Explorer",
  settings: "Settings",
};

export function StatusBar() {
  const isConnected = useConnectionStore((s) => s.isConnected);
  const tenantUrl = useConnectionStore((s) => s.tenantUrl);
  const activeRoute = useUIStore((s) => s.activeRoute);
  const selectionCount = useSelectionStore((s) => s.devices.length);
  const clearSelection = useSelectionStore((s) => s.clear);

  const tenantHost = tenantUrl
    ? tenantUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "not configured";

  return (
    <footer className={styles.bar}>
      <div className={styles.left}>
        <span
          className={`${styles.segment} ${styles.status} ${isConnected ? styles.connected : styles.disconnected}`}
        >
          <CircleFilled size={8} />
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </span>
        <span className={styles.segment}>{tenantHost}</span>
      </div>
      <div className={styles.right}>
        <span className={styles.segment}>{ROUTE_LABELS[activeRoute]}</span>
        <span className={styles.spacer} />
        {selectionCount > 0 && (
          <button
            className={`${styles.segment} ${styles.selectionPill}`}
            onClick={clearSelection}
            title="Clear selection"
          >
            <span>{selectionCount} selected</span>
            <span className={styles.clearLabel}>× clear</span>
          </button>
        )}
        <span className={styles.segment}>UTF-8</span>
        <span className={styles.segment}>v0.1.0</span>
      </div>
    </footer>
  );
}
