import { invoke } from "@tauri-apps/api/core";
import type {
  App,
  AppPushMode,
  BulkActionResult,
  ConnectionInfo,
  Device,
  DeviceSearchResult,
  OrgGroup,
  Profile,
  SmartGroup,
  Tag,
  WS1Config,
} from "./contracts";

export type { Device } from "./contracts";

async function ipc<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    throw new Error(typeof error === "string" ? error : "Unknown IPC error");
  }
}

// -- Connection --

export const saveCredentials = (config: WS1Config): Promise<void> =>
  ipc("save_credentials", { config });

export const loadCredentials = (): Promise<WS1Config | null> =>
  ipc("load_credentials");

export const testConnection = (): Promise<ConnectionInfo> =>
  ipc("test_connection");

export const clearCredentials = (): Promise<void> => ipc("clear_credentials");

// -- Devices --

/**
 * Search WS1 devices. `ogId` scopes the result to that OG and its descendants
 * via the WS1 `lgid` query param — pass the active scope from `scopeStore`.
 * Pass `null` to query the tenant globally (used internally only — every UI
 * call should pass the current scope).
 */
export const searchDevices = (
  query: string,
  searchBy: string,
  page: number,
  pageSize: number,
  ogId: number | null
): Promise<DeviceSearchResult> =>
  ipc("search_devices", { query, searchBy, page, pageSize, ogId });

export const getDeviceTags = (deviceId: number): Promise<Tag[]> =>
  ipc("get_device_tags", { deviceId });

// -- Tags --

export const getTags = (ogId: number): Promise<Tag[]> =>
  ipc("get_tags", { ogId });

export const addTagsToDevices = (
  tagId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  ipc("add_tags_to_devices", { tagId, deviceIds });

export const removeTagsFromDevices = (
  tagId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  ipc("remove_tags_from_devices", { tagId, deviceIds });

export const createTag = (name: string, ogId: number): Promise<Tag> =>
  ipc("create_tag", { name, ogId });

// -- Organization Groups --

export const searchOrgGroups = (): Promise<OrgGroup[]> =>
  ipc("search_org_groups");

/**
 * Get devices in an OG and all its descendants. WS1 device search supports
 * `lgid={ogId}` query param which transitively includes children when the
 * tenant config says so. Backend implements this via `/api/mdm/devices/search?lgid=…&pagesize=…`.
 */
export const getDevicesInOg = (ogId: number): Promise<Device[]> =>
  ipc("get_devices_in_og", { ogId });

export const getOgChildren = (ogId: number): Promise<OrgGroup[]> =>
  ipc("get_og_children", { ogId });

export const moveDeviceToOg = (
  deviceId: number,
  targetOgId: number
): Promise<void> => ipc("move_device_to_og", { deviceId, targetOgId });

export const bulkMoveDevices = (
  deviceIds: number[],
  targetOgId: number
): Promise<BulkActionResult> =>
  ipc("bulk_move_devices", { deviceIds, targetOgId });

// -- Profiles --

/**
 * Fetch profiles in the active OG scope (or tenant root when null).
 * Wraps `GET /api/mdm/profiles/search?organizationgroupid={ogId}`.
 */
export const getProfiles = (ogId: number | null): Promise<Profile[]> =>
  ipc("get_profiles", { ogId });

export const assignProfile = (
  profileId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  ipc("assign_profile", { profileId, deviceIds });

// -- Apps --

/**
 * Fetch internal apps in the active OG scope (or tenant root when null).
 * Wraps `GET /api/mam/apps/search?locationgroupid={ogId}`.
 */
export const getApps = (ogId: number | null): Promise<App[]> =>
  ipc("get_apps", { ogId });

/**
 * Assign an internal app to one or more smart groups.
 * Wraps `POST /api/mam/apps/internal/{appId}/assignments`
 * with body `{"SmartGroupIds":[...], "DeploymentParameters":{"PushMode":"Auto|OnDemand"}}`.
 * WS1 has no direct device-targeting endpoint for app assignment.
 */
export const assignAppToSmartGroup = (
  appId: number,
  smartGroupIds: number[],
  pushMode: AppPushMode
): Promise<BulkActionResult> =>
  ipc("assign_app_to_smart_group", { appId, smartGroupIds, pushMode });

// -- Profile install/remove (per-device, via SerialNumber) --

/**
 * Install profile on one or more devices using their serial numbers.
 * Wraps repeated `POST /api/mdm/profiles/{profileId}/install` with `{"SerialNumber": "..."}`.
 */
export const installProfileOnDevices = (
  profileId: number,
  serialNumbers: string[]
): Promise<BulkActionResult> =>
  ipc("install_profile_on_devices", { profileId, serialNumbers });

export const removeProfileFromDevices = (
  profileId: number,
  serialNumbers: string[]
): Promise<BulkActionResult> =>
  ipc("remove_profile_from_devices", { profileId, serialNumbers });

// -- Smart Groups --

/**
 * Fetch smart groups in the active OG scope (or all when null).
 * Wraps `GET /api/mdm/smartgroups/search?organizationgroupid={ogId}`.
 */
export const searchSmartGroups = (ogId: number | null): Promise<SmartGroup[]> =>
  ipc("search_smart_groups", { ogId });

export const getSmartGroup = (id: number): Promise<SmartGroup | null> =>
  ipc("get_smart_group", { id });

export const getSmartGroupDevices = (id: number): Promise<Device[]> =>
  ipc("get_smart_group_devices", { id });

/**
 * Add devices to a smart group via `POST /api/mdm/smartgroups/{id}/update`
 * with body `{"DeviceAdditions":[{"Id":"..."}]}`.
 */
export const addDevicesToSmartGroup = (
  smartGroupId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  ipc("add_devices_to_smart_group", { smartGroupId, deviceIds });

export const removeDevicesFromSmartGroup = (
  smartGroupId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  ipc("remove_devices_from_smart_group", { smartGroupId, deviceIds });

// -- Raw endpoint runner (Library tab) --

export interface RawRequest {
  method: string;
  path: string;
  body?: unknown;
}

export interface RawResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

export const runRawEndpoint = (req: RawRequest): Promise<RawResponse> =>
  ipc("run_raw_endpoint", { request: req });

export interface SpecFetchResult {
  sourceUrl: string;
  spec: unknown;
}

/**
 * Try to fetch the WS1 MDM API V1 Swagger / OpenAPI spec from the connected
 * tenant. Pass an optional custom URL to override auto-discovery.
 */
export const fetchApiSpec = (customUrl?: string): Promise<SpecFetchResult> =>
  ipc<{ sourcePath?: string; source_url?: string; spec: unknown }>(
    "fetch_api_spec",
    { customUrl: customUrl ?? null }
  ).then((r) => ({
    sourceUrl: r.sourcePath ?? r.source_url ?? "",
    spec: r.spec,
  }));
