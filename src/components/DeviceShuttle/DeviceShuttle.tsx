import { useEffect, useMemo, useRef, useState } from "react";
import * as api from "../../ipc/client";
import type { Device, OrgGroup, SmartGroup } from "../../ipc/contracts";
import { resolveLines } from "../../lib/resolver";
import { useSelectionStore } from "../../state/selectionStore";
import { useUIStore } from "../../state/uiStore";
import {
  ChevronDown,
  ChevronRight,
  SearchIcon,
  XIcon,
} from "../../lib/icons";
import styles from "./DeviceShuttle.module.css";

type Source = "search" | "smartgroup" | "og";

/**
 * Modern device picker — replaces the legacy dual-pane shuttle.
 *
 * Layout (top to bottom):
 *   1. Header with selection count + clear all
 *   2. Selected chips (only shown when there's a selection)
 *   3. Source tabs (Search / Smart Group / OG) + a context input per source
 *   4. Results list — click a row to toggle into the selection
 *
 * No arrows, no two-column checkboxes, no second pane.
 */
export function DeviceShuttle() {
  const addToast = useUIStore((s) => s.addToast);
  const [source, setSource] = useState<Source>("search");

  // Pool (results)
  const [pool, setPool] = useState<Device[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);

  // Source-specific state
  const [searchQuery, setSearchQuery] = useState("");
  const [sgs, setSgs] = useState<SmartGroup[]>([]);
  const [sgId, setSgId] = useState<number | null>(null);
  const [ogTree, setOgTree] = useState<OrgGroup[]>([]);
  const [ogPickedId, setOgPickedId] = useState<number | null>(null);
  const [ogExpanded, setOgExpanded] = useState<Set<number>>(new Set());

  // Selection (global)
  const selection = useSelectionStore((s) => s.devices);
  const selectionAdd = useSelectionStore((s) => s.add);
  const selectionRemove = useSelectionStore((s) => s.remove);
  const selectionClear = useSelectionStore((s) => s.clear);
  const selectedIds = useMemo(
    () => new Set(selection.map((d) => d.id)),
    [selection]
  );

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search mode: lookup via the resolver heuristics
  useEffect(() => {
    if (source !== "search") return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setPool([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setPoolLoading(true);
      try {
        const result = await resolveLines([searchQuery.trim()]);
        const devices: Device[] = [];
        for (const row of result.rows) {
          if (row.status === "resolved" && row.device) devices.push(row.device);
          else if (row.status === "ambiguous" && row.candidates) {
            devices.push(...row.candidates);
          }
        }
        setPool(devices);
      } catch (e) {
        setPool([]);
        addToast(`Search failed: ${e instanceof Error ? e.message : String(e)}`, "error");
      } finally {
        setPoolLoading(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [source, searchQuery]);

  // Smart Group mode
  useEffect(() => {
    if (source !== "smartgroup") return;
    if (sgs.length === 0) {
      api
        .searchSmartGroups()
        .then(setSgs)
        .catch((e) =>
          addToast(
            `Smart group list failed: ${e instanceof Error ? e.message : String(e)}`,
            "error"
          )
        );
    }
    if (sgId !== null) {
      setPoolLoading(true);
      api
        .getSmartGroupDevices(sgId)
        .then((devs) => {
          setPool(devs);
          setPoolLoading(false);
        })
        .catch((e) => {
          setPool([]);
          setPoolLoading(false);
          addToast(
            `Failed to load smart group devices: ${e instanceof Error ? e.message : String(e)}`,
            "error"
          );
        });
    } else {
      setPool([]);
    }
  }, [source, sgId]); // eslint-disable-line react-hooks/exhaustive-deps

  // OG mode
  useEffect(() => {
    if (source !== "og") return;
    if (ogTree.length === 0) {
      api
        .searchOrgGroups()
        .then((tree) => {
          setOgTree(tree);
          setOgExpanded(new Set(tree.map((g) => g.id)));
        })
        .catch((e) =>
          addToast(
            `Org group list failed: ${e instanceof Error ? e.message : String(e)}`,
            "error"
          )
        );
    }
    if (ogPickedId !== null) {
      setPoolLoading(true);
      api
        .getDevicesInOg(ogPickedId)
        .then((devs) => {
          setPool(devs);
          setPoolLoading(false);
        })
        .catch((e) => {
          setPool([]);
          setPoolLoading(false);
          addToast(
            `Failed to load OG devices: ${e instanceof Error ? e.message : String(e)}`,
            "error"
          );
        });
    } else {
      setPool([]);
    }
  }, [source, ogPickedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (d: Device) => {
    if (selectedIds.has(d.id)) selectionRemove(d.id);
    else selectionAdd([d]);
  };

  const addAll = () => {
    const toAdd = pool.filter((d) => !selectedIds.has(d.id));
    if (toAdd.length > 0) selectionAdd(toAdd);
  };

  return (
    <div className={styles.picker}>
      {/* Header */}
      <header className={styles.head}>
        <span className={styles.headTitle}>Devices</span>
        <span className={styles.headSpacer} />
        <span className={styles.headCount}>
          {selection.length === 0
            ? "none selected"
            : `${selection.length} selected`}
        </span>
        {selection.length > 0 && (
          <button
            className={styles.clearAllBtn}
            onClick={selectionClear}
            title="Clear all selected"
          >
            clear all
          </button>
        )}
      </header>

      {/* Selected chips */}
      {selection.length > 0 && (
        <div className={styles.chipRow}>
          {selection.map((d) => (
            <button
              key={d.id}
              className={styles.chip}
              onClick={() => selectionRemove(d.id)}
              title={`Remove ${d.friendlyName || d.serialNumber}`}
            >
              <span className={styles.chipName}>
                {d.friendlyName || d.serialNumber}
              </span>
              <span className={styles.chipX}>
                <XIcon size={10} />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Source row */}
      <div className={styles.sourceRow}>
        <div className={styles.sourceTabs}>
          {(["search", "smartgroup", "og"] as const).map((s) => (
            <button
              key={s}
              className={`${styles.sourceTab} ${source === s ? styles.sourceTabActive : ""}`}
              onClick={() => setSource(s)}
            >
              {s === "search" ? "Search" : s === "smartgroup" ? "Smart Group" : "OG"}
            </button>
          ))}
        </div>

        {source === "search" && (
          <div className={styles.searchBox}>
            <SearchIcon size={12} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="serial, username, UUID, MAC, IMEI, asset tag…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            {searchQuery && (
              <button
                className={styles.clearBtn}
                onClick={() => setSearchQuery("")}
              >
                <XIcon size={10} />
              </button>
            )}
          </div>
        )}

        {source === "smartgroup" && (
          <select
            className={styles.select}
            value={sgId ?? ""}
            onChange={(e) =>
              setSgId(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Pick a smart group…</option>
            {sgs.map((sg) => (
              <option key={sg.id} value={sg.id}>
                {sg.name} ({sg.deviceCount})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* OG tree only shown when source === "og" */}
      {source === "og" && (
        <div className={styles.ogTree}>
          {ogTree.map((g) => (
            <OgNode
              key={g.id}
              node={g}
              depth={0}
              expanded={ogExpanded}
              pickedId={ogPickedId}
              onToggleExpand={(id) =>
                setOgExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onPick={setOgPickedId}
            />
          ))}
        </div>
      )}

      {/* Results list */}
      <div className={styles.results}>
        {poolLoading ? (
          <div className={styles.empty}>loading…</div>
        ) : pool.length === 0 ? (
          <div className={styles.empty}>
            {emptyHintFor(source, searchQuery, sgId, ogPickedId)}
          </div>
        ) : (
          <>
            {pool.length > 1 && (
              <div className={styles.resultsHeader}>
                <span>
                  {pool.length} {pool.length === 1 ? "result" : "results"}
                </span>
                <button className={styles.addAllBtn} onClick={addAll}>
                  add all
                </button>
              </div>
            )}
            {pool.map((d) => {
              const isSelected = selectedIds.has(d.id);
              return (
                <button
                  key={d.id}
                  className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}
                  onClick={() => toggle(d)}
                >
                  <span className={styles.rowMark}>
                    {isSelected ? "✓" : "+"}
                  </span>
                  <div className={styles.rowMain}>
                    <span className={styles.rowName}>
                      {d.friendlyName || d.serialNumber}
                    </span>
                    <span className={styles.rowMeta}>
                      {d.userName || "—"} · {d.serialNumber}
                    </span>
                  </div>
                  <span className={styles.rowOg}>{d.ogName}</span>
                  <span className={styles.rowPlatform}>{d.platform}</span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function OgNode({
  node,
  depth,
  expanded,
  pickedId,
  onToggleExpand,
  onPick,
}: {
  node: OrgGroup;
  depth: number;
  expanded: Set<number>;
  pickedId: number | null;
  onToggleExpand: (id: number) => void;
  onPick: (id: number) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const isPicked = pickedId === node.id;
  const hasChildren = node.children.length > 0;
  return (
    <>
      <div
        className={`${styles.ogNode} ${isPicked ? styles.ogNodePicked : ""}`}
        style={{ paddingLeft: 6 + depth * 14 }}
        onClick={() => onPick(node.id)}
      >
        <button
          className={styles.ogChev}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />
          ) : null}
        </button>
        <span className={styles.ogName}>{node.name}</span>
      </div>
      {isExpanded &&
        node.children.map((c) => (
          <OgNode
            key={c.id}
            node={c}
            depth={depth + 1}
            expanded={expanded}
            pickedId={pickedId}
            onToggleExpand={onToggleExpand}
            onPick={onPick}
          />
        ))}
    </>
  );
}

function emptyHintFor(
  source: Source,
  searchQuery: string,
  sgId: number | null,
  ogId: number | null
): string {
  if (source === "search") {
    return searchQuery.trim()
      ? "no matches"
      : "type to search by serial, username, UUID, MAC, IMEI, or asset tag";
  }
  if (source === "smartgroup") {
    return sgId === null
      ? "pick a smart group above"
      : "this smart group has no devices";
  }
  return ogId === null
    ? "click an organization group to load its devices"
    : "no devices in this OG or its children";
}
