import { useEffect, useState } from "react";
import { TargetPicker } from "../../components/TargetPicker/TargetPicker";
import * as api from "../../ipc/client";
import type { Device, SmartGroup } from "../../ipc/contracts";
import shared from "../_shared/ActionPage.module.css";
import styles from "./LookupSmartGroup.module.css";

export function LookupSmartGroup() {
  const [sgs, setSgs] = useState<SmartGroup[]>([]);
  const [sgId, setSgId] = useState<number | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const loadSgs = async () => {
    if (sgs.length > 0) return;
    setSgs(await api.searchSmartGroups());
  };

  useEffect(() => {
    loadSgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sgId === null) {
      setDevices([]);
      return;
    }
    setLoadingDevices(true);
    api
      .getSmartGroupDevices(sgId)
      .then(setDevices)
      .finally(() => setLoadingDevices(false));
  }, [sgId]);

  const selected = sgs.find((s) => s.id === sgId);

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Look up smart group</h1>
        <p className={shared.subtitle}>
          Find a smart group, see its size, criteria type, owning OG, and
          full device list.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack}>
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

          {selected && (
            <div className={styles.detailPanel}>
              <div className={styles.headerRow}>
                <div>
                  <div className={styles.name}>{selected.name}</div>
                  <div className={styles.sub}>
                    Owned by {selected.managedByOgName}
                  </div>
                </div>
                <div className={styles.criteria}>{selected.criteriaType}</div>
              </div>

              <div className={styles.statGrid}>
                <Stat label="Devices" value={selected.deviceCount} />
                <Stat label="Apps assigned" value={selected.appCount} />
                <Stat label="Profiles assigned" value={selected.profileCount} />
              </div>

              <div className={styles.deviceList}>
                <div className={styles.deviceListHeader}>
                  <span>Member devices</span>
                  <span className={styles.deviceListCount}>
                    {loadingDevices ? "loading…" : `showing ${devices.length}`}
                  </span>
                </div>
                {devices.length === 0 && !loadingDevices ? (
                  <div className={styles.empty}>No devices to display</div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Device</th>
                        <th>Serial</th>
                        <th>Platform</th>
                        <th>OG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map((d) => (
                        <tr key={d.id}>
                          <td>{d.userName}</td>
                          <td>{d.friendlyName}</td>
                          <td className={styles.mono}>{d.serialNumber}</td>
                          <td>{d.platform}</td>
                          <td className={styles.dim}>{d.ogName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value.toLocaleString()}</div>
    </div>
  );
}
