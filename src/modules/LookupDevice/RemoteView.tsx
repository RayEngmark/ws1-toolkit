import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import * as api from "../../ipc/client";
import type { Device } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import styles from "./RemoteView.module.css";

/**
 * Workspace ONE Assist (RM4) "Start remote view" button.
 *
 * One call:
 *   POST /api/mdm/remote-management/devices/{deviceUuid}/session
 *   → { session_url: "..." }
 *
 * The engineer's browser opens the returned URL — the Assist console
 * does the rest. No destination registration needed (unlike the older
 * Apple Remote View flow). Platform-neutral — works on Windows, Android,
 * iOS, macOS as long as the device is enrolled with Assist.
 *
 * Endpoint shape verified against /api/help/Docs/mdmv1 →
 * RemoteManagementSessionResponseV1Model.
 */
export function RemoteView({ device }: { device: Device }) {
  const addToast = useUIStore((s) => s.addToast);
  const [busy, setBusy] = useState(false);

  const fire = async () => {
    if (!device.uuid) {
      addToast(
        "Device has no UUID — cannot start remote management session",
        "error"
      );
      return;
    }
    setBusy(true);
    try {
      const r = await api.runRawEndpoint({
        method: "POST",
        path: `/api/mdm/remote-management/devices/${device.uuid}/session`,
        body: {},
      });
      if (!r.ok) {
        addToast(`Remote view failed (HTTP ${r.status})`, "error");
        return;
      }
      const url = pickSessionUrl(r.body);
      if (!url) {
        addToast(
          "Remote view session created but no session_url returned",
          "warning"
        );
        return;
      }
      try {
        await openUrl(url);
        addToast("Remote view session started", "success");
      } catch (e) {
        // If the OS launcher fails, surface the URL so the engineer can
        // copy it manually rather than swallow the value.
        addToast(`Open this URL manually: ${url}`, "info");
        console.error("Failed to open URL:", e);
      }
    } catch (e) {
      addToast(
        e instanceof Error ? e.message : "remote view failed",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className={styles.btn}
      onClick={fire}
      disabled={busy}
      type="button"
      title="Start a Workspace ONE Assist session for this device"
    >
      {busy ? "starting…" : "Remote view"}
    </button>
  );
}

/** Spec field is `session_url`; pass it through verbatim. */
function pickSessionUrl(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const url = (body as Record<string, unknown>).session_url;
  return typeof url === "string" && url.length > 0 ? url : null;
}
