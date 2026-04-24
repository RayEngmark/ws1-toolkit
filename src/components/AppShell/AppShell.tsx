import { useUIStore } from "../../state/uiStore";
import { Sidebar } from "../Sidebar/Sidebar";
import { ToastContainer } from "../Toast/Toast";
import { Settings } from "../../modules/Settings/Settings";
import { DeviceSearch } from "../../modules/DeviceSearch/DeviceSearch";
import { Tagger } from "../../modules/Tagger/Tagger";
import { OGMover } from "../../modules/OGMover/OGMover";
import styles from "./AppShell.module.css";

const MODULE_MAP = {
  settings: Settings,
  devices: DeviceSearch,
  tagger: Tagger,
  ogmover: OGMover,
} as const;

export function AppShell() {
  const activeModule = useUIStore((s) => s.activeModule);
  const ActiveComponent = MODULE_MAP[activeModule];

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <ActiveComponent />
      </main>
      <ToastContainer />
    </div>
  );
}
