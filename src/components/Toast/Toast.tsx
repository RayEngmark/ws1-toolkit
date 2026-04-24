import { useUIStore } from "../../state/uiStore";
import styles from "./Toast.module.css";

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          <span className={styles.message}>{t.message}</span>
          <button className={styles.close} onClick={() => dismiss(t.id)}>
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
