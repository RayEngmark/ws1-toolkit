import { useState } from "react";
import styles from "./RawJson.module.css";

/**
 * Toggleable raw-JSON view. Required on every read-only data surface per the
 * healthcare-grade integrity rule: the operator must always be able to see
 * exactly what the server (or, here, the typed IPC layer) returned, so any
 * formatted view above can be verified against ground truth.
 */
export function RawJson({
  value,
  label = "Raw JSON",
}: {
  value: unknown;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrap}>
      <button
        className={styles.head}
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span className={styles.chev}>{open ? "▾" : "▸"}</span>
        <span className={styles.label}>{label}</span>
      </button>
      {open && (
        <pre className={styles.body}>
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}
