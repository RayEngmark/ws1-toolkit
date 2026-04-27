import { RawJson } from "../RawJson/RawJson";
import styles from "./DetailGrid.module.css";

/**
 * Standard detail-pane layout for noun pages: header (name + sub), a 2-column
 * field grid, and an always-included Raw JSON toggle.
 *
 * Per the data-integrity rule, every field rendered here must be a real,
 * spec-defined field on the typed object — no placeholder fallbacks. Pass
 * undefined / empty-string values through; the component renders them as
 * "—" so the operator sees "missing" instead of a fabricated value.
 */
export interface DetailRowSpec {
  label: string;
  value: string | number | undefined | null;
  mono?: boolean;
}

export function DetailGrid({
  title,
  sub,
  rows,
  raw,
}: {
  title: string;
  sub?: string;
  rows: DetailRowSpec[];
  raw: unknown;
}) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <div className={styles.detailName}>{title}</div>
        {sub && <div className={styles.detailSub}>{sub}</div>}
      </div>
      <div className={styles.detailGrid}>
        {rows.map((r) => (
          <DetailRow key={r.label} {...r} />
        ))}
      </div>
      <RawJson value={raw} />
    </div>
  );
}

function DetailRow({ label, value, mono }: DetailRowSpec) {
  const display =
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value))
      ? "—"
      : String(value);
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={`${styles.rowValue} ${mono ? styles.rowMono : ""}`}>
        {display}
      </span>
    </div>
  );
}
