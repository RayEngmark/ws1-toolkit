import { useEffect, useRef, useState } from "react";
import { Webview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useUIStore } from "../../state/uiStore";
import styles from "./RemoteSession.module.css";

/**
 * Floating overlay that hosts a child Tauri Webview pointed at a Workspace
 * ONE Assist session URL. The session is intentionally NOT a route — making
 * it an overlay above the active route preserves underlying state when the
 * operator ends the session, and a Minimize button hides the overlay
 * (suspending the Webview, not destroying it) so the operator can pop into
 * Devices/Profiles/etc. and resume from the status-bar pill.
 *
 * Lifecycle: the Webview is created when `remoteSession.url` becomes set
 * and destroyed only when the session ends. Minimize/restore call hide()
 * and show() so the page state survives.
 */
export function RemoteSessionOverlay() {
  const session = useUIStore((s) => s.remoteSession);
  const endSession = useUIStore((s) => s.endRemoteSession);
  const minimizeSession = useUIStore((s) => s.minimizeRemoteSession);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const webviewRef = useRef<Webview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track the URL the current Webview was created for. If the operator
  // ends a session and starts a new one, we tear the old one down before
  // spawning the next.
  const activeUrlRef = useRef<string | null>(null);

  // Create / destroy the Webview based on whether a session URL is set.
  useEffect(() => {
    const url = session?.url ?? null;
    if (activeUrlRef.current === url) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let windowResizeListener: (() => void) | null = null;

    // Tear down any existing Webview before swapping in a new session.
    const oldWv = webviewRef.current;
    webviewRef.current = null;
    if (oldWv) void oldWv.close().catch(() => {});

    activeUrlRef.current = url;
    setError(null);
    if (!url) return;

    const create = async () => {
      // Wait one frame so the overlay container has laid out — without
      // this, getBoundingClientRect can return zeroes on first render.
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const container = containerRef.current;
      if (!container || disposed) return;
      const rect = container.getBoundingClientRect();
      try {
        const wvLabel = `assist-${Date.now()}`;
        const wv = new Webview(getCurrentWindow(), wvLabel, {
          url,
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.max(1, Math.round(rect.width)),
          height: Math.max(1, Math.round(rect.height)),
          // WebView2's default UA includes a `WebView2/...` marker that
          // some Workspace ONE Assist relays sniff and refuse to serve;
          // a clean Edge UA gets the same response as a system-browser
          // navigation.
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
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

        await sync();

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
  }, [session?.url]);

  // Show / hide the Webview as the overlay is minimized / restored. Hiding
  // (rather than destroying) keeps the Assist session alive in the
  // background.
  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv || !session) return;
    if (session.minimized) {
      void wv.hide().catch(() => {});
    } else {
      void wv.show().catch(() => {});
    }
  }, [session?.minimized, session]);

  // When the overlay re-mounts (e.g. after restore), the container may
  // have new bounds — re-sync once.
  useEffect(() => {
    if (!session || session.minimized) return;
    const wv = webviewRef.current;
    if (!wv) return;
    const sync = async () => {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const c = containerRef.current;
      if (!c) return;
      const r = c.getBoundingClientRect();
      await wv
        .setPosition(new LogicalPosition(Math.round(r.left), Math.round(r.top)))
        .catch(() => {});
      await wv
        .setSize(
          new LogicalSize(
            Math.max(1, Math.round(r.width)),
            Math.max(1, Math.round(r.height))
          )
        )
        .catch(() => {});
    };
    void sync();
  }, [session?.minimized, session]);

  if (!session || session.minimized) return null;

  return (
    <div className={styles.overlay}>
      <header className={styles.head}>
        <div className={styles.title}>
          <span className={styles.titleLabel}>Remote session</span>
          {session.label && (
            <span className={styles.titleDevice}>{session.label}</span>
          )}
          <span className={styles.titleUrl} title={session.url}>
            {session.url}
          </span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.fallback}
            onClick={() => {
              void openUrl(session.url);
            }}
            type="button"
            title="Open the session URL in your default browser"
          >
            Open in browser
          </button>
          <button
            className={styles.minimize}
            onClick={minimizeSession}
            type="button"
            title="Hide overlay; the session keeps running"
          >
            Minimize
          </button>
          <button
            className={styles.close}
            onClick={endSession}
            type="button"
            title="Destroy the session"
          >
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
