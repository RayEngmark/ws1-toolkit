import { useConnectionStore } from "../../state/connectionStore";
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

export function Toolbar() {
  const isConnected = useConnectionStore((s) => s.isConnected);
  const testConnection = useConnectionStore((s) => s.testConnection);

  return (
    <div className={styles.toolbar}>
      <div className={styles.brand}>WS1 Toolkit</div>
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
