import styles from "./ComingSoon.module.css";

/**
 * Placeholder for noun pages not yet built. Phase 1 of the IA rework only
 * ships the Devices noun page; SG/OG/Tags/Profiles/Apps land in later phases.
 */
export function ComingSoon({ noun }: { noun: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{noun}</div>
      <div className={styles.note}>page not yet built — coming in a later phase</div>
    </div>
  );
}
