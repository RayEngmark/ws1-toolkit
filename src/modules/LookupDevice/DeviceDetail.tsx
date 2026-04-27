import { useEffect, useMemo, useState } from "react";
import * as api from "../../ipc/client";
import type { Device } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import { RemoteView } from "./RemoteView";
import styles from "./DeviceDetail.module.css";

type Tab = "overview" | "troubleshoot";

export function DeviceDetail({
  device,
  onCompareStart,
}: {
  device: Device;
  /** When set, render a "Compare" button in the header that triggers it. */
  onCompareStart?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
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

      <QuickActions device={device} />

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "overview" ? styles.tabActive : ""}`}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${tab === "troubleshoot" ? styles.tabActive : ""}`}
          onClick={() => setTab("troubleshoot")}
        >
          Troubleshoot
        </button>
        {onCompareStart && (
          <button
            className={styles.compareTabBtn}
            onClick={onCompareStart}
            type="button"
          >
            Compare to…
          </button>
        )}
      </div>

      {tab === "overview" && <OverviewTab device={device} />}
      {tab === "troubleshoot" && <TroubleshootTab device={device} />}
    </div>
  );
}

export function DetailPlaceholder() {
  return (
    <div className={styles.detailEmpty}>
      <span className={styles.detailEmptyText}>
        click a result on the left to see details
      </span>
    </div>
  );
}

/* -------------------- Overview tab -------------------- */

function OverviewTab({ device }: { device: Device }) {
  const lastSeen = device.lastSeen ? new Date(device.lastSeen) : null;
  const lastSeenRel = lastSeen ? relativeTime(lastSeen) : "—";
  const lastSeenAbs = lastSeen ? lastSeen.toLocaleString() : "";

  return (
    <div className={styles.overview}>
      <div className={styles.statusBand}>
        <StatusPill
          label={device.enrollmentStatus || "Unknown"}
          tone={
            device.enrollmentStatus === "Enrolled"
              ? "ok"
              : device.enrollmentStatus
                ? "warn"
                : "muted"
          }
        />
        <StatusPill
          label={device.ownership || "—"}
          tone={device.ownership ? "neutral" : "muted"}
        />
        <span className={styles.statusInline}>{device.platform}</span>
        <span className={styles.statusDivider} />
        <span className={styles.statusInline}>{device.os}</span>
        <span className={styles.statusDivider} />
        <span className={styles.statusInline}>{device.model}</span>
      </div>

      <Section label="Identity">
        <DetailRow label="Serial" value={device.serialNumber} mono />
        <DetailRow label="UDID" value={device.udid} mono />
        <DetailRow label="UUID" value={device.uuid} mono />
        <DetailRow label="IMEI" value={device.imei} mono />
        <DetailRow label="MAC" value={device.macAddress} mono />
        <DetailRow label="Asset #" value={device.assetNumber} mono />
      </Section>

      <Section label="Assignment">
        <DetailRow label="User" value={device.userName} mono />
        <DetailRow
          label="OG"
          value={device.ogName}
          aside={device.ogId ? `id ${device.ogId}` : undefined}
        />
      </Section>

      <Section label="Timing">
        <DetailRow
          label="Last seen"
          value={lastSeenRel}
          aside={lastSeenAbs || undefined}
        />
      </Section>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>{label}</div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "neutral" | "muted";
}) {
  return <span className={`${styles.pill} ${styles[`pill_${tone}`]}`}>{label}</span>;
}

function DetailRow({
  label,
  value,
  mono,
  aside,
}: {
  label: string;
  value: string;
  mono?: boolean;
  aside?: string;
}) {
  const display = value && value.trim() ? value : "—";
  const isEmpty = display === "—";
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span
        className={`${styles.rowValue} ${mono ? styles.rowMono : ""} ${isEmpty ? styles.rowEmpty : ""}`}
      >
        {display}
        {aside && !isEmpty && (
          <span className={styles.rowAside}>{aside}</span>
        )}
      </span>
    </div>
  );
}

/** "5 min ago" / "2 hr ago" / "3 d ago" / absolute if older than 30 days. */
function relativeTime(d: Date): string {
  const now = Date.now();
  const ms = now - d.getTime();
  if (ms < 0) return d.toLocaleDateString();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} d ago`;
  return d.toLocaleDateString();
}

/* -------------------- Quick actions -------------------- */

interface QuickAction {
  label: string;
  run: (device: Device) => Promise<api.RawResponse>;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Sync",
    run: (d) =>
      api.runRawEndpoint({
        method: "POST",
        path: `/api/mdm/devices/${d.id}/commands?command=SyncDevice`,
      }),
  },
  {
    label: "Query",
    run: (d) =>
      api.runRawEndpoint({
        method: "POST",
        path: `/api/mdm/devices/${d.id}/commands?command=DeviceQuery`,
      }),
  },
  {
    label: "Lock",
    run: (d) =>
      api.runRawEndpoint({
        method: "POST",
        path: `/api/mdm/devices/${d.id}/commands?command=Lock`,
      }),
  },
  {
    label: "Find",
    run: (d) =>
      api.runRawEndpoint({
        method: "POST",
        path: `/api/mdm/devices/${d.id}/commands/finddevice`,
        // The endpoint expects a FindDevice JSON body (Platform/Message/
        // NumberOfRepetitions etc., all optional per the spec). Sending an
        // empty {} satisfies the parser; the device handles defaults.
        body: {},
      }),
  },
  {
    label: "Clear passcode",
    run: (d) =>
      api.runRawEndpoint({
        method: "POST",
        path: `/api/mdm/devices/${d.id}/commands?command=ClearPasscode`,
      }),
  },
];

function QuickActions({ device }: { device: Device }) {
  const addToast = useUIStore((s) => s.addToast);
  const [running, setRunning] = useState<string | null>(null);

  const fire = async (a: QuickAction) => {
    setRunning(a.label);
    try {
      const r = await a.run(device);
      if (r.ok) addToast(`${a.label} sent`, "success");
      else addToast(`${a.label} failed (HTTP ${r.status})`, "error");
    } catch (e) {
      addToast(
        `${a.label} failed: ${e instanceof Error ? e.message : "unknown"}`,
        "error"
      );
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className={styles.quickRow}>
      {QUICK_ACTIONS.map((a) => (
        <button
          key={a.label}
          className={styles.quickBtn}
          onClick={() => fire(a)}
          disabled={running !== null}
        >
          {running === a.label ? "…" : a.label}
        </button>
      ))}
      <RemoteView device={device} />
    </div>
  );
}

/* -------------------- Troubleshoot tab -------------------- */

interface InspectDef {
  key: string;
  label: string;
  path: (d: Device) => string;
  /** When true, fire automatically on device open. */
  eager: boolean;
  /** Format the JSON result for display. */
  render: (body: unknown) => React.ReactNode;
}

const INSPECTS: InspectDef[] = [
  {
    key: "compliance",
    label: "Compliance",
    eager: true,
    path: (d) => `/api/mdm/devices/${d.id}/compliance`,
    render: renderCompliance,
  },
  {
    key: "profiles",
    label: "Profiles",
    eager: true,
    path: (d) => `/api/mdm/devices/${d.id}/profiles`,
    render: renderProfiles,
  },
  {
    key: "apps",
    label: "Apps",
    eager: true,
    path: (d) => `/api/mdm/devices/${d.id}/apps`,
    render: renderApps,
  },
  {
    key: "network",
    label: "Network",
    eager: true,
    path: (d) => `/api/mdm/devices/${d.id}/network`,
    render: renderKVs,
  },
  {
    key: "security",
    label: "Security",
    eager: true,
    path: (d) => `/api/mdm/devices/${d.id}/security`,
    render: renderKVs,
  },
  {
    key: "certificates",
    label: "Certificates",
    eager: false,
    path: (d) => `/api/mdm/devices/${d.id}/certificates`,
    render: renderCerts,
  },
  {
    key: "eventlog",
    label: "Event log",
    eager: false,
    path: (d) => `/api/mdm/devices/${d.id}/eventlog`,
    render: renderEventLog,
  },
];

interface InspectState {
  loading: boolean;
  error?: string;
  body?: unknown;
}

function TroubleshootTab({ device }: { device: Device }) {
  const [states, setStates] = useState<Record<string, InspectState>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Reset when the picked device changes
  useEffect(() => {
    setStates({});
    setOpen({});
  }, [device.id]);

  const load = async (key: string) => {
    const def = INSPECTS.find((i) => i.key === key);
    if (!def) return;
    setStates((p) => ({ ...p, [key]: { loading: true } }));
    try {
      const r = await api.runRawEndpoint({
        method: "GET",
        path: def.path(device),
      });
      setStates((p) => ({
        ...p,
        [key]: r.ok
          ? { loading: false, body: r.body }
          : { loading: false, error: `HTTP ${r.status}` },
      }));
    } catch (e) {
      setStates((p) => ({
        ...p,
        [key]: {
          loading: false,
          error: e instanceof Error ? e.message : "request failed",
        },
      }));
    }
  };

  // Eager-prefetch on device open
  useEffect(() => {
    for (const def of INSPECTS) {
      if (def.eager) load(def.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.id]);

  const toggle = (key: string) => {
    setOpen((p) => ({ ...p, [key]: !p[key] }));
    if (!states[key]) load(key);
  };

  return (
    <div className={styles.troubleshoot}>
      <div className={styles.tsGroup}>
        <div className={styles.tsGroupLabel}>Inspect</div>
        {INSPECTS.map((def) => {
          const st = states[def.key];
          const isOpen = open[def.key];
          return (
            <InspectRow
              key={def.key}
              def={def}
              state={st}
              open={!!isOpen}
              onToggle={() => toggle(def.key)}
            />
          );
        })}
      </div>

      <div className={styles.tsGroup}>
        <div className={styles.tsGroupLabel}>Decommission</div>
        <ArmedButton
          label="Enterprise wipe"
          help="Removes corporate apps, profiles, and data. Preserves user data."
          run={() =>
            api.runRawEndpoint({
              method: "POST",
              path: `/api/mdm/devices/${device.id}/commands?command=EnterpriseWipe`,
            })
          }
        />
        <ArmedButton
          label="Device wipe"
          help="Full factory reset. All data lost."
          run={() =>
            api.runRawEndpoint({
              method: "POST",
              path: `/api/mdm/devices/${device.id}/commands?command=DeviceWipe`,
            })
          }
        />
      </div>
    </div>
  );
}

function InspectRow({
  def,
  state,
  open,
  onToggle,
}: {
  def: InspectDef;
  state?: InspectState;
  open: boolean;
  onToggle: () => void;
}) {
  const summary = state
    ? state.loading
      ? "loading…"
      : state.error
        ? state.error
        : "ready"
    : "click to load";

  return (
    <div className={styles.inspect}>
      <button className={styles.inspectHead} onClick={onToggle}>
        <span className={styles.inspectChev}>{open ? "▾" : "▸"}</span>
        <span className={styles.inspectLabel}>{def.label}</span>
        <span className={styles.inspectSummary}>{summary}</span>
      </button>
      {open && state && !state.loading && !state.error && (
        <div className={styles.inspectBody}>{def.render(state.body)}</div>
      )}
      {open && state?.error && (
        <div className={styles.inspectError}>{state.error}</div>
      )}
    </div>
  );
}

function ArmedButton({
  label,
  help,
  run,
}: {
  label: string;
  help: string;
  run: () => Promise<api.RawResponse>;
}) {
  const addToast = useUIStore((s) => s.addToast);
  const [armed, setArmed] = useState(false);
  const [running, setRunning] = useState(false);

  const fire = async () => {
    setRunning(true);
    try {
      const r = await run();
      if (r.ok) addToast(`${label} sent`, "success");
      else addToast(`${label} failed (HTTP ${r.status})`, "error");
    } catch (e) {
      addToast(
        `${label} failed: ${e instanceof Error ? e.message : "unknown"}`,
        "error"
      );
    } finally {
      setRunning(false);
      setArmed(false);
    }
  };

  return (
    <div className={styles.armed}>
      <div className={styles.armedHelp}>{help}</div>
      {!armed ? (
        <button
          className={styles.armedBtn}
          onClick={() => setArmed(true)}
          disabled={running}
        >
          Arm {label}…
        </button>
      ) : (
        <div className={styles.armedRow}>
          <button
            className={styles.armedConfirm}
            onClick={fire}
            disabled={running}
          >
            {running ? "Sending…" : `Confirm — ${label}`}
          </button>
          <button
            className={styles.armedCancel}
            onClick={() => setArmed(false)}
            disabled={running}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------- Renderers -------------------- */

function renderKVs(body: unknown): React.ReactNode {
  if (!body || typeof body !== "object") return <Empty />;
  const flat = flatten(body as Record<string, unknown>);
  const entries = Object.entries(flat).filter(([, v]) => v !== "");
  if (entries.length === 0) return <Empty />;
  return (
    <div className={styles.kvTable}>
      {entries.map(([k, v]) => (
        <div className={styles.kvRow} key={k}>
          <span className={styles.kvKey}>{k}</span>
          <span className={styles.kvValue}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

function renderApps(body: unknown): React.ReactNode {
  const apps = pickArray(body, ["DeviceApps", "Apps", "Items"]);
  if (apps.length === 0) return <Empty />;
  return (
    <FilterableList
      placeholder="filter apps…"
      items={apps}
      keyOf={(a) =>
        String(
          (a as Record<string, unknown>).Identifier ??
            (a as Record<string, unknown>).BundleId ??
            (a as Record<string, unknown>).ApplicationIdentifier ??
            (a as Record<string, unknown>).Name ??
            Math.random()
        )
      }
      match={(a, q) =>
        JSON.stringify(a).toLowerCase().includes(q.toLowerCase())
      }
      render={(a) => {
        const r = a as Record<string, unknown>;
        const name =
          r.ApplicationName ?? r.Name ?? r.Identifier ?? r.BundleId ?? "(app)";
        const ver = r.Version ?? r.AppVersion ?? "";
        const status = r.Status ?? r.InstallStatus ?? "";
        return (
          <div className={styles.listRow}>
            <span className={styles.listMain}>{String(name)}</span>
            <span className={styles.listMono}>{String(ver)}</span>
            <span className={styles.listMeta}>{String(status)}</span>
          </div>
        );
      }}
    />
  );
}

function renderProfiles(body: unknown): React.ReactNode {
  const profs = pickArray(body, ["DeviceProfiles", "Profiles", "Items"]);
  if (profs.length === 0) return <Empty />;
  return (
    <FilterableList
      placeholder="filter profiles…"
      items={profs}
      keyOf={(p) =>
        String(
          (p as Record<string, unknown>).Id ??
            (p as Record<string, unknown>).Uuid ??
            (p as Record<string, unknown>).Name ??
            Math.random()
        )
      }
      match={(p, q) =>
        JSON.stringify(p).toLowerCase().includes(q.toLowerCase())
      }
      render={(p) => {
        const r = p as Record<string, unknown>;
        const name = r.Name ?? r.ProfileName ?? "(profile)";
        const status = r.Status ?? r.InstallStatus ?? "";
        return (
          <div className={styles.listRow}>
            <span className={styles.listMain}>{String(name)}</span>
            <span className={styles.listMeta}>{String(status)}</span>
          </div>
        );
      }}
    />
  );
}

function renderCerts(body: unknown): React.ReactNode {
  const certs = pickArray(body, ["DeviceCertificates", "Certificates", "Items"]);
  if (certs.length === 0) return <Empty />;
  return (
    <FilterableList
      placeholder="filter certs…"
      items={certs}
      keyOf={(c) =>
        String(
          (c as Record<string, unknown>).Thumbprint ??
            (c as Record<string, unknown>).CommonName ??
            Math.random()
        )
      }
      match={(c, q) =>
        JSON.stringify(c).toLowerCase().includes(q.toLowerCase())
      }
      render={(c) => {
        const r = c as Record<string, unknown>;
        const name = r.CommonName ?? r.IssuedTo ?? r.Subject ?? "(cert)";
        const issuer = r.Issuer ?? r.IssuedBy ?? "";
        const expiry = r.ExpirationDate ?? r.NotAfter ?? "";
        return (
          <div className={styles.listRow}>
            <span className={styles.listMain}>{String(name)}</span>
            <span className={styles.listMeta}>{String(issuer)}</span>
            <span className={styles.listMono}>{String(expiry)}</span>
          </div>
        );
      }}
    />
  );
}

function renderCompliance(body: unknown): React.ReactNode {
  const items = pickArray(body, [
    "ComplianceStatusList",
    "DeviceCompliance",
    "Items",
  ]);
  if (items.length === 0) return renderKVs(body);
  return (
    <div className={styles.kvTable}>
      {items.map((it, i) => {
        const r = it as Record<string, unknown>;
        const name =
          r.PolicyName ?? r.RuleName ?? r.Name ?? `policy ${i + 1}`;
        const compliant = r.CompliantStatus ?? r.IsCompliant ?? r.Status;
        return (
          <div className={styles.kvRow} key={i}>
            <span className={styles.kvKey}>{String(name)}</span>
            <span className={styles.kvValue}>{String(compliant)}</span>
          </div>
        );
      })}
    </div>
  );
}

function renderEventLog(body: unknown): React.ReactNode {
  const events = pickArray(body, ["DeviceEvents", "EventLog", "Events", "Items"]);
  if (events.length === 0) return <Empty />;
  return (
    <div className={styles.eventList}>
      {events.slice(0, 50).map((e, i) => {
        const r = e as Record<string, unknown>;
        const ts = r.TimeStamp ?? r.EventDate ?? r.Date ?? "";
        const msg = r.Event ?? r.Message ?? r.EventName ?? "(event)";
        const src = r.Source ?? r.EventSource ?? "";
        return (
          <div className={styles.eventRow} key={i}>
            <span className={styles.eventTs}>{String(ts)}</span>
            <span className={styles.eventMsg}>{String(msg)}</span>
            {src && <span className={styles.eventSrc}>{String(src)}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function FilterableList<T>({
  items,
  keyOf,
  match,
  render,
  placeholder,
}: {
  items: T[];
  keyOf: (item: T) => string;
  match: (item: T, query: string) => boolean;
  render: (item: T) => React.ReactNode;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => (q.trim() ? items.filter((i) => match(i, q.trim())) : items),
    [items, q, match]
  );
  return (
    <div className={styles.list}>
      <input
        className={styles.listFilter}
        type="text"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
      <div className={styles.listCount}>
        {filtered.length} of {items.length}
      </div>
      <div className={styles.listBody}>
        {filtered.slice(0, 200).map((it) => (
          <div key={keyOf(it)}>{render(it)}</div>
        ))}
        {filtered.length > 200 && (
          <div className={styles.listMeta}>
            …{filtered.length - 200} more (filter to narrow)
          </div>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return <div className={styles.empty}>no data</div>;
}

function pickArray(body: unknown, keys: string[]): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    for (const k of keys) {
      const v = (body as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function flatten(
  obj: Record<string, unknown>,
  prefix = "",
  out: Record<string, unknown> = {}
): Record<string, unknown> {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v === null || v === undefined) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      flatten(v as Record<string, unknown>, key, out);
    } else if (Array.isArray(v)) {
      out[key] = `[${v.length} items]`;
    } else {
      out[key] = v;
    }
  }
  return out;
}
