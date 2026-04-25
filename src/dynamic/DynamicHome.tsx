import { DYNAMIC_OBJECTS } from "./objects";
import { useUIStore } from "../state/uiStore";
import styles from "./DynamicHome.module.css";

/**
 * Home: object tile grid. Click → drill into Object view.
 * Same dense VS Code aesthetic as the rest of the app — no decoration.
 */
export function DynamicHome() {
  const setNav = useUIStore((s) => s.setDynamicNav);

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <h1 className={styles.title}>What do you want to work with?</h1>
        <p className={styles.subtitle}>
          Pick an object — Devices, Smart Groups, etc. — to see what you can do
          with it.
        </p>
      </header>

      <div className={styles.tileGrid}>
        {DYNAMIC_OBJECTS.map((obj) => (
          <button
            key={obj.key}
            className={styles.tile}
            onClick={() =>
              setNav({ level: "object", objectKey: obj.key })
            }
          >
            <span className={styles.tileLabel}>{obj.label}</span>
            <span className={styles.tileBlurb}>{obj.blurb}</span>
            <span className={styles.tileChev}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
