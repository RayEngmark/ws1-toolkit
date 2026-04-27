import { useEffect, useState } from "react";
import * as api from "../../ipc/client";
import type { App } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import { NounPage } from "../../components/NounPage/NounPage";
import { FooterButton } from "../../components/NounPage/FooterButton";
import { DetailGrid } from "../../components/DetailGrid/DetailGrid";
import styles from "./Apps.module.css";

export function Apps() {
  const [items, setItems] = useState<App[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openDrawer = useUIStore((s) => s.openDrawer);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    api
      .getApps()
      .then((a) => {
        if (!cancelled) setItems(a);
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
      title="Apps"
      subtitle="Internal apps in your tenant. Read-only — actions land in the next phase."
      items={items}
      loadError={error}
      filterPlaceholder="filter by name, bundle id, or platform…"
      itemKey={(a) => a.id}
      itemMatch={(a, q) => {
        const ql = q.toLowerCase();
        return (
          a.name.toLowerCase().includes(ql) ||
          a.bundleId.toLowerCase().includes(ql) ||
          a.platform.toLowerCase().includes(ql)
        );
      }}
      renderRow={(a) => (
        <>
          <span className={styles.rowName}>{a.name}</span>
          <span className={styles.rowMeta}>
            {a.platform} · {a.version}
          </span>
        </>
      )}
      renderDetail={(a) => (
        <DetailGrid
          title={a.name}
          sub={`ID ${a.id} · ${a.appType}`}
          rows={[
            { label: "ID", value: a.id, mono: true },
            { label: "Name", value: a.name },
            { label: "Bundle ID", value: a.bundleId, mono: true },
            { label: "Version", value: a.version, mono: true },
            { label: "Platform", value: a.platform },
            { label: "Type", value: a.appType },
            { label: "OG", value: a.ogName },
          ]}
          raw={a}
        />
      )}
      renderFooter={(a) => (
        <FooterButton
          label="Assign to smart group"
          onClick={() => openDrawer("assign-app", { appId: a.id })}
        />
      )}
    />
  );
}
