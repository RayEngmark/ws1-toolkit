import * as api from "../ipc/client";
import type { Device, IdentifierType, ResolvedRow } from "../ipc/contracts";
import { useScopeStore } from "../state/scopeStore";

/**
 * Detect the most likely identifier type from a single line of input.
 * Used as a hint shown next to the search box; the actual lookup fans out
 * across every type unless the user has pinned one.
 */
export function detectType(line: string): IdentifierType {
  const v = line.trim();
  if (!v) return "unknown";

  // Apple UDID: 40 hex chars, no separators. WS1 expects this exact form
  // for the searchby=Udid lookup.
  if (/^[0-9a-f]{40}$/i.test(v)) return "uuid";
  // Standard UUID: 8-4-4-4-12 hex. Some tenants accept this directly via
  // searchby=Udid, others don't — fan-out tries it either way.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
    return "uuid";
  }
  if (/^\d{15}$/.test(v)) return "imei";
  if (/^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(v) || /^[0-9a-f]{12}$/i.test(v)) {
    return "macAddress";
  }
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(v)) return "username";
  if (/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/i.test(v)) return "username";
  if (/^\d{1,8}$/.test(v)) return "assetTag";
  if (/\s/.test(v) || /['"]/.test(v)) return "friendlyName";
  return "serial";
}

export type SearchOverride =
  | "auto"
  | "serial"
  | "username"
  | "imei"
  | "macAddress"
  | "uuid"
  | "easid"
  | "deviceid";

const OVERRIDE_TO_SEARCH_BY: Record<Exclude<SearchOverride, "auto">, string> = {
  serial: "Serialnumber",
  username: "Username",
  imei: "ImeiNumber",
  macAddress: "Macaddress",
  uuid: "Udid",
  easid: "EasId",
  deviceid: "DeviceId",
};

export interface ResolveResult {
  rows: ResolvedRow[];
  resolvedDevices: Device[];
}

/**
 * Look up a single line by firing every searchable identifier type in
 * parallel and merging the results — so the user can paste a serial,
 * username, MAC, UUID, IMEI, EAS id, or device id without having to
 * declare what it is. Six calls are alternate-id lookups (single device
 * or 404 each); one is a username filter (list).
 */
async function fanOut(line: string, ogId: number | null): Promise<Device[]> {
  const altIds = [
    "Serialnumber",
    "Macaddress",
    "Udid",
    "ImeiNumber",
    "EasId",
    "DeviceId",
  ];
  const altCalls = altIds.map((searchBy) =>
    api
      .searchDevices(line, searchBy, 0, 1, ogId)
      .then((r) => r.devices)
      .catch(() => [] as Device[])
  );
  const userCall = api
    .searchDevices(line, "Username", 0, 50, ogId)
    .then((r) => r.devices)
    .catch(() => [] as Device[]);

  const all = (await Promise.all([...altCalls, userCall])).flat();
  return dedupeById(all);
}

async function singleLookup(
  line: string,
  searchBy: string,
  ogId: number | null
): Promise<Device[]> {
  // In override mode the user has explicitly pinned an identifier type, so a
  // 404 / 4xx / auth error is meaningful — propagate to the caller (which
  // surfaces it as a toast). Auto/fan-out mode does its own swallowing because
  // it expects most of the parallel calls to miss.
  const r = await api.searchDevices(line, searchBy, 0, 50, ogId);
  return r.devices;
}

function dedupeById(devices: Device[]): Device[] {
  const seen = new Set<number>();
  const out: Device[] = [];
  for (const d of devices) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      out.push(d);
    }
  }
  return out;
}

/**
 * Resolve a list of pasted lines to full Device records.
 * - `auto` (default) fans out across every identifier type per line.
 * - Any other override constrains lookups to that single type.
 */
export async function resolveLines(
  lines: string[],
  override: SearchOverride = "auto"
): Promise<ResolveResult> {
  const trimmed = lines.map((l) => l.trim()).filter(Boolean);
  const unique = Array.from(new Set(trimmed));
  // Read the active OG scope at call time so every lookup respects whatever
  // the user has currently selected — never cached at module load.
  const ogId = useScopeStore.getState().activeOgId;

  const results = await Promise.all(
    unique.map(async (line): Promise<ResolvedRow> => {
      const detectedType = detectType(line);

      const devices =
        override === "auto"
          ? await fanOut(line, ogId)
          : await singleLookup(line, OVERRIDE_TO_SEARCH_BY[override], ogId);

      if (devices.length === 0) {
        return { sourceLine: line, detectedType, status: "notFound" };
      }
      if (devices.length === 1) {
        return {
          sourceLine: line,
          detectedType,
          status: "resolved",
          device: devices[0],
        };
      }
      return {
        sourceLine: line,
        detectedType,
        status: "ambiguous",
        candidates: devices,
      };
    })
  );

  const resolvedDevices = dedupeById(
    results
      .filter((r): r is ResolvedRow & { device: Device } => r.status === "resolved" && !!r.device)
      .map((r) => r.device)
  );

  return { rows: results, resolvedDevices };
}

export const TYPE_LABEL: Record<IdentifierType, string> = {
  serial: "Serial",
  uuid: "UUID",
  imei: "IMEI",
  macAddress: "MAC",
  username: "User",
  assetTag: "Asset Tag",
  friendlyName: "Name",
  deviceId: "Device ID",
  unknown: "Unknown",
};
