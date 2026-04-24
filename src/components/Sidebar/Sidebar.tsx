import { type Module, useUIStore } from "../../state/uiStore";
import { useConnectionStore } from "../../state/connectionStore";
import styles from "./Sidebar.module.css";

const NAV_ITEMS: { id: Module; label: string; icon: string }[] = [
  { id: "settings", label: "Settings", icon: "S" },
  { id: "devices", label: "Devices", icon: "D" },
  { id: "tagger", label: "Tagger", icon: "T" },
  { id: "ogmover", label: "OG Mover", icon: "O" },
];

export function Sidebar() {
  const activeModule = useUIStore((s) => s.activeModule);
  const navigate = useUIStore((s) => s.navigate);
  const isConnected = useConnectionStore((s) => s.isConnected);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>W1</span>
        <span className={styles.brandText}>WS1 Toolkit</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const disabled = item.id !== "settings" && !isConnected;
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeModule === item.id ? styles.active : ""}`}
              onClick={() => !disabled && navigate(item.id)}
              disabled={disabled}
              title={disabled ? "Connect to WS1 first" : item.label}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={`${styles.status} ${isConnected ? styles.connected : ""}`}>
          <span className={styles.dot} />
          <span className={styles.statusText}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </aside>
  );
}
