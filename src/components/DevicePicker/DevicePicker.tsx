import { useEffect, useRef, useState } from "react";
import type { Device, ResolvedRow } from "../../ipc/contracts";
import { detectType, resolveLines, TYPE_LABEL } from "../../lib/resolver";
import { CheckIcon, XIcon, SearchIcon } from "../../lib/icons";
import styles from "./DevicePicker.module.css";

interface Props {
  /** Array of resolved devices — controlled. */
  resolved: Device[];
  onChange: (devices: Device[]) => void;
}

export function DevicePicker({ resolved, onChange }: Props) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ResolvedRow[]>([]);
  const [resolving, setResolving] = useState(false);
  const [showRows, setShowRows] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live preview of detected types per line as user types
  const previewLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Auto-resolve after user stops typing for 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (previewLines.length === 0) {
      setRows([]);
      onChange([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setResolving(true);
      try {
        const result = await resolveLines(previewLines);
        setRows(result.rows);
        onChange(result.resolvedDevices);
      } finally {
        setResolving(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const counts = {
    resolved: rows.filter((r) => r.status === "resolved").length,
    notFound: rows.filter((r) => r.status === "notFound").length,
    ambiguous: rows.filter((r) => r.status === "ambiguous").length,
  };

  const handleClear = () => {
    setText("");
    setRows([]);
    onChange([]);
  };

  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <span className={styles.title}>Devices</span>
        <span className={styles.subtitle}>
          Paste serials, usernames, UUIDs, MAC, IMEI, or asset tags — one per line
        </span>
      </div>

      <div className={styles.body}>
        <textarea
          className={styles.textarea}
          placeholder="C02X917QML87&#10;john.doe&#10;5523af00-1234-4abc-9def-aaaaaaaa1003&#10;..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />

        {previewLines.length > 0 && (
          <div className={styles.results}>
            <div className={styles.summary}>
              <Pill type="ok" label={`${resolved.length} resolved`} />
              {counts.notFound > 0 && (
                <Pill type="err" label={`${counts.notFound} not found`} />
              )}
              {counts.ambiguous > 0 && (
                <Pill type="warn" label={`${counts.ambiguous} ambiguous`} />
              )}
              {resolving && <span className={styles.resolving}>Resolving…</span>}
              <span className={styles.spacer} />
              <button className={styles.toggleBtn} onClick={() => setShowRows((v) => !v)}>
                {showRows ? "Hide details" : "Show details"}
              </button>
              <button className={styles.clearBtn} onClick={handleClear} title="Clear all">
                Clear
              </button>
            </div>

            {showRows && (
              <div className={styles.rowList}>
                {rows.map((row, i) => (
                  <RowItem key={`${row.sourceLine}-${i}`} row={row} />
                ))}
                {rows.length === 0 &&
                  previewLines.map((line, i) => (
                    <div key={i} className={styles.row}>
                      <span className={styles.rowSource}>{line}</span>
                      <span className={styles.rowType}>
                        {TYPE_LABEL[detectType(line)]}
                      </span>
                      <span className={styles.rowStatus}>pending…</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RowItem({ row }: { row: ResolvedRow }) {
  return (
    <div className={`${styles.row} ${styles[`row_${row.status}`]}`}>
      <span className={styles.rowIcon}>
        {row.status === "resolved" ? (
          <CheckIcon size={12} />
        ) : row.status === "notFound" ? (
          <XIcon size={12} />
        ) : (
          <SearchIcon size={12} />
        )}
      </span>
      <span className={styles.rowSource}>{row.sourceLine}</span>
      <span className={styles.rowType}>{TYPE_LABEL[row.detectedType]}</span>
      {row.status === "resolved" && row.device && (
        <span className={styles.rowDevice}>
          → {row.device.friendlyName}
          <span className={styles.rowMeta}>
            {row.device.userName} · {row.device.ogName}
          </span>
        </span>
      )}
      {row.status === "ambiguous" && row.candidates && (
        <span className={styles.rowAmbiguous}>
          {row.candidates.length} matches — refine input
        </span>
      )}
      {row.status === "notFound" && (
        <span className={styles.rowError}>{row.error ?? "Not found"}</span>
      )}
    </div>
  );
}

function Pill({ type, label }: { type: "ok" | "err" | "warn"; label: string }) {
  return <span className={`${styles.pill} ${styles[`pill_${type}`]}`}>{label}</span>;
}
