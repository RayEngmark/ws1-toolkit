import { useEffect, useState } from "react";
import * as api from "../../ipc/client";
import type { OrgGroup } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import { useScopeStore } from "../../state/scopeStore";
import { ChevronDown, ChevronRight } from "../../lib/icons";
import { Drawer } from "./Drawer";
import styles from "./ScopePickerDrawer.module.css";

/**
 * Drawer for picking the active OG scope. Loads the tenant's OG tree on
 * mount, expands the current branch, and writes the selection through to
 * scopeStore (which persists it to localStorage). All scoped IPC calls
 * (`searchDevices`, `getTags`, etc.) read from scopeStore on each call.
 */
export function ScopePickerDrawer() {
  const close = useUIStore((s) => s.closeDrawer);
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const setScope = useScopeStore((s) => s.setScope);
  const [tree, setTree] = useState<OrgGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    api
      .searchOrgGroups()
      .then((t) => {
        if (cancelled) return;
        setTree(t);
        // Expand the path from the root to the active OG so it's visible.
        if (activeOgId !== null) {
          const ancestors = findAncestors(t, activeOgId);
          setExpanded(new Set([...ancestors, ...t.map((r) => r.id)]));
        } else {
          setExpanded(new Set(t.map((r) => r.id)));
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "load failed");
      });
    return () => {
      cancelled = true;
    };
  }, [activeOgId]);

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pick = (og: OrgGroup) => {
    setScope({ id: og.id, name: og.name });
    close();
  };

  return (
    <Drawer title="Active OG scope">
      <p className={styles.hint}>
        All device, tag, and group queries scope to the selected OG and its
        descendants. Pick the tenant root for an unfiltered view.
      </p>
      {error && <div className={styles.error}>{error}</div>}
      {!tree && !error && <div className={styles.muted}>loading…</div>}
      {tree && (
        <div className={styles.tree}>
          {tree.map((g) => (
            <ScopeNode
              key={g.id}
              node={g}
              depth={0}
              expanded={expanded}
              onToggle={toggle}
              onPick={pick}
              activeOgId={activeOgId}
            />
          ))}
        </div>
      )}
    </Drawer>
  );
}

function ScopeNode({
  node,
  depth,
  expanded,
  onToggle,
  onPick,
  activeOgId,
}: {
  node: OrgGroup;
  depth: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onPick: (og: OrgGroup) => void;
  activeOgId: number | null;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const isActive = node.id === activeOgId;
  return (
    <>
      <div
        className={`${styles.row} ${isActive ? styles.active : ""}`}
        style={{ paddingLeft: 4 + depth * 14 }}
        onClick={() => onPick(node)}
      >
        <button
          className={styles.chev}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />
          ) : null}
        </button>
        <span className={styles.label}>{node.name}</span>
      </div>
      {isExpanded &&
        node.children.map((c) => (
          <ScopeNode
            key={c.id}
            node={c}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onPick={onPick}
            activeOgId={activeOgId}
          />
        ))}
    </>
  );
}

function findAncestors(tree: OrgGroup[], target: number): number[] {
  const path: number[] = [];
  const walk = (nodes: OrgGroup[], trail: number[]): boolean => {
    for (const n of nodes) {
      if (n.id === target) {
        path.push(...trail);
        return true;
      }
      if (walk(n.children, [...trail, n.id])) return true;
    }
    return false;
  };
  walk(tree, []);
  return path;
}
