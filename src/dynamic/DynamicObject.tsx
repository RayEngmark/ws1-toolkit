import { DYNAMIC_ACTIONS, objectFor } from "./objects";
import { useUIStore } from "../state/uiStore";
import styles from "./DynamicObject.module.css";

/**
 * Object view: list of action cards available for the picked object.
 * Click an action → drill into Action view (which renders the existing module).
 */
export function DynamicObject({ objectKey }: { objectKey: string }) {
  const setNav = useUIStore((s) => s.setDynamicNav);
  const obj = objectFor(objectKey);
  const actions = DYNAMIC_ACTIONS[objectKey] ?? [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{obj?.label}</h1>
        <p className={styles.subtitle}>{obj?.blurb}</p>
      </header>

      <div className={styles.actionList}>
        {actions.map((a, i) => (
          <button
            key={a.key}
            className={styles.actionCard}
            onClick={() =>
              setNav({
                level: "action",
                objectKey: objectKey,
                actionKey: a.key,
              })
            }
          >
            <span className={styles.actionIndex}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className={styles.actionBody}>
              <span className={styles.actionLabel}>{a.label}</span>
              <span className={styles.actionBlurb}>{a.blurb}</span>
            </div>
            <span className={styles.actionArrow}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
