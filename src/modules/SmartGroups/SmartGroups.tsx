import { useEffect, useState } from "react";
import * as api from "../../ipc/client";
import type { SmartGroup } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import { useScopeStore } from "../../state/scopeStore";
import { NounPage } from "../../components/NounPage/NounPage";
import { FooterButton } from "../../components/NounPage/FooterButton";
import { DetailGrid } from "../../components/DetailGrid/DetailGrid";
import styles from "./SmartGroups.module.css";

export function SmartGroups() {
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [items, setItems] = useState<SmartGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openDrawer = useUIStore((s) => s.openDrawer);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    api
      .searchSmartGroups(activeOgId)
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
  }, [activeOgId]);

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
      renderFooter={(sg) => (
        <>
          <FooterButton
            label="Add devices"
            onClick={() => openDrawer("add-to-sg", { smartGroupId: sg.id })}
          />
          <FooterButton
            label="Remove devices"
            onClick={() =>
              openDrawer("remove-from-sg", { smartGroupId: sg.id })
            }
          />
          <FooterButton
            label="Assign app"
            onClick={() => openDrawer("assign-app", { smartGroupId: sg.id })}
          />
        </>
      )}
    />
  );
}
