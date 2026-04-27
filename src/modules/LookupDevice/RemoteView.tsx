import { useEffect, useRef, useState } from "react";
import * as api from "../../ipc/client";
import type { Device } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import styles from "./RemoteView.module.css";

/**
 * Start-remote-view button for the DeviceDetail quick-actions row.
 *
 * Two-step under the hood:
 *  1. GET /api/mdm/apple/remoteviewdestination — lists the engineer-side
 *     destinations registered in this OG.
 *  2. POST /api/mdm/devices/commands/remoteview?searchby=Serialnumber&id=…
 *     &remoteviewId=… — kicks the session off, streaming to the chosen
 *     destination.
 *
 * Field names verified against the live mdmv1 spec at
 * /api/help/Docs/mdmv1 (RemoteViewDestinationV1Model). Destination data
 * passes through verbatim — no fabricated fallback values.
 */
interface Destination {
  destinationId: number;
  destinationName: string;
  destinationIPAddress: string;
  destinationMacAddress: string;
  model: string;
}

export function RemoteView({ device }: { device: Device }) {
  const addToast = useUIStore((s) => s.addToast);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<Destination[] | null>(null);
  const [firing, setFiring] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside to close.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Fetch destinations on first open.
  useEffect(() => {
    if (!open || destinations !== null || loading) return;
    setLoading(true);
    setError(null);
    api
      .runRawEndpoint({
        method: "GET",
        path: "/api/mdm/apple/remoteviewdestination",
      })
      .then((r) => {
        if (!r.ok) {
          setError(`HTTP ${r.status}`);
          return;
        }
        const list = pickDestinations(r.body);
        setDestinations(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"))
      .finally(() => setLoading(false));
  }, [open, destinations, loading]);

  const fire = async (dest: Destination) => {
    if (!device.serialNumber) {
      addToast("Device has no serial number — cannot start remote view", "error");
      return;
    }
    setFiring(dest.destinationId);
    try {
      const r = await api.runRawEndpoint({
        method: "POST",
        path: `/api/mdm/devices/commands/remoteview?searchby=Serialnumber&id=${encodeURIComponent(device.serialNumber)}&remoteviewId=${dest.destinationId}`,
      });
      if (r.ok) {
        addToast(`Remote view → ${dest.destinationName}`, "success");
        setOpen(false);
      } else {
        addToast(`Remote view failed (HTTP ${r.status})`, "error");
      }
    } catch (e) {
      addToast(
        e instanceof Error ? e.message : "remote view failed",
        "error"
      );
    } finally {
      setFiring(null);
    }
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.btn}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {open ? "▾ Remote view" : "Remote view ▾"}
      </button>
      {open && (
        <div className={styles.popover}>
          <div className={styles.popHead}>Pick a destination</div>
          <div className={styles.popBody}>
            {loading && <div className={styles.muted}>loading…</div>}
            {error && <div className={styles.error}>{error}</div>}
            {destinations !== null && destinations.length === 0 && !error && (
              <div className={styles.muted}>
                no destinations configured in this OG — set one up in the WS1
                console
              </div>
            )}
            {destinations?.map((d) => (
              <button
                key={d.destinationId}
                className={styles.destRow}
                onClick={() => fire(d)}
                disabled={firing !== null}
                type="button"
              >
                <span className={styles.destName}>
                  {d.destinationName || `dest ${d.destinationId}`}
                </span>
                <span className={styles.destMeta}>
                  {d.destinationIPAddress || d.destinationMacAddress || ""}
                  {d.model ? ` · ${d.model}` : ""}
                </span>
                {firing === d.destinationId && (
                  <span className={styles.firing}>sending…</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The endpoint returns either a bare array or { Destinations: [...] } —
 * accept both. Field names from the spec; no fallback to fabricated keys.
 */
function pickDestinations(body: unknown): Destination[] {
  const arr = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray(
          (body as Record<string, unknown>).Destinations
        )
      ? ((body as Record<string, unknown>).Destinations as unknown[])
      : [];
  return arr.map((d) => {
    const r = d as Record<string, unknown>;
    return {
      destinationId: typeof r.destinationId === "number" ? r.destinationId : 0,
      destinationName:
        typeof r.destinationName === "string" ? r.destinationName : "",
      destinationIPAddress:
        typeof r.destinationIPAddress === "string"
          ? r.destinationIPAddress
          : "",
      destinationMacAddress:
        typeof r.destinationMacAddress === "string"
          ? r.destinationMacAddress
          : "",
      model: typeof r.model === "string" ? r.model : "",
    };
  });
}
