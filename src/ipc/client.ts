import { invoke } from "@tauri-apps/api/core";
import type {
  BulkActionResult,
  ConnectionInfo,
  DeviceSearchResult,
  OrgGroup,
  Tag,
  WS1Config,
} from "./contracts";

async function ipc<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    throw new Error(typeof error === "string" ? error : "Unknown IPC error");
  }
}

// -- Connection --

export function saveCredentials(config: WS1Config): Promise<void> {
  return ipc("save_credentials", { config });
}

export function loadCredentials(): Promise<WS1Config | null> {
  return ipc("load_credentials");
}

export function testConnection(): Promise<ConnectionInfo> {
  return ipc("test_connection");
}

export function clearCredentials(): Promise<void> {
  return ipc("clear_credentials");
}

// -- Devices --

export function searchDevices(
  query: string,
  searchBy: string,
  page: number,
  pageSize: number
): Promise<DeviceSearchResult> {
  return ipc("search_devices", { query, searchBy, page, pageSize });
}

export function getDeviceTags(deviceId: number): Promise<Tag[]> {
  return ipc("get_device_tags", { deviceId });
}

// -- Tags --

export function getTags(ogId: number): Promise<Tag[]> {
  return ipc("get_tags", { ogId });
}

export function addTagsToDevices(
  tagId: number,
  deviceIds: number[]
): Promise<BulkActionResult> {
  return ipc("add_tags_to_devices", { tagId, deviceIds });
}

export function removeTagsFromDevices(
  tagId: number,
  deviceIds: number[]
): Promise<BulkActionResult> {
  return ipc("remove_tags_from_devices", { tagId, deviceIds });
}

// -- Organization Groups --

export function searchOrgGroups(): Promise<OrgGroup[]> {
  return ipc("search_org_groups");
}

export function getOgChildren(ogId: number): Promise<OrgGroup[]> {
  return ipc("get_og_children", { ogId });
}

export function moveDeviceToOg(
  deviceId: number,
  targetOgId: number
): Promise<void> {
  return ipc("move_device_to_og", { deviceId, targetOgId });
}

export function bulkMoveDevices(
  deviceIds: number[],
  targetOgId: number
): Promise<BulkActionResult> {
  return ipc("bulk_move_devices", { deviceIds, targetOgId });
}
