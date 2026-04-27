import { useEffect, useState } from "react";
import * as api from "../../ipc/client";
import type { OrgGroup, Tag } from "../../ipc/contracts";
import { NounPage } from "../../components/NounPage/NounPage";
import { DetailGrid } from "../../components/DetailGrid/DetailGrid";
import styles from "./Tags.module.css";

/**
 * Tags are scoped to an OG. We default to the tenant root OG (the topmost
 * node returned by /groups/search) and expose a small selector to jump
 * between OGs. The list refreshes on OG change.
 */
export function Tags() {
  const [ogTree, setOgTree] = useState<OrgGroup[] | null>(null);
  const [ogId, setOgId] = useState<number | null>(null);
  const [items, setItems] = useState<Tag[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load OG list on mount, default to the first root.
  useEffect(() => {
    let cancelled = false;
    api.searchOrgGroups().then((tree) => {
      if (cancelled) return;
      setOgTree(tree);
      if (tree.length > 0) setOgId(tree[0].id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
