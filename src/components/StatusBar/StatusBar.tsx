import { useConnectionStore } from "../../state/connectionStore";
import { useUIStore } from "../../state/uiStore";
import { CircleFilled } from "../../lib/icons";
import styles from "./StatusBar.module.css";

const MODULE_LABELS: Record<string, string> = {
  settings: "Connection",
  "tag-devices": "Tag devices",
  "move-devices": "Move devices to OG",
  "assign-profile": "Assign profile",
  "assign-app": "Assign app",
  "add-to-sg": "Add devices to smart group",
  "remove-from-sg": "Remove devices from smart group",
  "lookup-sg": "Look up smart group",
  "lookup-device": "Look up devices",
  "create-tag": "Create tag",
};

export function StatusBar() {
  const isConnected = useConnectionStore((s) => s.isConnected);
  const tenantUrl = useConnectionStore((s) => s.tenantUrl);
  const activeModule = useUIStore((s) => s.activeModule);

  const tenantHost = tenantUrl
    ? tenantUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "not configured";

  return (
    <footer className={styles.bar}>
      <span
        className={`${styles.segment} ${styles.status} ${isConnected ? styles.connected : styles.disconnected}`}
      >
        <CircleFilled size={8} />
        <span>{isConnected ? "Connected" : "Disconnected"}</span>
      </span>
      <span className={styles.segment}>{tenantHost}</span>
      <span className={styles.segment}>{MODULE_LABELS[activeModule]}</span>
      <span className={styles.spacer} />
      <span className={styles.segment}>UTF-8</span>
      <span className={styles.segment}>v0.1.0</span>
    </footer>
  );
}
