import { useMemo, useState } from "react";
import { type CatalogEndpoint } from "./catalog";
import { useCatalogStore } from "./catalogStore";
import { useUIStore } from "../state/uiStore";
import * as api from "../ipc/client";
import { SearchIcon, XIcon, ChevronDown, ChevronRight } from "../lib/icons";
import styles from "./LibraryShell.module.css";

/**
 * Library tab — searchable browser for every WS1 MDM API endpoint, with a raw
 * runner. Two-column: left is search + category tree, right is endpoint detail
 * + path/body inputs + Run button + response.
 */
export function LibraryShell() {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [customMode, setCustomMode] = useState(false);
  const selectedIdx = useUIStore((s) => s.libraryEndpointIdx);
  const setSelected = useUIStore((s) => s.setLibraryEndpoint);
  const endpoints = useCatalogStore((s) => s.endpoints);
  const source = useCatalogStore((s) => s.source);

  const filtered = useMemo(() => {
    if (!query.trim()) return endpoints;
    const q = query.toLowerCase();
    return endpoints.filter(
      (e) =>
        e.path.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.method.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [query, endpoints]);

  // Group by category preserving order of first appearance
  const grouped = useMemo(() => {
    const map = new Map<string, CatalogEndpoint[]>();
    for (const e of filtered) {
      const arr = map.get(e.category) ?? [];
      arr.push(e);
      map.set(e.category, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const selected =
    selectedIdx !== null && selectedIdx < endpoints.length
      ? endpoints[selectedIdx]
      : null;

  const toggleCategory = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  return (
    <div className={styles.library}>
      {/* Left column — search + endpoint list */}
      <aside className={styles.leftCol}>
        <div className={styles.searchBox}>
          <SearchIcon size={12} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="search endpoint by path, description, method…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery("")}>
              <XIcon size={10} />
            </button>
          )}
        </div>

        <div className={styles.listMeta}>
          <span>
            {filtered.length} of {endpoints.length} endpoints · {source}
          </span>
        </div>

        <div className={styles.list}>
          {grouped.length === 0 ? (
            <div className={styles.empty}>no matches</div>
          ) : (
            grouped.map(([cat, items]) => {
              const isCollapsed =
                !query.trim() && collapsed.has(cat); // search overrides collapse
              return (
                <div key={cat} className={styles.group}>
                  <button
                    className={styles.groupHeader}
                    onClick={() => toggleCategory(cat)}
                  >
                    <span className={styles.groupChev}>
                      {isCollapsed ? (
                        <ChevronRight size={10} />
                      ) : (
                        <ChevronDown size={10} />
                      )}
                    </span>
                    <span className={styles.groupName}>{cat}</span>
                    <span className={styles.groupCount}>{items.length}</span>
                  </button>
                  {!isCollapsed &&
                    items.map((e) => {
                      const idx = endpoints.indexOf(e);
                      const isSelected = idx === selectedIdx;
                      return (
                        <button
                          key={`${e.method}-${e.path}`}
                          className={`${styles.endpoint} ${isSelected ? styles.endpointSelected : ""}`}
                          onClick={() => setSelected(idx)}
                          title={e.description}
                        >
                          <MethodBadge method={e.method} />
                          <span className={styles.endpointPath}>{e.path}</span>
                        </button>
                      );
                    })}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Right column — endpoint detail, custom request, or empty state */}
      <section className={styles.rightCol}>
        {customMode ? (
          <CustomRequest onClose={() => setCustomMode(false)} />
        ) : selected ? (
          <EndpointDetail endpoint={selected} />
        ) : (
          <DetailEmpty
            onCustom={() => {
              setSelected(null);
              setCustomMode(true);
            }}
          />
        )}
      </section>
    </div>
  );
}

function DetailEmpty({ onCustom }: { onCustom: () => void }) {
  return (
    <div className={styles.detailEmpty}>
      <div className={styles.detailEmptyText}>
        Pick an endpoint from the left to inspect or run it.
      </div>
      <div className={styles.detailEmptyHint}>
        Search by method (e.g. <code>POST</code>), path (<code>tags</code>), or
        description (<code>send message</code>).
      </div>
      <button
        type="button"
        className={styles.customRequestBtn}
        onClick={onCustom}
      >
        + Custom request
      </button>
      <div className={styles.detailEmptyHint}>
        Use this for paths the catalog doesn&apos;t cover (e.g. MAM endpoints
        that aren&apos;t in the bundled spec).
      </div>
    </div>
  );
}

interface RunResult {
  ok: boolean;
  status: number;
  elapsed: number;
  body: string;
}

function EndpointDetail({ endpoint }: { endpoint: CatalogEndpoint }) {
  // Extract path placeholders like {tagId}, {deviceUuid}
  const placeholders = useMemo(() => {
    const re = /\{([^}]+)\}/g;
    const out: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(endpoint.path)) !== null) out.push(m[1]);
    return out;
  }, [endpoint.path]);

  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const usesBody = endpoint.method !== "GET" && endpoint.method !== "DELETE";

  // Build the resolved path (interpolate placeholders)
  const resolvedPath = useMemo(() => {
    let p = endpoint.path;
    for (const ph of placeholders) {
      const v = pathValues[ph] ?? "";
      p = p.replace(`{${ph}}`, v || `{${ph}}`);
    }
    return p;
  }, [endpoint.path, placeholders, pathValues]);

  const allPathFilled = placeholders.every((ph) => (pathValues[ph] ?? "").trim() !== "");

  // Destructive methods need a 2-click confirmation so a fat-finger can't
  // accidentally DELETE or PUT against a real tenant.
  const isDestructive = endpoint.method === "DELETE" || endpoint.method === "PUT";
  const [confirmArmed, setConfirmArmed] = useState(false);

  // Reset arm state when endpoint changes
  useMemo(() => {
    setConfirmArmed(false);
    return null;
  }, [endpoint]);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    const t0 = performance.now();
    try {
      let parsedBody: unknown = undefined;
      if (usesBody && body.trim()) {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          setResult({
            ok: false,
            status: 0,
            elapsed: 0,
            body: `Body is not valid JSON: ${(e as Error).message}`,
          });
          setRunning(false);
          return;
        }
      }
      const resp = await api.runRawEndpoint({
        method: endpoint.method,
        path: resolvedPath,
        body: parsedBody,
      });
      setResult({
        ok: resp.ok,
        status: resp.status,
        elapsed: Math.round(performance.now() - t0),
        body: typeof resp.body === "string"
          ? resp.body
          : JSON.stringify(resp.body, null, 2),
      });
    } catch (e) {
      setResult({
        ok: false,
        status: 0,
        elapsed: Math.round(performance.now() - t0),
        body: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <div className={styles.detailHeadTop}>
          <MethodBadge method={endpoint.method} large />
          <code className={styles.detailPath}>{endpoint.path}</code>
        </div>
        <p className={styles.detailDescription}>{endpoint.description}</p>
        <div className={styles.detailMeta}>
          <span className={styles.metaPill}>{endpoint.category}</span>
          {endpoint.isNew && (
            <span className={`${styles.metaPill} ${styles.metaPillNew}`}>new</span>
          )}
        </div>
      </div>

      <div className={styles.detailBody}>
        {placeholders.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>Path parameters</div>
            <div className={styles.paramGrid}>
              {placeholders.map((ph) => (
                <div className={styles.param} key={ph}>
                  <label className={styles.paramLabel}>{ph}</label>
                  <input
                    className={styles.paramInput}
                    type="text"
                    placeholder={hintForPlaceholder(ph)}
                    value={pathValues[ph] ?? ""}
                    onChange={(e) =>
                      setPathValues((prev) => ({ ...prev, [ph]: e.target.value }))
                    }
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {usesBody && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>Request body (JSON)</div>
            <textarea
              className={styles.bodyInput}
              placeholder={
                endpoint.method === "POST"
                  ? `{\n  // optional JSON body\n}`
                  : `{}`
              }
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        )}

        <div className={styles.runRow}>
          <span className={styles.runPath}>
            <span className={styles.runMethod}>{endpoint.method}</span>{" "}
            <span className={styles.runResolvedPath}>{resolvedPath}</span>
          </span>
          {isDestructive && !confirmArmed ? (
            <button
              className={`${styles.runBtn} ${styles.runBtnDestructive}`}
              onClick={() => setConfirmArmed(true)}
              disabled={!allPathFilled || running}
              title="Click once to arm — destructive request"
            >
              Arm {endpoint.method}…
            </button>
          ) : (
            <button
              className={`${styles.runBtn} ${isDestructive ? styles.runBtnDestructive : ""}`}
              onClick={async () => {
                await handleRun();
                if (isDestructive) setConfirmArmed(false);
              }}
              disabled={!allPathFilled || running}
              title={allPathFilled ? "Run the endpoint" : "Fill path parameters first"}
            >
              {running
                ? "Running…"
                : isDestructive
                  ? `Confirm ${endpoint.method}`
                  : "Run"}
            </button>
          )}
        </div>

        {result && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span>Response</span>
              <span
                className={`${styles.responseStatus} ${result.ok ? styles.responseOk : styles.responseErr}`}
              >
                {result.status === 0
                  ? "no response"
                  : `HTTP ${result.status}`}
              </span>
              <span className={styles.responseElapsed}>{result.elapsed}ms</span>
              <CopyButton text={result.body} />
            </div>
            <pre className={styles.responseBody} data-selectable>
              {result.body}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------- Custom request (free-form raw runner) -------------------- */

function CustomRequest({ onClose }: { onClose: () => void }) {
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">("GET");
  const [path, setPath] = useState("/api/");
  const [body, setBody] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [confirmArmed, setConfirmArmed] = useState(false);

  const usesBody = method !== "GET" && method !== "DELETE";
  const isDestructive = method === "DELETE" || method === "PUT";
  const pathValid =
    path.startsWith("/") &&
    !path.includes("://") &&
    !path.startsWith("//") &&
    !path.toLowerCase().startsWith("/http");

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    const t0 = performance.now();
    try {
      let parsedBody: unknown = undefined;
      if (usesBody && body.trim()) {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          setResult({
            ok: false,
            status: 0,
            elapsed: 0,
            body: `Body is not valid JSON: ${(e as Error).message}`,
          });
          setRunning(false);
          return;
        }
      }
      const resp = await api.runRawEndpoint({
        method,
        path,
        body: parsedBody,
      });
      setResult({
        ok: resp.ok,
        status: resp.status,
        elapsed: Math.round(performance.now() - t0),
        body:
          typeof resp.body === "string"
            ? resp.body
            : JSON.stringify(resp.body, null, 2),
      });
    } catch (e) {
      setResult({
        ok: false,
        status: 0,
        elapsed: Math.round(performance.now() - t0),
        body: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <div className={styles.detailHeadTop}>
          <span className={styles.customLabel}>Custom request</span>
          <button
            type="button"
            className={styles.customCloseBtn}
            onClick={onClose}
            title="Back to catalog"
          >
            ×
          </button>
        </div>
        <p className={styles.detailDescription}>
          Free-form raw runner. Use for paths the catalog doesn&apos;t cover —
          e.g. <code>/api/mam/apps/search</code> on tenants where the MAM spec
          isn&apos;t bundled.
        </p>
      </div>

      <div className={styles.detailBody}>
        <div className={styles.section}>
          <div className={styles.sectionHead}>Request</div>
          <div className={styles.customRow}>
            <select
              className={styles.customMethod}
              value={method}
              onChange={(e) =>
                setMethod(e.target.value as typeof method)
              }
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              className={styles.customPath}
              type="text"
              value={path}
              placeholder="/api/mam/apps/search?pagesize=10"
              onChange={(e) => setPath(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          {!pathValid && (
            <div className={styles.customWarn}>
              Path must start with <code>/</code> and not contain a protocol.
            </div>
          )}
        </div>

        {usesBody && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>Request body (JSON)</div>
            <textarea
              className={styles.bodyInput}
              placeholder={`{}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        )}

        <div className={styles.runRow}>
          <span className={styles.runPath}>
            <span className={styles.runMethod}>{method}</span>{" "}
            <span className={styles.runResolvedPath}>{path}</span>
          </span>
          {isDestructive && !confirmArmed ? (
            <button
              className={`${styles.runBtn} ${styles.runBtnDestructive}`}
              onClick={() => setConfirmArmed(true)}
              disabled={!pathValid || running}
              title="Click once to arm — destructive request"
            >
              Arm {method}…
            </button>
          ) : (
            <button
              className={`${styles.runBtn} ${isDestructive ? styles.runBtnDestructive : ""}`}
              onClick={async () => {
                await handleRun();
                if (isDestructive) setConfirmArmed(false);
              }}
              disabled={!pathValid || running}
            >
              {running
                ? "Running…"
                : isDestructive
                  ? `Confirm ${method}`
                  : "Run"}
            </button>
          )}
        </div>

        {result && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span>Response</span>
              <span
                className={`${styles.responseStatus} ${result.ok ? styles.responseOk : styles.responseErr}`}
              >
                {result.status === 0 ? "no response" : `HTTP ${result.status}`}
              </span>
              <span className={styles.responseElapsed}>{result.elapsed}ms</span>
              <CopyButton text={result.body} />
            </div>
            <pre className={styles.responseBody} data-selectable>
              {result.body}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const addToast = useUIStore((s) => s.addToast);
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      addToast(
        `Copy failed: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    }
  };
  return (
    <button
      className={styles.copyBtn}
      onClick={onClick}
      type="button"
      title="Copy response body to clipboard"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MethodBadge({
  method,
  large,
}: {
  method: CatalogEndpoint["method"];
  large?: boolean;
}) {
  const className = `${styles.methodBadge} ${styles[`m_${method.toLowerCase()}`]} ${large ? styles.methodBadgeLg : ""}`;
  return <span className={className}>{method}</span>;
}

function hintForPlaceholder(ph: string): string {
  const lower = ph.toLowerCase();
  if (lower.includes("uuid")) return "device or resource UUID";
  if (lower.includes("serialnumber") || lower.includes("serial")) return "C02X917QML87";
  if (lower.includes("udid")) return "device UDID";
  if (lower === "id" || lower.endsWith("id")) return "numeric id";
  if (lower.includes("og")) return "organization group id";
  if (lower.includes("group")) return "group id";
  if (lower.includes("tag")) return "tag id";
  if (lower.includes("smartgroup")) return "smart group id";
  return "";
}
