import type { CatalogEndpoint, HttpMethod } from "./catalog";

const METHOD_KEYS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/**
 * Parse a Swagger 2.0 / OpenAPI 3.0 spec object and emit our CatalogEndpoint
 * shape. The format we accept is the JSON the WS1 `/api/help` page loads.
 *
 * - Swagger 2.0: top-level `basePath` is honored if present.
 * - OpenAPI 3.0: first server `url` is honored.
 * - Operation tags become the `category`. If an op has multiple tags the
 *   first one is used.
 * - Description falls back to `summary`, then to `operationId`, then "".
 */
export function specToCatalog(spec: unknown): CatalogEndpoint[] {
  if (!spec || typeof spec !== "object") return [];
  const root = spec as Record<string, unknown>;

  const paths = (root.paths ?? {}) as Record<string, Record<string, unknown>>;

  // Compute the base path so emitted entries match how the runner expects them
  // (we store paths starting with `/api/...` to match the bundled catalog).
  let basePath = "";
  if (typeof root.basePath === "string") {
    basePath = root.basePath as string;
  } else if (Array.isArray(root.servers) && root.servers.length > 0) {
    const s = root.servers[0] as Record<string, unknown>;
    if (typeof s?.url === "string") {
      // Strip protocol+host if it's an absolute URL.
      try {
        const u = new URL(s.url as string);
        basePath = u.pathname || "";
      } catch {
        basePath = s.url as string;
      }
    }
  }
  basePath = basePath.replace(/\/$/, "");

  const out: CatalogEndpoint[] = [];

  for (const [rawPath, ops] of Object.entries(paths)) {
    if (!ops || typeof ops !== "object") continue;
    const fullPath = `${basePath}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;
    for (const m of METHOD_KEYS) {
      const op = (ops as Record<string, unknown>)[m.toLowerCase()] as
        | Record<string, unknown>
        | undefined;
      if (!op) continue;

      const tags = Array.isArray(op.tags) ? (op.tags as string[]) : [];
      const category = tags[0] ?? "Uncategorised";
      const summary = typeof op.summary === "string" ? op.summary : "";
      const description =
        typeof op.description === "string" && op.description.length > 0
          ? op.description
          : summary ||
            (typeof op.operationId === "string" ? op.operationId : "");

      out.push({
        category,
        method: m,
        path: fullPath,
        description,
      });
    }
  }

  return out;
}
