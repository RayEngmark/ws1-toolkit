import { useEffect, useState } from "react";
import { DeviceShuttle } from "../../components/DeviceShuttle/DeviceShuttle";
import { TargetPicker } from "../../components/TargetPicker/TargetPicker";
import * as api from "../../ipc/client";
import type { BulkActionResult, SmartGroup } from "../../ipc/contracts";
import { useSelectionStore } from "../../state/selectionStore";
import { useUIStore } from "../../state/uiStore";
import { useScopeStore } from "../../state/scopeStore";
import { useEntryContext } from "../../dynamic/entryContext";
import { FooterSlot } from "../../components/AppShell/FooterSlot";
import shared from "../_shared/ActionPage.module.css";

export function AddToSmartGroup() {
  const ctx = useEntryContext();
  const sgFirst = ctx?.objectKey === "smartgroups";
  const selection = useSelectionStore((s) => s.devices);
  const clearSelection = useSelectionStore((s) => s.clear);
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [sgs, setSgs] = useState<SmartGroup[]>([]);
  const [sgId, setSgId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<{ sg: string; result: BulkActionResult } | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const loadSgs = async () => {
    setSgs(await api.searchSmartGroups(activeOgId));
  };

  useEffect(() => {
    loadSgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOgId]);

  const selected = sgs.find((s) => s.id === sgId);
  const ready = selection.length > 0 && sgId !== null;

  const apply = async () => {
    if (!sgId || selection.length === 0) return;
    setBusy(true);
    setLastResult(null);
    try {
      const result = await api.addDevicesToSmartGroup(
        sgId,
        selection.map((d) => d.id)
      );
      setLastResult({ sg: selected?.name ?? "", result });
      if (result.accepted > 0) {
        addToast(
          `Added ${result.accepted} device(s) to "${selected?.name}"`,
          "success"
        );
      }
      if (result.failed > 0) {
        const detail = result.errors[0] ? ` — ${result.errors[0]}` : "";
        addToast(`${result.failed} device(s) failed${detail}`, "error");
      }
      if (result.failed === 0 && result.accepted > 0) clearSelection();
    } catch (e) {
      addToast(
        `Add to smart group failed: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Add devices to smart group</h1>
        <p className={shared.subtitle}>
          Add specific devices to a smart group&apos;s manual additions list.
          Useful when you want to include devices that don&apos;t match the
          group&apos;s criteria.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack}>
          {sgFirst ? (
            <>
              <TargetPicker
                label="Smart Group"
                emptyHint="Pick a smart group…"
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
              {sgId !== null && <DeviceShuttle />}
            </>
          ) : (
            <>
              <DeviceShuttle />
              {selection.length > 0 && (
                <TargetPicker
                  label="Smart Group"
                  emptyHint="Pick a smart group…"
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
              )}
            </>
          )}

          {lastResult && (
            <div
              className={`${shared.result} ${lastResult.result.failed > 0 ? shared.resultErr : ""}`}
            >
              <div className={shared.resultRow}>
                <span className={shared.resultLabel}>Last run</span>
                <span className={shared.resultValue}>
                  Added to &quot;{lastResult.sg}&quot; · {lastResult.result.accepted}{" "}
                  accepted, {lastResult.result.failed} failed
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <FooterSlot className={shared.footer}>
        <span className={shared.footerInfo}>
          {ready ? (
            <>
              <span className={shared.footerCount}>{selection.length}</span>
              <span>device(s) →</span>
              <strong style={{ color: "var(--fg-0)" }}>{selected?.name}</strong>
            </>
          ) : (
            <span style={{ color: "var(--fg-3)" }}>
              {selection.length === 0
                ? "Add devices to the selection"
                : "Pick a smart group"}
            </span>
          )}
        </span>
        <span className={shared.footerSpacer} />
        <button
          className={shared.btnPrimary}
          onClick={apply}
          disabled={!ready || busy}
        >
          {busy ? "Adding…" : "Add to smart group"}
        </button>
      </FooterSlot>
    </div>
  );
}
