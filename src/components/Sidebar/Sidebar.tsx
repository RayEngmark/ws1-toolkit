import { type Module, useUIStore } from "../../state/uiStore";
import { useConnectionStore } from "../../state/connectionStore";
import {
  SettingsIcon,
  TagIcon,
  FolderTreeIcon,
  DeviceIcon,
  SearchIcon,
  PlayIcon,
  CheckIcon,
  XIcon,
} from "../../lib/icons";
import styles from "./Sidebar.module.css";

interface NavItem {
  id: Module;
  label: string;
  icon: React.ReactNode;
  requiresConnection?: boolean;
}

const QUICK_ACTIONS: NavItem[] = [
  { id: "tag-devices", label: "Tag devices", icon: <TagIcon />, requiresConnection: true },
  { id: "move-devices", label: "Move devices to OG", icon: <FolderTreeIcon />, requiresConnection: true },
  { id: "add-to-sg", label: "Add devices to smart group", icon: <CheckIcon />, requiresConnection: true },
  { id: "remove-from-sg", label: "Remove devices from smart group", icon: <XIcon />, requiresConnection: true },
];

const ASSIGNMENTS: NavItem[] = [
  { id: "assign-profile", label: "Assign profile", icon: <PlayIcon />, requiresConnection: true },
  { id: "assign-app", label: "Assign app to smart group", icon: <DeviceIcon />, requiresConnection: true },
];

const LOOKUPS: NavItem[] = [
  { id: "lookup-device", label: "Look up devices", icon: <SearchIcon />, requiresConnection: true },
  { id: "lookup-sg", label: "Look up smart group", icon: <SearchIcon />, requiresConnection: true },
];

const ADMIN: NavItem[] = [
  { id: "create-tag", label: "Create new tag", icon: <TagIcon />, requiresConnection: true },
];

const SETTINGS: NavItem[] = [
  { id: "settings", label: "Connection", icon: <SettingsIcon /> },
];

export function Sidebar() {
  const activeModule = useUIStore((s) => s.activeModule);
  const navigate = useUIStore((s) => s.navigate);
  const isConnected = useConnectionStore((s) => s.isConnected);

  const renderItem = (item: NavItem) => {
    const disabled = item.requiresConnection && !isConnected;
    const isActive = activeModule === item.id;
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
          <div className={styles.sectionHeader}>Quick Actions</div>
          <div className={styles.navList}>{QUICK_ACTIONS.map(renderItem)}</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionHeader}>Assignments</div>
          <div className={styles.navList}>{ASSIGNMENTS.map(renderItem)}</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionHeader}>Lookups</div>
          <div className={styles.navList}>{LOOKUPS.map(renderItem)}</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionHeader}>Admin</div>
          <div className={styles.navList}>{ADMIN.map(renderItem)}</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionHeader}>Settings</div>
          <div className={styles.navList}>{SETTINGS.map(renderItem)}</div>
        </div>
      </div>
    </aside>
  );
}
