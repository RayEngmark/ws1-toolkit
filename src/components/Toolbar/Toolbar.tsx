import { useConnectionStore } from "../../state/connectionStore";
import { useUIStore, type Mode } from "../../state/uiStore";
import { ConnectIcon, RefreshIcon } from "../../lib/icons";
import styles from "./Toolbar.module.css";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function ToolbarButton({ icon, label, active, disabled, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${active ? styles.active : ""}`}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "classic", label: "Classic", hint: "Sidebar list of curated actions" },
  { id: "library", label: "Library", hint: "Browse and run any WS1 MDM API endpoint" },
];

export function Toolbar() {
  const isConnected = useConnectionStore((s) => s.isConnected);
  const testConnection = useConnectionStore((s) => s.testConnection);
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);

  return (
    <div className={styles.toolbar}>
      <div className={styles.brand}>WS1 Toolkit</div>
      <div className={styles.sep} />

      <div className={styles.modeTabs} role="tablist">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            className={`${styles.modeTab} ${mode === m.id ? styles.modeTabActive : ""}`}
            onClick={() => setMode(m.id)}
            title={m.hint}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className={styles.sep} />
      <ToolbarButton
        icon={<ConnectIcon />}
        label="Test connection"
        active={isConnected}
        onClick={() => testConnection()}
      />
      <ToolbarButton
        icon={<RefreshIcon />}
        label="Refresh"
        disabled={!isConnected}
      />
      <div className={styles.spacer} />
    </div>
  );
}
