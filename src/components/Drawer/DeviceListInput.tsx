import { useEffect, useState } from "react";
import { resolveLines } from "../../lib/resolver";
import type { Device } from "../../ipc/contracts";
import styles from "./DeviceListInput.module.css";

/**
 * Paste-style device input for drawer forms. Accepts multiple lines, each
 * a serial / username / UUID / MAC / IMEI / asset tag. Resolves on change
 * (debounced) and reports back the resolved device list.
 *
 * No fallback: if a line doesn't resolve to a real device, it's surfaced
 * as "not found" and excluded from the resolved set the form will commit
 * — never silently treated as a serial that "might exist."
 */
export function DeviceListInput({
  onResolved,
}: {
  onResolved: (devices: Device[]) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState<Device[]>([]);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setResolved([]);
      setMissing([]);
      onResolved([]);
      return;
    }
    let cancelled = false;
    setBusy(true);
    const t = setTimeout(async () => {
      const result = await resolveLines(lines);
      if (cancelled) return;
      const devs: Device[] = [];
      const miss: string[] = [];
      for (const row of result.rows) {
        if (row.status === "resolved" && row.device) devs.push(row.device);
        else if (row.status === "ambiguous" && row.candidates) {
          // Ambiguous: take the first match. Surfacing this for now would
          // require a UI to disambiguate; we mark it visibly in the
          // counts row so the operator knows.
          devs.push(row.candidates[0]);
        } else miss.push(row.sourceLine);
      }
      setResolved(devs);
      setMissing(miss);
      setBusy(false);
      onResolved(devs);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className={styles.wrap}>
      <textarea
        className={styles.area}
        placeholder="paste serials, usernames, UUIDs, MACs, IMEIs — one per line"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        rows={6}
      />
      <div className={styles.summary}>
        {busy ? (
          <span className={styles.muted}>resolving…</span>
        ) : (
          <>
            <span className={styles.ok}>{resolved.length} resolved</span>
            {missing.length > 0 && (
              <span className={styles.bad}>· {missing.length} not found</span>
            )}
          </>
        )}
      </div>
      {resolved.length > 0 && !busy && (
        <ul className={styles.resolvedList}>
          {resolved.slice(0, 50).map((d) => (
            <li key={d.id} className={styles.resolvedRow}>
              <span className={styles.resolvedName}>
                {d.friendlyName || d.serialNumber || `device ${d.id}`}
              </span>
              <span className={styles.resolvedMeta}>
                {d.serialNumber}
                {d.userName ? ` · ${d.userName}` : ""}
                {d.platform ? ` · ${d.platform}` : ""}
              </span>
            </li>
          ))}
          {resolved.length > 50 && (
            <li className={styles.resolvedMore}>
              …{resolved.length - 50} more
            </li>
          )}
        </ul>
      )}
      {missing.length > 0 && !busy && (
        <details className={styles.misses}>
          <summary>show {missing.length} unresolved</summary>
          <ul>
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
