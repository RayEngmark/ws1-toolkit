import { useEffect, useRef, useState } from "react";
import * as api from "../../ipc/client";
import type { Device, OrgGroup, SmartGroup } from "../../ipc/contracts";
import { detectType, resolveLines } from "../../lib/resolver";
import {
  ChevronDown,
  ChevronRight,
  SearchIcon,
  XIcon,
} from "../../lib/icons";
import shared from "../_shared/ActionPage.module.css";
import styles from "./LookupDevice.module.css";

type Mode = "search" | "browse-sg" | "browse-og";

export function LookupDevice() {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Device | null>(null);

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
        const result = await resolveLines([query.trim()]);
        const devices: Device[] = [];
        for (const row of result.rows) {
          if (row.status === "resolved" && row.device) devices.push(row.device);
          else if (row.status === "ambiguous" && row.candidates) {
            devices.push(...row.candidates);
          }
        }
        setResults(devices);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [mode, query]);

  // Load reference data when entering browse modes
  useEffect(() => {
    if (mode === "browse-sg" && sgs.length === 0) {
      api.searchSmartGroups().then(setSgs);
    }
    if (mode === "browse-og" && ogTree.length === 0) {
      api.searchOrgGroups().then((tree) => {
        setOgTree(tree);
        setOgExpanded(new Set(tree.map((g) => g.id)));
      });
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickSg = async (id: number) => {
    setLoading(true);
    setResults([]);
    try {
      const devs = await api.getSmartGroupDevices(id);
      setResults(devs);
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

      <div className={shared.body}>
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
                    placeholder="serial, username, UUID, MAC, IMEI, asset tag…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      className={styles.clearBtn}
                      onClick={() => setQuery("")}
                    >
                      <XIcon size={10} />
                    </button>
                  )}
                </div>
                {query && (
                  <span className={styles.detectedHint}>
                    detected as {labelFor(detectType(query))}
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
                  results.map((d) => (
                    <button
                      key={d.id}
                      className={`${styles.resultRow} ${picked?.id === d.id ? styles.resultPicked : ""}`}
                      onClick={() => setPicked(d)}
                    >
                      <span className={styles.resultName}>
                        {d.friendlyName || d.serialNumber}
                      </span>
                      <span className={styles.resultMeta}>
                        {d.userName} · {d.platform}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right column: detail panel */}
          <div className={styles.rightCol}>
            {picked ? <DeviceDetail device={picked} /> : <DetailPlaceholder />}
          </div>
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

function DeviceDetail({ device }: { device: Device }) {
  const compliant = device.complianceStatus === "Compliant";
  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <div>
          <div className={styles.detailName}>
            {device.friendlyName || device.serialNumber}
          </div>
          <div className={styles.detailSub}>
            {device.userName} · {device.model}
          </div>
        </div>
        <span
          className={`${styles.compStatus} ${compliant ? styles.compOk : styles.compBad}`}
        >
          <span className={styles.dot} />
          {device.complianceStatus}
        </span>
      </div>

      <div className={styles.detailGrid}>
        <DetailRow label="Serial" value={device.serialNumber} mono />
        <DetailRow label="UUID" value={device.udid || device.uuid} mono />
        {device.imei && <DetailRow label="IMEI" value={device.imei} mono />}
        {device.macAddress && (
          <DetailRow label="MAC" value={device.macAddress} mono />
        )}
        {device.assetNumber && (
          <DetailRow label="Asset" value={device.assetNumber} mono />
        )}
        <DetailRow label="OS" value={device.os} />
        <DetailRow label="Platform" value={device.platform} />
        <DetailRow label="OG" value={device.ogName} />
        <DetailRow label="Ownership" value={device.ownership} />
        <DetailRow label="Enrolled" value={device.enrollmentStatus} />
        <DetailRow
          label="Last seen"
          value={new Date(device.lastSeen).toLocaleString()}
        />
      </div>
    </div>
  );
}

function DetailPlaceholder() {
  return (
    <div className={styles.detailEmpty}>
      <span className={styles.detailEmptyText}>
        click a result on the left to see details
      </span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={`${styles.rowValue} ${mono ? styles.rowMono : ""}`}>
        {value || "—"}
      </span>
    </div>
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
