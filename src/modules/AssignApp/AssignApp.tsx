import { useEffect, useState } from "react";
import { TargetPicker } from "../../components/TargetPicker/TargetPicker";
import * as api from "../../ipc/client";
import type { App, AppPushMode, BulkActionResult, SmartGroup } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import shared from "../_shared/ActionPage.module.css";
import styles from "./AssignApp.module.css";

export function AssignApp() {
  const [apps, setApps] = useState<App[]>([]);
  const [appId, setAppId] = useState<number | null>(null);
  const [sgs, setSgs] = useState<SmartGroup[]>([]);
  const [sgId, setSgId] = useState<number | null>(null);
  const [pushMode, setPushMode] = useState<AppPushMode>("Auto");
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<{ app: string; sg: string; result: BulkActionResult } | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const loadApps = async () => {
    if (apps.length > 0) return;
    setApps(await api.getApps());
  };
  const loadSgs = async () => {
    if (sgs.length > 0) return;
    setSgs(await api.searchSmartGroups());
  };

  useEffect(() => {
    loadApps();
    loadSgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedApp = apps.find((a) => a.id === appId);
  const selectedSg = sgs.find((s) => s.id === sgId);
  const ready = appId !== null && sgId !== null;

  const apply = async () => {
    if (!appId || !sgId) return;
    setBusy(true);
    setLastResult(null);
    try {
      const result = await api.assignAppToSmartGroup(appId, [sgId], pushMode);
      setLastResult({
        app: selectedApp?.name ?? "",
        sg: selectedSg?.name ?? "",
        result,
      });
      if (result.accepted > 0) {
        addToast(
          `Assigned "${selectedApp?.name}" to "${selectedSg?.name}"`,
          "success"
        );
      }
      if (result.failed > 0) addToast(`Assignment failed`, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Assign app to smart group</h1>
        <p className={shared.subtitle}>
          Push an existing app to all devices in a smart group. WS1&apos;s API
          targets smart groups for app assignments — pick one, set the push mode,
          and go.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack}>
          <TargetPicker
            label="App"
            emptyHint="Pick an app…"
            items={apps.map((a) => ({
              id: a.id,
              primary: a.name,
              secondary: a.bundleId,
              platform: a.platform,
              meta: `${a.appType} · v${a.version}`,
            }))}
            selectedId={appId}
            onSelect={setAppId}
            onLoad={loadApps}
          />

          <TargetPicker
            label="Smart Group"
            emptyHint="Pick destination smart group…"
            items={sgs.map((s) => ({
              id: s.id,
              primary: s.name,
              secondary: s.managedByOgName,
              meta: `${s.deviceCount} devices`,
            }))}
            selectedId={sgId}
            onSelect={setSgId}
            onLoad={loadSgs}
          />

          <div className={styles.pushModePanel}>
            <div className={styles.pushModeHeader}>Push Mode</div>
            <div className={styles.pushModeBody}>
              <button
                className={`${styles.modeBtn} ${pushMode === "Auto" ? styles.modeActive : ""}`}
                onClick={() => setPushMode("Auto")}
              >
                <div className={styles.modeName}>Auto</div>
                <div className={styles.modeDesc}>
                  Force-install on all devices in the smart group as soon as
                  they check in.
                </div>
              </button>
              <button
                className={`${styles.modeBtn} ${pushMode === "OnDemand" ? styles.modeActive : ""}`}
                onClick={() => setPushMode("OnDemand")}
              >
                <div className={styles.modeName}>On-Demand</div>
                <div className={styles.modeDesc}>
                  Make the app available in the Hub catalog for users to
                  install themselves.
                </div>
              </button>
            </div>
          </div>

          {selectedApp && selectedSg && selectedApp.platform &&
            selectedSg.criteriaType === "All" && (
              <div className={shared.result} style={{ borderLeftColor: "var(--warning)" }}>
                <div className={shared.resultRow}>
                  <span className={shared.resultLabel}>Heads up</span>
                  <span className={shared.resultValue}>
                    Smart group has &quot;All&quot; criteria — only{" "}
                    {selectedApp.platform} devices in it will get this app.
                  </span>
                </div>
              </div>
            )}

          {lastResult && (
            <div
              className={`${shared.result} ${lastResult.result.failed > 0 ? shared.resultErr : ""}`}
            >
              <div className={shared.resultRow}>
                <span className={shared.resultLabel}>Last run</span>
                <span className={shared.resultValue}>
                  &quot;{lastResult.app}&quot; → &quot;{lastResult.sg}&quot; ·{" "}
                  {lastResult.result.accepted > 0 ? "Assigned" : "Failed"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className={shared.footer}>
        <span className={shared.footerInfo}>
          {ready ? (
            <>
              <strong style={{ color: "var(--fg-0)" }}>{selectedApp?.name}</strong>
              <span>→</span>
              <strong style={{ color: "var(--fg-0)" }}>{selectedSg?.name}</strong>
              <span style={{ color: "var(--fg-2)" }}>· {pushMode}</span>
            </>
          ) : (
            <span style={{ color: "var(--fg-3)" }}>
              Pick an app and a smart group
            </span>
          )}
        </span>
        <span className={shared.footerSpacer} />
        <button
          className={shared.btnPrimary}
          onClick={apply}
          disabled={!ready || busy}
        >
          {busy ? "Assigning…" : `Assign app`}
        </button>
      </footer>
    </div>
  );
}
