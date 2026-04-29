// -- Config types --

/** OAuth-only WS1 configuration. */
export interface WS1Config {
  tenantUrl: string;
  apiKey: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  /** Optional override for the Swagger spec URL used by "Import API library". */
  specUrl?: string;
}

export interface ConnectionInfo {
  connected: boolean;
  tenantName?: string;
  version?: string;
  error?: string;
}

// -- Device types --

export interface Device {
  id: number;
  uuid: string;
  serialNumber: string;
  friendlyName: string;
  userName: string;
  model: string;
  os: string;
  platform: string;
  complianceStatus: string;
  lastSeen: string;
  ownership: string;
  enrollmentStatus: string;
  ogName: string;
  ogId: number;
  macAddress: string;
  imei: string;
  assetNumber: string;
  udid: string;
}

export interface DeviceSearchResult {
  devices: Device[];
  page: number;
  pageSize: number;
  total: number;
}

// -- Resolved input (paste-list resolution) --

export type IdentifierType =
  | "serial"
  | "username"
  | "uuid"
  | "imei"
  | "macAddress"
  | "assetTag"
  | "friendlyName"
  | "deviceId"
  | "unknown";

export interface ResolvedRow {
  sourceLine: string;
  detectedType: IdentifierType;
  status: "resolved" | "notFound" | "ambiguous" | "pending";
  device?: Device;
  candidates?: Device[];
  error?: string;
}

// -- Tag types --

export interface Tag {
  id: number;
  tagName: string;
  deviceCount: number;
}

// -- Organization Group types --

export interface OrgGroup {
  id: number;
  name: string;
  groupId: string;
  ogType: string;
  parentId: number | null;
  children: OrgGroup[];
}

// -- Profile types --

export interface Profile {
  id: number;
  name: string;
  description: string;
  platform: string;
  profileType: string;
  ogName: string;
}

// -- App types --

export interface App {
  id: number;
  name: string;
  bundleId: string;
  version: string;
  platform: string;
  appType: "internal" | "public" | "purchased";
  ogName: string;
}

// -- Smart Group types --

export type SmartGroupCriteriaType = "All" | "UserDevice" | "None";

export interface SmartGroup {
  id: number;
  name: string;
  criteriaType: SmartGroupCriteriaType;
  managedByOgId: number;
  managedByOgName: string;
  deviceCount: number;
  appCount: number;
  profileCount: number;
}

// -- App assignment payload (POST /api/mam/apps/internal/{id}/assignments) --

export type AppPushMode = "Auto" | "OnDemand";

export interface AppAssignmentPayload {
  smartGroupIds: number[];
  pushMode: AppPushMode;
}

// -- Profile assignment target --

export type ProfileTarget = "devices" | "smartgroup";

/** Returned by `get_profile_assignment` — what SGs the profile currently
 * targets, plus the OG context the assignment lives under. Used to merge
 * a new SG into the assignment without wiping the existing list. */
export interface ProfileAssignment {
  profileId: number;
  assignmentType: string;
  managedOgId: number;
  assignedSgIds: number[];
  excludedSgIds: number[];
}

// -- Bulk action result --

export interface BulkActionResult {
  total: number;
  accepted: number;
  failed: number;
  errors: string[];
}
