import { useEffect, useState } from "react";
import * as api from "../../ipc/client";
import type { SmartGroup } from "../../ipc/contracts";
import { NounPage } from "../../components/NounPage/NounPage";
import { DetailGrid } from "../../components/DetailGrid/DetailGrid";
import styles from "./SmartGroups.module.css";

export function SmartGroups() {
  const [items, setItems] = useState<SmartGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    api
      .searchSmartGroups()
      .then((sgs) => {
        if (!cancelled) setItems(sgs);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NounPage
      title="Smart Groups"
      subtitle="Browse the smart groups in your tenant. Read-only — actions land in the next phase."
      items={items}
      loadError={error}
      filterPlaceholder="filter by name or OG…"
      itemKey={(sg) => sg.id}
      itemMatch={(sg, q) =>
        sg.name.toLowerCase().includes(q.toLowerCase()) ||
        sg.managedByOgName.toLowerCase().includes(q.toLowerCase())
      }
      renderRow={(sg) => (
        <>
          <span className={styles.rowName}>{sg.name}</span>
          <span className={styles.rowMeta}>
            {sg.deviceCount} devices · {sg.managedByOgName}
          </span>
        </>
      )}
      renderDetail={(sg) => (
        <DetailGrid
          title={sg.name}
          sub={`ID ${sg.id} · ${sg.criteriaType || "—"}`}
          rows={[
            { label: "ID", value: sg.id, mono: true },
            { label: "Name", value: sg.name },
            { label: "Criteria", value: sg.criteriaType },
            { label: "OG", value: sg.managedByOgName },
            { label: "OG ID", value: sg.managedByOgId, mono: true },
            { label: "Devices", value: sg.deviceCount, mono: true },
            { label: "Assignments", value: sg.appCount, mono: true },
            { label: "Profiles", value: sg.profileCount, mono: true },
          ]}
          raw={sg}
        />
      )}
    />
  );
}
