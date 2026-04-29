import { useEffect, useRef, useState } from "react";
import { Webview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useUIStore } from "../../state/uiStore";
import styles from "./RemoteSession.module.css";

/**
 * Hosts a child Tauri Webview pointed at a Workspace ONE Assist session URL.
 * The webview is a separate browser context attached to the main window —
 * not an iframe — so X-Frame-Options on the Assist response doesn't block
 * it the way an in-React iframe would.
 *
 * Layout: a thin header strip with the session label + close button, then
 * a placeholder div whose bounds the child webview is tracked to.
 */
export function RemoteSession() {
  const url = useUIStore((s) => s.remoteSessionUrl);
  const label = useUIStore((s) => s.remoteSessionLabel);
  const endSession = useUIStore((s) => s.endRemoteSession);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const webviewRef = useRef<Webview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let windowResizeListener: (() => void) | null = null;

    const create = async () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      try {
        // Unique label per session — Tauri rejects duplicate labels even
        // after a previous webview was closed within the same window.
        const wvLabel = `assist-${Date.now()}`;
        const wv = new Webview(getCurrentWindow(), wvLabel, {
          url,
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.max(1, Math.round(rect.width)),
          height: Math.max(1, Math.round(rect.height)),
        });
        await wv.once("tauri://created", () => {});
        if (disposed) {
          await wv.close().catch(() => {});
          return;
        }
        webviewRef.current = wv;

        const sync = async () => {
          const c = containerRef.current;
          if (!c || !webviewRef.current) return;
          const r = c.getBoundingClientRect();
          await webviewRef.current
            .setPosition(new LogicalPosition(Math.round(r.left), Math.round(r.top)))
            .catch(() => {});
          await webviewRef.current
            .setSize(
              new LogicalSize(
                Math.max(1, Math.round(r.width)),
                Math.max(1, Math.round(r.height))
              )
            )
            .catch(() => {});
        };

        // Force-sync once on creation — the constructor's raw numeric bounds
        // can be interpreted as physical pixels on some platforms; the
        // setPosition/setSize wrappers always use Logical units. Without
        // this, on a high-DPI display the Webview lands half-size or
        // off-screen and the operator sees only the gray viewport.
        await sync();

        // The child Webview floats above React — when the surrounding layout
        // shifts (sidebar resize, window resize, status bar reflow) the
        // webview must be repositioned manually or it will visibly lag.
        resizeObserver = new ResizeObserver(() => {
          void sync();
        });
        resizeObserver.observe(container);
        windowResizeListener = () => {
          void sync();
        };
        window.addEventListener("resize", windowResizeListener);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };

    void create();

    return () => {
      disposed = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (windowResizeListener)
        window.removeEventListener("resize", windowResizeListener);
      const wv = webviewRef.current;
      webviewRef.current = null;
      if (wv) void wv.close().catch(() => {});
    };
  }, [url]);

  if (!url) {
    return (
      <div className={styles.empty}>
        <span>No active remote session.</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.title}>
          <span className={styles.titleLabel}>Remote session</span>
          {label && <span className={styles.titleDevice}>{label}</span>}
          <span className={styles.titleUrl} title={url}>
            {url}
          </span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.fallback}
            onClick={() => {
              void openUrl(url);
            }}
            type="button"
            title="Open the session URL in your default browser instead"
          >
            Open in browser
          </button>
          <button className={styles.close} onClick={endSession} type="button">
            End session
          </button>
        </div>
      </header>
      <div className={styles.viewport} ref={containerRef}>
        {error && (
          <div className={styles.error}>
            Failed to attach session webview: {error}
          </div>
        )}
      </div>
    </div>
  );
}
