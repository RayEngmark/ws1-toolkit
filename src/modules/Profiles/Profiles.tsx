import { useEffect, useState } from "react";
import * as api from "../../ipc/client";
import type { Profile } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import { useScopeStore } from "../../state/scopeStore";
import { NounPage } from "../../components/NounPage/NounPage";
import { FooterButton } from "../../components/NounPage/FooterButton";
import { DetailGrid } from "../../components/DetailGrid/DetailGrid";
import styles from "./Profiles.module.css";

export function Profiles() {
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [items, setItems] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openDrawer = useUIStore((s) => s.openDrawer);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    api
      .getProfiles(activeOgId)
      .then((p) => {
        if (!cancelled) setItems(p);
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
      title="Profiles"
      subtitle="Configuration profiles in your tenant. Read-only — actions land in the next phase."
      items={items}
      loadError={error}
      filterPlaceholder="filter by name, platform, or type…"
      itemKey={(p) => p.id}
      itemMatch={(p, q) => {
        const ql = q.toLowerCase();
        return (
          p.name.toLowerCase().includes(ql) ||
          p.platform.toLowerCase().includes(ql) ||
          p.profileType.toLowerCase().includes(ql)
        );
      }}
      renderRow={(p) => (
        <>
          <span className={styles.rowName}>{p.name}</span>
          <span className={styles.rowMeta}>
            {p.platform} · {p.profileType}
          </span>
        </>
      )}
      renderDetail={(p) => (
        <DetailGrid
          title={p.name}
          sub={`ID ${p.id} · ${p.platform}`}
          rows={[
            { label: "ID", value: p.id, mono: true },
            { label: "Name", value: p.name },
            { label: "Description", value: p.description },
            { label: "Platform", value: p.platform },
            { label: "Type", value: p.profileType },
            { label: "OG", value: p.ogName },
          ]}
          raw={p}
        />
      )}
      renderFooter={(p) => (
        <>
          <FooterButton
            label="Assign to Smart Group"
            onClick={() =>
              openDrawer("assign-profile-to-sg", {
                profileId: p.id,
                profileName: p.name,
              })
            }
          />
          <FooterButton
            label="Force-sync on devices"
            onClick={() =>
              openDrawer("assign-profile", {
                profileId: p.id,
                profileName: p.name,
              })
            }
            title="Push the profile to specific devices that already belong to one of its assigned Smart Groups. Use this for ad-hoc resyncs — devices that aren't already entitled won't accept the install."
          />
        </>
      )}
    />
  );
}
