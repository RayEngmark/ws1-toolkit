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
 * The session URL is opened in the operator's default browser — Assist
 * relays sniff for non-standard browsers and refuse to render in an
 * embedded WebView2, even with a spoofed Edge user-agent. Keeping the
 * launch in the system browser is the only path that consistently works.
 * Platform-neutral — works on Windows, Android, iOS, macOS as long as
 * the device is enrolled with Assist.
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
        const detail = describeError(r.body);
        addToast(
          detail
            ? `Remote view failed (HTTP ${r.status}) — ${detail}`
            : `Remote view failed (HTTP ${r.status})`,
          "error"
        );
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
        addToast("Remote view session started in browser", "success");
      } catch (e) {
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

/**
 * WS1 error responses carry the reason in shapes that vary by endpoint:
 * `{ errorCode, message }`, `{ Message }`, `{ error_description }`, or a bare
 * string. Surface whichever is present so the on-screen toast tells the
 * operator the actual reason (e.g. RM error 5257 vs 5006 vs 5119) instead of
 * a bare HTTP status.
 */
function describeError(body: unknown): string | null {
  if (body == null) return null;
  if (typeof body === "string") return body.slice(0, 240) || null;
  if (typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const code = o.errorCode ?? o.ErrorCode ?? o.error_code;
  const msg =
    o.message ??
    o.Message ??
    o.errorMessage ??
    o.error_description ??
    o.error;
  const codeStr = typeof code === "number" || typeof code === "string" ? String(code) : "";
  const msgStr = typeof msg === "string" ? msg : "";
  if (codeStr && msgStr) return `${codeStr}: ${msgStr}`.slice(0, 240);
  if (msgStr) return msgStr.slice(0, 240);
  if (codeStr) return codeStr;
  try {
    return JSON.stringify(body).slice(0, 240);
  } catch {
    return null;
  }
}
