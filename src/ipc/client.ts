import { invoke } from "@tauri-apps/api/core";
import * as mock from "./mock";
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

const IS_TAURI =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function ipc<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    throw new Error(typeof error === "string" ? error : "Unknown IPC error");
  }
}

// -- Connection --

export const saveCredentials = (config: WS1Config): Promise<void> =>
  IS_TAURI ? ipc("save_credentials", { config }) : mock.saveCredentials(config);

export const loadCredentials = (): Promise<WS1Config | null> =>
  IS_TAURI ? ipc("load_credentials") : mock.loadCredentials();

export const testConnection = (): Promise<ConnectionInfo> =>
  IS_TAURI ? ipc("test_connection") : mock.testConnection();

export const clearCredentials = (): Promise<void> =>
  IS_TAURI ? ipc("clear_credentials") : mock.clearCredentials();

// -- Devices --

export const searchDevices = (
  query: string,
  searchBy: string,
  page: number,
  pageSize: number
): Promise<DeviceSearchResult> =>
  IS_TAURI
    ? ipc("search_devices", { query, searchBy, page, pageSize })
    : mock.searchDevices(query, searchBy, page, pageSize);

export const getDeviceTags = (deviceId: number): Promise<Tag[]> =>
  IS_TAURI ? ipc("get_device_tags", { deviceId }) : mock.getDeviceTags(deviceId);

// -- Tags --

export const getTags = (ogId: number): Promise<Tag[]> =>
  IS_TAURI ? ipc("get_tags", { ogId }) : mock.getTags(ogId);

export const addTagsToDevices = (
  tagId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  IS_TAURI
    ? ipc("add_tags_to_devices", { tagId, deviceIds })
    : mock.addTagsToDevices(tagId, deviceIds);

export const removeTagsFromDevices = (
  tagId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  IS_TAURI
    ? ipc("remove_tags_from_devices", { tagId, deviceIds })
    : mock.removeTagsFromDevices(tagId, deviceIds);

export const createTag = (name: string, ogId: number): Promise<Tag> =>
  IS_TAURI ? ipc("create_tag", { name, ogId }) : mock.createTag(name, ogId);

// -- Organization Groups --

export const searchOrgGroups = (): Promise<OrgGroup[]> =>
  IS_TAURI ? ipc("search_org_groups") : mock.searchOrgGroups();

/**
 * Get devices in an OG and all its descendants. WS1 device search supports
 * `lgid={ogId}` query param which transitively includes children when the
 * tenant config says so. Backend implements this via `/api/mdm/devices/search?lgid=…&pagesize=…`.
 */
export const getDevicesInOg = (ogId: number): Promise<Device[]> =>
  IS_TAURI ? ipc("get_devices_in_og", { ogId }) : mock.getDevicesInOg(ogId);

export const getOgChildren = (ogId: number): Promise<OrgGroup[]> =>
  IS_TAURI ? ipc("get_og_children", { ogId }) : mock.getOgChildren(ogId);

export const moveDeviceToOg = (
  deviceId: number,
  targetOgId: number
): Promise<void> =>
  IS_TAURI
    ? ipc("move_device_to_og", { deviceId, targetOgId })
    : mock.moveDeviceToOg();

export const bulkMoveDevices = (
  deviceIds: number[],
  targetOgId: number
): Promise<BulkActionResult> =>
  IS_TAURI
    ? ipc("bulk_move_devices", { deviceIds, targetOgId })
    : mock.bulkMoveDevices(deviceIds, targetOgId);

// -- Profiles --

export const getProfiles = (): Promise<Profile[]> =>
  IS_TAURI ? ipc("get_profiles") : mock.getProfiles();

export const assignProfile = (
  profileId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  IS_TAURI
    ? ipc("assign_profile", { profileId, deviceIds })
    : mock.assignProfile(profileId, deviceIds);

// -- Apps --

export const getApps = (): Promise<App[]> =>
  IS_TAURI ? ipc("get_apps") : mock.getApps();

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
  IS_TAURI
    ? ipc("assign_app_to_smart_group", { appId, smartGroupIds, pushMode })
    : mock.assignAppToSmartGroup(appId, smartGroupIds, pushMode);

// -- Profile install/remove (per-device, via SerialNumber) --

/**
 * Install profile on one or more devices using their serial numbers.
 * Wraps repeated `POST /api/mdm/profiles/{profileId}/install` with `{"SerialNumber": "..."}`.
 */
export const installProfileOnDevices = (
  profileId: number,
  serialNumbers: string[]
): Promise<BulkActionResult> =>
  IS_TAURI
    ? ipc("install_profile_on_devices", { profileId, serialNumbers })
    : mock.installProfileOnDevices(profileId, serialNumbers);

export const removeProfileFromDevices = (
  profileId: number,
  serialNumbers: string[]
): Promise<BulkActionResult> =>
  IS_TAURI
    ? ipc("remove_profile_from_devices", { profileId, serialNumbers })
    : mock.removeProfileFromDevices(profileId, serialNumbers);

// -- Smart Groups --

export const searchSmartGroups = (): Promise<SmartGroup[]> =>
  IS_TAURI ? ipc("search_smart_groups") : mock.searchSmartGroups();

export const getSmartGroup = (id: number): Promise<SmartGroup | null> =>
  IS_TAURI ? ipc("get_smart_group", { id }) : mock.getSmartGroup(id);

export const getSmartGroupDevices = (id: number): Promise<Device[]> =>
  IS_TAURI ? ipc("get_smart_group_devices", { id }) : mock.getSmartGroupDevices(id);

/**
 * Add devices to a smart group via `POST /api/mdm/smartgroups/{id}/update`
 * with body `{"DeviceAdditions":[{"Id":"..."}]}`.
 */
export const addDevicesToSmartGroup = (
  smartGroupId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  IS_TAURI
    ? ipc("add_devices_to_smart_group", { smartGroupId, deviceIds })
    : mock.addDevicesToSmartGroup(smartGroupId, deviceIds);

export const removeDevicesFromSmartGroup = (
  smartGroupId: number,
  deviceIds: number[]
): Promise<BulkActionResult> =>
  IS_TAURI
    ? ipc("remove_devices_from_smart_group", { smartGroupId, deviceIds })
    : mock.removeDevicesFromSmartGroup(smartGroupId, deviceIds);

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

/**
 * Run an arbitrary endpoint against the connected tenant — used by the API
 * Library tab. In dev (vite-only) this returns a mock; real Tauri build
 * forwards to the WS1 client.
 */
export const runRawEndpoint = (req: RawRequest): Promise<RawResponse> =>
  IS_TAURI
    ? ipc("run_raw_endpoint", { request: req })
    : mock.runRawEndpoint(req);

export interface SpecFetchResult {
  sourceUrl: string;
  spec: unknown;
}

/**
 * Try to fetch the WS1 MDM API V1 Swagger / OpenAPI spec from the connected
 * tenant. Pass an optional custom URL to override auto-discovery.
 */
export const fetchApiSpec = (
  customUrl?: string
): Promise<SpecFetchResult> =>
  IS_TAURI
    ? ipc("fetch_api_spec", { customUrl: customUrl ?? null }).then((r: any) => ({
        sourceUrl: r.sourcePath ?? r.source_url ?? "",
        spec: r.spec,
      }))
    : mock.fetchApiSpec(customUrl);
