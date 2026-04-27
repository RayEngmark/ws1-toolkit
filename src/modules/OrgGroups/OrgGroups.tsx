import { useEffect, useMemo, useState } from "react";
import * as api from "../../ipc/client";
import type { OrgGroup } from "../../ipc/contracts";
import { NounPage } from "../../components/NounPage/NounPage";
import { DetailGrid } from "../../components/DetailGrid/DetailGrid";
import styles from "./OrgGroups.module.css";

/**
 * The /api/system/groups/search endpoint returns a flat list on this tenant
 * (the spec confirms LocationGroup has no Children field). We flatten what
 * comes back and let the user filter — children navigation can come later.
 */
function flattenTree(roots: OrgGroup[]): OrgGroup[] {
  const out: OrgGroup[] = [];
  const walk = (og: OrgGroup) => {
    out.push(og);
    og.children.forEach(walk);
  };
  roots.forEach(walk);
  return out;
}

export function OrgGroups() {
  const [tree, setTree] = useState<OrgGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTree(null);
    setError(null);
    api
      .searchOrgGroups()
      .then((t) => {
        if (!cancelled) setTree(t);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => (tree ? flattenTree(tree) : null), [tree]);

  return (
    <NounPage
      title="Org Groups"
      subtitle="Browse the organization-group hierarchy. Read-only — actions land in the next phase."
      items={items}
      loadError={error}
      filterPlaceholder="filter by name or GroupID…"
      itemKey={(og) => og.id}
      itemMatch={(og, q) => {
        const ql = q.toLowerCase();
        return (
          og.name.toLowerCase().includes(ql) ||
          og.groupId.toLowerCase().includes(ql)
        );
      }}
      renderRow={(og) => (
        <>
          <span className={styles.rowName}>{og.name}</span>
          <span className={styles.rowMeta}>
            {og.groupId} · {og.ogType}
          </span>
        </>
      )}
      renderDetail={(og) => (
        <DetailGrid
          title={og.name}
          sub={`GroupID ${og.groupId}`}
          rows={[
            { label: "ID", value: og.id, mono: true },
            { label: "Name", value: og.name },
            { label: "Group ID", value: og.groupId, mono: true },
            { label: "Type", value: og.ogType },
            {
              label: "Parent ID",
              value: og.parentId ?? undefined,
              mono: true,
            },
            { label: "Children", value: og.children.length, mono: true },
          ]}
          raw={og}
        />
      )}
    />
  );
}
