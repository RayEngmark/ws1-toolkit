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

interface SavedDefault {
  id: number;
  name: string;
}

const LS_KEY = "remote-view-default";

function loadSavedDefault(): SavedDefault | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id === "number" && typeof parsed?.name === "string") {
      return parsed;
    }
  } catch {
    /* corrupt JSON in localStorage — treat as no default */
  }
  return null;
}

export function RemoteView({ device }: { device: Device }) {
  const addToast = useUIStore((s) => s.addToast);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<Destination[] | null>(null);
  const [firing, setFiring] = useState<number | null>(null);
  const [savedDefault, setSavedDefault] = useState<SavedDefault | null>(() =>
    loadSavedDefault()
  );
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

  const fire = async (dest: { id: number; name: string }) => {
    if (!device.serialNumber) {
      addToast("Device has no serial number — cannot start remote view", "error");
      return;
    }
    setFiring(dest.id);
    try {
      const r = await api.runRawEndpoint({
        method: "POST",
        path: `/api/mdm/devices/commands/remoteview?searchby=Serialnumber&id=${encodeURIComponent(device.serialNumber)}&remoteviewId=${dest.id}`,
      });
      if (r.ok) {
        addToast(`Remote view → ${dest.name}`, "success");
        // Remember this destination as the default for next time.
        const next = { id: dest.id, name: dest.name };
        localStorage.setItem(LS_KEY, JSON.stringify(next));
        setSavedDefault(next);
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

  const fireDefault = () => {
    if (!savedDefault) {
      setOpen(true);
      return;
    }
    fire(savedDefault);
  };

  const clearDefault = () => {
    localStorage.removeItem(LS_KEY);
    setSavedDefault(null);
  };

  return (
    <div className={styles.wrap} ref={ref}>
      <div className={styles.split}>
        <button
          className={styles.btnMain}
          onClick={fireDefault}
          disabled={firing !== null}
          type="button"
          title={
            savedDefault
              ? `Start remote view to ${savedDefault.name}`
              : "Pick a destination"
          }
        >
          {firing !== null
            ? "…"
            : savedDefault
              ? `Remote view → ${savedDefault.name}`
              : "Remote view…"}
        </button>
        <button
          className={styles.btnArrow}
          onClick={() => setOpen((v) => !v)}
          type="button"
          title="Pick a different destination"
          aria-label="Pick a different destination"
        >
          ▾
        </button>
      </div>
      {open && (
        <div className={styles.popover}>
          <div className={styles.popHead}>
            <span>Pick a destination</span>
            {savedDefault && (
              <button
                className={styles.popHeadAction}
                onClick={clearDefault}
                type="button"
              >
                clear default
              </button>
            )}
          </div>
          <div className={styles.popBody}>
            {loading && <div className={styles.muted}>loading…</div>}
            {error && <div className={styles.error}>{error}</div>}
            {destinations !== null && destinations.length === 0 && !error && (
              <div className={styles.muted}>
                no destinations configured in this OG — set one up in the WS1
                console
              </div>
            )}
            {destinations?.map((d) => {
              const isDefault = savedDefault?.id === d.destinationId;
              return (
                <button
                  key={d.destinationId}
                  className={`${styles.destRow} ${isDefault ? styles.destRowDefault : ""}`}
                  onClick={() =>
                    fire({ id: d.destinationId, name: d.destinationName })
                  }
                  disabled={firing !== null}
                  type="button"
                >
                  <span className={styles.destName}>
                    {d.destinationName || `dest ${d.destinationId}`}
                    {isDefault && (
                      <span className={styles.destDefault}>default</span>
                    )}
                  </span>
                  <span className={styles.destMeta}>
                    {d.destinationIPAddress || d.destinationMacAddress || ""}
                    {d.model ? ` · ${d.model}` : ""}
                  </span>
                  {firing === d.destinationId && (
                    <span className={styles.firing}>sending…</span>
                  )}
                </button>
              );
            })}
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
