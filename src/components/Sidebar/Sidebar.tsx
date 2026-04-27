import { type Route, useUIStore } from "../../state/uiStore";
import { useConnectionStore } from "../../state/connectionStore";
import {
  SettingsIcon,
  TagIcon,
  FolderTreeIcon,
  DeviceIcon,
  SearchIcon,
  PlayIcon,
} from "../../lib/icons";
import styles from "./Sidebar.module.css";

interface NavItem {
  id: Route;
  label: string;
  icon: React.ReactNode;
  requiresConnection?: boolean;
}

const NOUNS: NavItem[] = [
  { id: "devices", label: "Devices", icon: <SearchIcon />, requiresConnection: true },
  { id: "smartgroups", label: "Smart Groups", icon: <DeviceIcon />, requiresConnection: true },
  { id: "ogs", label: "Org Groups", icon: <FolderTreeIcon />, requiresConnection: true },
  { id: "tags", label: "Tags", icon: <TagIcon />, requiresConnection: true },
  { id: "profiles", label: "Profiles", icon: <PlayIcon />, requiresConnection: true },
  { id: "apps", label: "Apps", icon: <DeviceIcon />, requiresConnection: true },
];

const UTILITIES: NavItem[] = [
  { id: "api-explorer", label: "API Explorer", icon: <SearchIcon />, requiresConnection: true },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

export function Sidebar() {
  const activeRoute = useUIStore((s) => s.activeRoute);
  const navigate = useUIStore((s) => s.navigate);
  const isConnected = useConnectionStore((s) => s.isConnected);

  const renderItem = (item: NavItem) => {
    const disabled = item.requiresConnection && !isConnected;
    const isActive = activeRoute === item.id;
    return (
      <button
        key={item.id}
        className={`${styles.navItem} ${isActive ? styles.active : ""}`}
        onClick={() => !disabled && navigate(item.id)}
        disabled={disabled}
        title={disabled ? "Connect to WS1 first" : item.label}
      >
        <span className={styles.navIcon}>{item.icon}</span>
        <span className={styles.navLabel}>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.scroll}>
        <div className={styles.section}>
          <div className={styles.navList}>{NOUNS.map(renderItem)}</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.navList}>{UTILITIES.map(renderItem)}</div>
        </div>
      </div>
    </aside>
  );
}
