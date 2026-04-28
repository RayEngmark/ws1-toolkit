import { useEffect, useRef, useState } from "react";
import * as api from "../../ipc/client";
import type { Device, OrgGroup, SmartGroup } from "../../ipc/contracts";
import {
  detectType,
  resolveLines,
  type SearchOverride,
} from "../../lib/resolver";
import {
  ChevronDown,
  ChevronRight,
  SearchIcon,
  XIcon,
} from "../../lib/icons";
import shared from "../_shared/ActionPage.module.css";
import styles from "./LookupDevice.module.css";
import { DeviceDetail, DetailPlaceholder } from "./DeviceDetail";
import { useUIStore } from "../../state/uiStore";
import { useScopeStore } from "../../state/scopeStore";

type Mode = "search" | "browse-sg" | "browse-og";

export function LookupDevice() {
  const addToast = useUIStore((s) => s.addToast);
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Device | null>(null);
  const [compareB, setCompareB] = useState<Device | null>(null);
  /** When true, the next device picked from the left list becomes B. */
  const [pickingCompareB, setPickingCompareB] = useState(false);
  const [override, setOverride] = useState<SearchOverride>(
    () =>
      (typeof window !== "undefined" &&
        (localStorage.getItem("search-override") as SearchOverride)) ||
      "auto"
  );

  useEffect(() => {
    localStorage.setItem("search-override", override);
  }, [override]);

  // Browse state
  const [sgs, setSgs] = useState<SmartGroup[]>([]);
  const [ogTree, setOgTree] = useState<OrgGroup[]>([]);
  const [ogExpanded, setOgExpanded] = useState<Set<number>>(new Set());

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search debounce
  useEffect(() => {
    if (mode !== "search") return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await resolveLines([query.trim()], override);
        const devices: Device[] = [];
        for (const row of result.rows) {
          if (row.status === "resolved" && row.device) devices.push(row.device);
          else if (row.status === "ambiguous" && row.candidates) {
            devices.push(...row.candidates);
          }
        }
        setResults(devices);
      } catch (e) {
        setResults([]);
        addToast(`Search failed: ${e instanceof Error ? e.message : String(e)}`, "error");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [mode, query, override]);

  // Load reference data when entering browse modes; refetch when scope changes.
  useEffect(() => {
    if (mode === "browse-sg") {
      api
        .searchSmartGroups(activeOgId)
        .then(setSgs)
        .catch((e) =>
          addToast(
            `Smart group list failed: ${e instanceof Error ? e.message : String(e)}`,
            "error"
          )
        );
    }
    if (mode === "browse-og" && ogTree.length === 0) {
      // OG tree is global — fetched once. Browsing devices in a specific OG
      // is then a per-pick fetch via getDevicesInOg.
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
  }, [mode, activeOgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickSg = async (id: number) => {
    setLoading(true);
    setResults([]);
    try {
      const devs = await api.getSmartGroupDevices(id);
      setResults(devs);
    } catch (e) {
      addToast(
        `Failed to load smart group devices: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const pickOg = async (id: number) => {
    setLoading(true);
    setResults([]);
    try {
      const devs = await api.getDevicesInOg(id);
      setResults(devs);
    } catch (e) {
      addToast(
        `Failed to load OG devices: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Look up devices</h1>
        <p className={shared.subtitle}>
          Search any identifier — serial, username, UUID, MAC, IMEI, asset tag —
          or browse by smart group or organization group. Read-only.
        </p>
      </header>

      <div className={styles.lookup}>
        {/* Left column: search + browse */}
          <div className={styles.leftCol}>
            <div className={styles.modeTabs}>
              <ModeTab
                label="Search"
                active={mode === "search"}
                onClick={() => setMode("search")}
              />
              <ModeTab
                label="Smart Group"
                active={mode === "browse-sg"}
                onClick={() => setMode("browse-sg")}
              />
              <ModeTab
                label="OG"
                active={mode === "browse-og"}
                onClick={() => setMode("browse-og")}
              />
            </div>

            {mode === "search" && (
              <div className={styles.searchControls}>
                <div className={styles.searchBox}>
                  <SearchIcon size={12} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="serial, username, UUID, MAC, IMEI…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <select
                    className={styles.overrideSelect}
                    value={override}
                    onChange={(e) =>
                      setOverride(e.target.value as SearchOverride)
                    }
                    title="Constrain lookup to one identifier type"
                  >
                    <option value="auto">Auto</option>
                    <option value="serial">Serial</option>
                    <option value="friendlyName">Name</option>
                    <option value="username">User</option>
                    <option value="imei">IMEI</option>
                    <option value="macAddress">MAC</option>
                    <option value="uuid">UUID</option>
                    <option value="easid">EAS ID</option>
                    <option value="deviceid">Device ID</option>
                  </select>
                  {query && (
                    <button
                      className={styles.clearBtn}
                      onClick={() => setQuery("")}
                    >
                      <XIcon size={10} />
                    </button>
                  )}
                </div>
                {query && override === "auto" && (
                  <span className={styles.detectedHint}>
                    looks like {labelFor(detectType(query))} — searching all
                    types
                  </span>
                )}
              </div>
            )}

            {mode === "browse-sg" && (
              <div className={styles.browsePanel}>
                {sgs.map((sg) => (
                  <button
                    key={sg.id}
                    className={styles.browseRow}
                    onClick={() => pickSg(sg.id)}
                  >
                    <span className={styles.browseLabel}>{sg.name}</span>
                    <span className={styles.browseMeta}>
                      {sg.deviceCount}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {mode === "browse-og" && (
              <div className={styles.browsePanel}>
                {ogTree.map((g) => (
                  <OgNode
                    key={g.id}
                    node={g}
                    depth={0}
                    expanded={ogExpanded}
                    onToggle={(id) =>
                      setOgExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })
                    }
                    onPick={pickOg}
                  />
                ))}
              </div>
            )}

            {/* Results list (shared across all modes) */}
            <div className={styles.results}>
              <div className={styles.resultsHeader}>
                <span>Results</span>
                <span className={styles.resultsCount}>
                  {loading ? "loading…" : `${results.length}`}
                </span>
              </div>
              <div className={styles.resultsList}>
                {results.length === 0 ? (
                  <div className={styles.empty}>
                    {mode === "search"
                      ? query.trim()
                        ? "no matches"
                        : "type to search"
                      : "pick something on the left"}
                  </div>
                ) : (
                  results.map((d) => {
                    const isPicked = picked?.id === d.id;
                    const isCompareB = compareB?.id === d.id;
                    return (
                      <button
                        key={d.id}
                        className={`${styles.resultRow} ${isPicked ? styles.resultPicked : ""} ${isCompareB ? styles.resultCompareB : ""}`}
                        onClick={() => {
                          if (pickingCompareB && d.id !== picked?.id) {
                            setCompareB(d);
                            setPickingCompareB(false);
                          } else {
                            setPicked(d);
                          }
                        }}
                      >
                        <span className={styles.resultName}>
                          {d.friendlyName || d.serialNumber}
                          {isPicked && (
                            <span className={styles.resultBadge}>A</span>
                          )}
                          {isCompareB && (
                            <span className={styles.resultBadge}>B</span>
                          )}
                        </span>
                        <span className={styles.resultMeta}>
                          {d.userName} · {d.platform}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        {/* Right column: detail panel (or two-pane compare) */}
        <div className={styles.rightCol}>
          {pickingCompareB && picked && !compareB && (
            <div className={styles.compareHint}>
              Click another device on the left to compare with{" "}
              <b>{picked.friendlyName || picked.serialNumber}</b>
              <button
                className={styles.compareCancel}
                onClick={() => setPickingCompareB(false)}
              >
                cancel
              </button>
            </div>
          )}
          {picked && compareB ? (
            <div className={styles.compareGrid}>
              <div className={styles.compareCol}>
                <div className={styles.compareLabel}>A</div>
                <DeviceDetail device={picked} />
              </div>
              <div className={styles.compareCol}>
                <div className={styles.compareLabel}>
                  B
                  <button
                    className={styles.compareCancel}
                    onClick={() => {
                      setCompareB(null);
                      setPickingCompareB(false);
                    }}
                  >
                    exit compare
                  </button>
                </div>
                <DeviceDetail device={compareB} />
              </div>
            </div>
          ) : picked ? (
            <DeviceDetail
              device={picked}
              onCompareStart={() => {
                setCompareB(null);
                setPickingCompareB(true);
              }}
            />
          ) : (
            <DetailPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}

function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.modeTab} ${active ? styles.modeTabActive : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function OgNode({
  node,
  depth,
  expanded,
  onToggle,
  onPick,
}: {
  node: OrgGroup;
  depth: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onPick: (id: number) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  return (
    <>
      <div
        className={styles.browseRow}
        style={{ paddingLeft: 4 + depth * 14 }}
        onClick={() => onPick(node.id)}
      >
        <button
          className={styles.ogChev}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={10} />
            ) : (
              <ChevronRight size={10} />
            )
          ) : null}
        </button>
        <span className={styles.browseLabel}>{node.name}</span>
      </div>
      {isExpanded &&
        node.children.map((c) => (
          <OgNode
            key={c.id}
            node={c}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onPick={onPick}
          />
        ))}
    </>
  );
}

function labelFor(t: ReturnType<typeof detectType>): string {
  switch (t) {
    case "serial":
      return "serial";
    case "username":
      return "username";
    case "uuid":
      return "UUID";
    case "imei":
      return "IMEI";
    case "macAddress":
      return "MAC";
    case "assetTag":
      return "asset tag";
    case "friendlyName":
      return "device name";
    default:
      return "unknown";
  }
}
