import { useEffect, useState } from "react";
import { DeviceShuttle } from "../../components/DeviceShuttle/DeviceShuttle";
import { TargetPicker } from "../../components/TargetPicker/TargetPicker";
import * as api from "../../ipc/client";
import type { BulkActionResult, OrgGroup } from "../../ipc/contracts";
import { useSelectionStore } from "../../state/selectionStore";
import { useUIStore } from "../../state/uiStore";
import { useEntryContext } from "../../dynamic/entryContext";
import { FooterSlot } from "../../components/AppShell/FooterSlot";
import shared from "../_shared/ActionPage.module.css";

interface FlatOG {
  id: number;
  name: string;
  fullPath: string;
  type: string;
}

function flattenOGs(groups: OrgGroup[], prefix = ""): FlatOG[] {
  const result: FlatOG[] = [];
  for (const g of groups) {
    const path = prefix ? `${prefix} / ${g.name}` : g.name;
    result.push({ id: g.id, name: g.name, fullPath: path, type: g.ogType });
    if (g.children.length > 0) {
      result.push(...flattenOGs(g.children, path));
    }
  }
  return result;
}

export function MoveDevices() {
  const ctx = useEntryContext();
  const ogFirst = ctx?.objectKey === "ogs";
  const selection = useSelectionStore((s) => s.devices);
  const clearSelection = useSelectionStore((s) => s.clear);
  const [ogs, setOgs] = useState<FlatOG[]>([]);
  const [ogId, setOgId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<{ og: string; result: BulkActionResult } | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const loadOgs = async () => {
    if (ogs.length > 0) return;
    const tree = await api.searchOrgGroups();
    setOgs(flattenOGs(tree));
  };

  useEffect(() => {
    loadOgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOg = ogs.find((o) => o.id === ogId);
  const alreadyInTarget = selectedOg
    ? selection.filter((d) => d.ogId === ogId).length
    : 0;
  const willMove = selection.length - alreadyInTarget;
  const ready = selection.length > 0 && ogId !== null && willMove > 0;

  const apply = async () => {
    if (!ogId || selection.length === 0) return;
    setBusy(true);
    setLastResult(null);
    try {
      const ids = selection.filter((d) => d.ogId !== ogId).map((d) => d.id);
      const result = await api.bulkMoveDevices(ids, ogId);
      setLastResult({ og: selectedOg?.fullPath ?? "", result });
      if (result.accepted > 0) {
        addToast(
          `Moved ${result.accepted} device(s) to ${selectedOg?.name}`,
          "success"
        );
      }
      if (result.failed > 0) {
        const detail = result.errors[0] ? ` — ${result.errors[0]}` : "";
        addToast(`${result.failed} device(s) failed${detail}`, "error");
      }
      // Clear selection on full success — stale selections after an action are confusing
      if (result.failed === 0 && result.accepted > 0) clearSelection();
    } catch (e) {
      addToast(
        `Move failed: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Move devices to organization group</h1>
        <p className={shared.subtitle}>
          Move the selected devices to a different OG. Profile and policy
          assignments will follow the target OG&apos;s configuration.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack}>
          {ogFirst ? (
            <>
              <TargetPicker
                label="Target organization group"
                emptyHint="Pick destination OG…"
                items={ogs.map((o) => ({
                  id: o.id,
                  primary: o.name,
                  secondary: o.fullPath,
                  meta: o.type,
                }))}
                selectedId={ogId}
                onSelect={setOgId}
                onLoad={loadOgs}
              />
              {ogId !== null && <DeviceShuttle />}
            </>
          ) : (
            <>
              <DeviceShuttle />
              {selection.length > 0 && (
                <TargetPicker
                  label="Target organization group"
                  emptyHint="Pick destination OG…"
                  items={ogs.map((o) => ({
                    id: o.id,
                    primary: o.name,
                    secondary: o.fullPath,
                    meta: o.type,
                  }))}
                  selectedId={ogId}
                  onSelect={setOgId}
                  onLoad={loadOgs}
                />
              )}
            </>
          )}

          {selection.length > 0 && ogId !== null && alreadyInTarget > 0 && (
            <div className={shared.result} style={{ borderLeftColor: "var(--warning)" }}>
              <div className={shared.resultRow}>
                <span className={shared.resultLabel}>Heads up</span>
                <span className={shared.resultValue}>
                  {alreadyInTarget} device(s) are already in this OG and will be skipped
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
                  Moved to {lastResult.og} · {lastResult.result.accepted}{" "}
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
              <span className={shared.footerCount}>{willMove}</span>
              <span>device(s) will move to</span>
              <strong style={{ color: "var(--fg-0)" }}>{selectedOg?.name}</strong>
            </>
          ) : (
            <span style={{ color: "var(--fg-3)" }}>
              {selection.length === 0
                ? "Add devices to the selection"
                : ogId === null
                ? "Pick a target OG"
                : "All selected devices are already in this OG"}
            </span>
          )}
        </span>
        <span className={shared.footerSpacer} />
        <button
          className={shared.btnPrimary}
          onClick={apply}
          disabled={!ready || busy}
        >
          {busy ? "Moving…" : `Move ${willMove} device(s)`}
        </button>
      </FooterSlot>
    </div>
  );
}
