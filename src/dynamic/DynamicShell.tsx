import { useUIStore } from "../state/uiStore";
import { DynamicHome } from "./DynamicHome";
import { DynamicObject } from "./DynamicObject";
import { DynamicAction } from "./DynamicAction";
import styles from "./DynamicShell.module.css";

/**
 * Top-level container for Dynamic mode. Routes to Home, Object, or Action view
 * based on the dynamicNav stack in the UI store.
 */
export function DynamicShell() {
  const nav = useUIStore((s) => s.dynamicNav);

  return (
    <div className={styles.shell}>
      <DynamicCrumbs />
      <div className={styles.viewport}>
        {nav.level === "home" && <DynamicHome />}
        {nav.level === "object" && nav.objectKey && (
          <DynamicObject objectKey={nav.objectKey} />
        )}
        {nav.level === "action" && nav.objectKey && nav.actionKey && (
          <DynamicAction
            objectKey={nav.objectKey}
            actionKey={nav.actionKey}
          />
        )}
      </div>
    </div>
  );
}

function DynamicCrumbs() {
  const nav = useUIStore((s) => s.dynamicNav);
  const setNav = useUIStore((s) => s.setDynamicNav);

  if (nav.level === "home") return null;

  return (
    <div className={styles.crumbs}>
      <button
        className={styles.crumb}
        onClick={() => setNav({ level: "home" })}
      >
        Home
      </button>
      <span className={styles.sep}>›</span>
      {nav.level === "action" && nav.objectKey ? (
        <>
          <button
            className={styles.crumb}
            onClick={() =>
              setNav({ level: "object", objectKey: nav.objectKey })
            }
          >
            {nav.objectKey}
          </button>
          <span className={styles.sep}>›</span>
          <span className={styles.crumbActive}>{nav.actionKey}</span>
        </>
      ) : (
        <span className={styles.crumbActive}>{nav.objectKey}</span>
      )}
    </div>
  );
}
