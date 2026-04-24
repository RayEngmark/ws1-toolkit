// -- Config types --

export type AuthMode = "basic" | "oauth";

export interface WS1Config {
  tenantUrl: string;
  apiKey: string;
  authMode: AuthMode;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
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
}

export interface DeviceSearchResult {
  devices: Device[];
  page: number;
  pageSize: number;
  total: number;
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

// -- Bulk action types --

export interface BulkActionResult {
  total: number;
  accepted: number;
  failed: number;
  errors: string[];
}
