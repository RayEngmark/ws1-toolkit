import { useEffect, useState } from "react";
import * as api from "../../ipc/client";
import type { OrgGroup, Tag } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import { useScopeStore } from "../../state/scopeStore";
import { NounPage } from "../../components/NounPage/NounPage";
import { FooterButton } from "../../components/NounPage/FooterButton";
import { DetailGrid } from "../../components/DetailGrid/DetailGrid";
import styles from "./Tags.module.css";

/**
 * Tags are scoped to an OG. The page seeds from the global active OG
 * (`scopeStore`) but keeps a local override so the operator can browse
 * tags in a different OG without changing the global scope.
 */
export function Tags() {
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [ogTree, setOgTree] = useState<OrgGroup[] | null>(null);
  const [ogId, setOgId] = useState<number | null>(activeOgId);
  const [items, setItems] = useState<Tag[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openDrawer = useUIStore((s) => s.openDrawer);

  // Load OG list once. If we don't yet have an OG, seed from the active
  // scope (preferred) or the first root as a final fallback.
  useEffect(() => {
    let cancelled = false;
    api.searchOrgGroups().then((tree) => {
      if (cancelled) return;
      setOgTree(tree);
      if (ogId === null && tree.length > 0) {
        setOgId(activeOgId ?? tree[0].id);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the global scope changes, snap the page to the new OG.
  useEffect(() => {
    if (activeOgId !== null) setOgId(activeOgId);
  }, [activeOgId]);

  // Reload tags when the OG changes.
  useEffect(() => {
    if (ogId === null) return;
    let cancelled = false;
    setItems(null);
    setError(null);
    api
      .getTags(ogId)
      .then((tags) => {
        if (!cancelled) setItems(tags);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "load failed");
      });
    return () => {
      cancelled = true;
    };
  }, [ogId]);

  const flatOgs = ogTree ? flatten(ogTree) : [];

  return (
    <NounPage
      title="Tags"
      subtitle="Tags scoped to the selected organization group. Read-only — actions land in the next phase."
      items={items}
      loadError={error}
      filterPlaceholder="filter by name…"
      itemKey={(t) => t.id}
      itemMatch={(t, q) =>
        t.tagName.toLowerCase().includes(q.toLowerCase())
      }
      renderRow={(t) => (
        <>
          <span className={styles.rowName}>{t.tagName}</span>
          <span className={styles.rowMeta}>{t.deviceCount} devices</span>
        </>
      )}
      renderDetail={(t) => (
        <DetailGrid
          title={t.tagName}
          sub={`ID ${t.id}`}
          rows={[
            { label: "ID", value: t.id, mono: true },
            { label: "Name", value: t.tagName },
            { label: "Devices", value: t.deviceCount, mono: true },
          ]}
          raw={t}
        />
      )}
      renderFooter={(t) => (
        <>
          <FooterButton
            label="Apply to devices"
            onClick={() => openDrawer("apply-tag", { tagId: t.id, mode: "add" })}
          />
          <FooterButton
            label="Remove from devices"
            onClick={() =>
              openDrawer("apply-tag", { tagId: t.id, mode: "remove" })
            }
          />
        </>
      )}
      controlsSlot={
        <div className={styles.ogSelectRow}>
          <span className={styles.ogLabel}>OG</span>
          <select
            className={styles.ogSelect}
            value={ogId ?? ""}
            onChange={(e) => setOgId(Number(e.target.value))}
            disabled={!ogTree}
          >
            {flatOgs.map((og) => (
              <option key={og.id} value={og.id}>
                {og.name} ({og.groupId})
              </option>
            ))}
          </select>
          <button
            className={styles.newTagBtn}
            onClick={() =>
              openDrawer("create-tag", { ogId: ogId ?? undefined })
            }
            type="button"
          >
            + New tag
          </button>
        </div>
      }
    />
  );
}

function flatten(roots: OrgGroup[]): OrgGroup[] {
  const out: OrgGroup[] = [];
  const walk = (og: OrgGroup) => {
    out.push(og);
    og.children.forEach(walk);
  };
  roots.forEach(walk);
  return out;
}
