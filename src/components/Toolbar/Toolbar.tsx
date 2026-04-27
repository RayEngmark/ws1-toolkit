import styles from "./Toolbar.module.css";

/**
 * Slim app title strip. Mode tabs and the dead Refresh button are gone with
 * the object-first IA rework — every screen is reachable from the sidebar
 * now, and connection state lives in the StatusBar.
 *
 * Kept as its own component so we can re-add things here later (global
 * search bar, command palette trigger, etc.) without touching AppShell.
 */
export function Toolbar() {
  return (
    <div className={styles.toolbar}>
      <div className={styles.brand}>WS1 Toolkit</div>
      <div className={styles.spacer} />
    </div>
  );
}
