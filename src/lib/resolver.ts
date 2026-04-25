import * as api from "../ipc/client";
import type { Device, IdentifierType, ResolvedRow } from "../ipc/contracts";

/**
 * Detect the most likely identifier type from a single line of input.
 * Order matters — most specific patterns first.
 */
export function detectType(line: string): IdentifierType {
  const v = line.trim();
  if (!v) return "unknown";

  // UUID v4: 8-4-4-4-12 hex
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
    return "uuid";
  }

  // IMEI: exactly 15 digits
  if (/^\d{15}$/.test(v)) {
    return "imei";
  }

  // MAC: aa:bb:cc:dd:ee:ff or aa-bb-... or 12 hex with no separators
  if (/^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(v) || /^[0-9a-f]{12}$/i.test(v)) {
    return "macAddress";
  }

  // Username with email
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(v)) {
    return "username";
  }

  // Username firstname.lastname
  if (/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/i.test(v)) {
    return "username";
  }

  // Pure numeric → device ID (rare) or asset tag — treat as asset tag
  if (/^\d{1,8}$/.test(v)) {
    return "assetTag";
  }

  // Friendly name (has spaces or apostrophes)
  if (/\s/.test(v) || /['"]/.test(v)) {
    return "friendlyName";
  }

  // Default: assume serial number (most common in IT workflows)
  return "serial";
}

// WS1 UEM API `searchby` parameter values per /api/mdm/devices/search docs.
// Confirmed via PyVMwareAirWatch source + Omnissa API help: Serialnumber,
// Macaddress, Udid, ImeiNumber, EasId.
const TYPE_TO_SEARCH_BY: Record<IdentifierType, string | null> = {
  serial: "Serialnumber",
  uuid: "Udid",
  imei: "ImeiNumber",
  macAddress: "Macaddress",
  username: "Username",
  assetTag: "Assettag",
  friendlyName: "DeviceFriendlyName",
  deviceId: null,
  unknown: null,
};

export interface ResolveResult {
  rows: ResolvedRow[];
  resolvedDevices: Device[];
}

/**
 * Resolve a list of pasted lines to full Device records.
 * Each line is detected, looked up via the appropriate API search, and the result is cached.
 * Returns per-row resolution info plus a deduped array of resolved devices.
 */
export async function resolveLines(lines: string[]): Promise<ResolveResult> {
  const trimmed = lines.map((l) => l.trim()).filter(Boolean);
  const unique = Array.from(new Set(trimmed));

  const results = await Promise.all(
    unique.map(async (line): Promise<ResolvedRow> => {
      const type = detectType(line);
      const searchBy = TYPE_TO_SEARCH_BY[type];

      if (!searchBy) {
        return {
          sourceLine: line,
          detectedType: type,
          status: "notFound",
          error: "Unrecognized identifier",
        };
      }

      try {
        const result = await api.searchDevices(line, searchBy, 0, 50);
        const devices = result.devices;

        if (devices.length === 0) {
          return {
            sourceLine: line,
            detectedType: type,
            status: "notFound",
          };
        }

        if (devices.length === 1) {
          return {
            sourceLine: line,
            detectedType: type,
            status: "resolved",
            device: devices[0],
          };
        }

        return {
          sourceLine: line,
          detectedType: type,
          status: "ambiguous",
          candidates: devices,
        };
      } catch (e) {
        return {
          sourceLine: line,
          detectedType: type,
          status: "notFound",
          error: e instanceof Error ? e.message : "Lookup failed",
        };
      }
    })
  );

  // Dedupe resolved devices by id
  const seen = new Set<number>();
  const resolvedDevices: Device[] = [];
  for (const row of results) {
    if (row.status === "resolved" && row.device && !seen.has(row.device.id)) {
      seen.add(row.device.id);
      resolvedDevices.push(row.device);
    }
  }

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
