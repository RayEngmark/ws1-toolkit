import { useEffect, type ReactNode } from "react";
import { useUIStore } from "../../state/uiStore";
import { XIcon } from "../../lib/icons";
import styles from "./Drawer.module.css";

/**
 * Right-side slide-over drawer. Shown only while uiStore.drawer is set.
 * Closes via Escape or the X button. Escape doesn't fire while a child
 * input is focused-and-modified — the operator can use Escape to dismiss
 * the drawer while a confirmation is mid-flight.
 *
 * Layout: header (title + close) / body (scroll) / footer (action buttons).
 */
export function Drawer({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const close = useUIStore((s) => s.closeDrawer);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <>
      <div className={styles.scrim} onClick={close} />
      <aside className={styles.drawer} role="dialog" aria-label={title}>
        <header className={styles.head}>
          <span className={styles.title}>{title}</span>
          <button
            className={styles.closeBtn}
            onClick={close}
            type="button"
            aria-label="Close"
          >
            <XIcon size={12} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </aside>
    </>
  );
}
