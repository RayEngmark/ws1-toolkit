import { useEffect, useState } from "react";
import { DevicePicker } from "../../components/DevicePicker/DevicePicker";
import { TargetPicker } from "../../components/TargetPicker/TargetPicker";
import * as api from "../../ipc/client";
import type { BulkActionResult, Device, OrgGroup } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
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
  const [devices, setDevices] = useState<Device[]>([]);
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
  const ready = devices.length > 0 && ogId !== null;

  // Cross-OG warning: how many devices are already in the target OG?
  const alreadyInTarget = selectedOg
    ? devices.filter((d) => d.ogId === ogId).length
    : 0;
  const willMove = devices.length - alreadyInTarget;

  const apply = async () => {
    if (!ogId || devices.length === 0) return;
    setBusy(true);
    setLastResult(null);
    try {
      const ids = devices.filter((d) => d.ogId !== ogId).map((d) => d.id);
      const result = await api.bulkMoveDevices(ids, ogId);
      setLastResult({ og: selectedOg?.fullPath ?? "", result });
      if (result.accepted > 0) {
        addToast(
          `Moved ${result.accepted} device(s) to ${selectedOg?.name}`,
          "success"
        );
      }
      if (result.failed > 0) addToast(`${result.failed} device(s) failed`, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Move devices to organization group</h1>
        <p className={shared.subtitle}>
          Reassign devices to a different organization group. Profile and policy
          assignments will follow the target OG&apos;s configuration.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack}>
          <DevicePicker resolved={devices} onChange={setDevices} />

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

          {ready && alreadyInTarget > 0 && (
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

      <footer className={shared.footer}>
        <span className={shared.footerInfo}>
          {ready ? (
            <>
              <span className={shared.footerCount}>{willMove}</span>
              <span>device(s) will move to</span>
              <strong style={{ color: "var(--fg-0)" }}>{selectedOg?.name}</strong>
            </>
          ) : (
            <span style={{ color: "var(--fg-3)" }}>
              Paste devices and pick a target OG
            </span>
          )}
        </span>
        <span className={shared.footerSpacer} />
        <button
          className={shared.btnPrimary}
          onClick={apply}
          disabled={!ready || busy || willMove === 0}
        >
          {busy ? "Moving…" : `Move ${willMove} device(s)`}
        </button>
      </footer>
    </div>
  );
}
