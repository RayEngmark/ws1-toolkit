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

function makeDevice(d: Partial<Device> & { id: number }): Device {
  return {
    id: d.id,
    uuid: d.uuid ?? `00000000-0000-0000-0000-${String(d.id).padStart(12, "0")}`,
    serialNumber: d.serialNumber ?? "",
    friendlyName: d.friendlyName ?? "",
    userName: d.userName ?? "",
    model: d.model ?? "",
    os: d.os ?? "",
    platform: d.platform ?? "",
    complianceStatus: d.complianceStatus ?? "Compliant",
    lastSeen: d.lastSeen ?? new Date().toISOString(),
    ownership: d.ownership ?? "Corporate",
    enrollmentStatus: d.enrollmentStatus ?? "Enrolled",
    ogName: d.ogName ?? "",
    ogId: d.ogId ?? 0,
    macAddress: d.macAddress ?? "",
    imei: d.imei ?? "",
    assetNumber: d.assetNumber ?? "",
    udid: d.udid ?? d.uuid ?? "",
  };
}

const FAKE_DEVICES: Device[] = [
  makeDevice({
    id: 1001,
    uuid: "5523af00-1234-4abc-9def-aaaaaaaa1001",
    serialNumber: "DMPPQ9J0J1GH",
    friendlyName: "John's iPad Pro",
    userName: "john.doe",
    model: "iPad Pro 12.9",
    os: "iOS 17.4.1",
    platform: "Apple",
    complianceStatus: "Compliant",
    lastSeen: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    ogName: "HQ / IT",
    ogId: 3,
    macAddress: "aa:bb:cc:11:22:33",
    imei: "354217112900181",
    assetNumber: "IPAD-2391",
    udid: "5523af00-1234-4abc-9def-aaaaaaaa1001",
  }),
  makeDevice({
    id: 1002,
    uuid: "5523af00-1234-4abc-9def-aaaaaaaa1002",
    serialNumber: "C02X917QML87",
    friendlyName: "Jane's MacBook Pro",
    userName: "jane.smith",
    model: "MacBook Pro 16",
    os: "macOS 14.4",
    platform: "Apple",
    complianceStatus: "NonCompliant",
    lastSeen: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    ogName: "HQ / Executive",
    ogId: 4,
    macAddress: "aa:bb:cc:11:22:34",
    assetNumber: "MBP-1187",
    udid: "5523af00-1234-4abc-9def-aaaaaaaa1002",
  }),
  makeDevice({
    id: 1003,
    uuid: "5523af00-1234-4abc-9def-aaaaaaaa1003",
    serialNumber: "F17QM2P1JC67",
    friendlyName: "Bob's iPhone 15",
    userName: "bob.jones",
    model: "iPhone 15 Pro",
    os: "iOS 17.5",
    platform: "Apple",
    ownership: "BYOD",
    complianceStatus: "Compliant",
    lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    ogName: "Branch / Sales",
    ogId: 9,
    imei: "352000891231453",
    udid: "5523af00-1234-4abc-9def-aaaaaaaa1003",
  }),
  makeDevice({
    id: 1004,
    uuid: "5523af00-1234-4abc-9def-aaaaaaaa1004",
    serialNumber: "SN7890ABC123",
    friendlyName: "Alice's Surface Pro",
    userName: "alice.kim",
    model: "Surface Pro 9",
    os: "Windows 11 23H2",
    platform: "WinRT",
    complianceStatus: "Compliant",
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ogName: "HQ / Marketing",
    ogId: 5,
    macAddress: "aa:bb:cc:11:22:36",
    assetNumber: "SP9-0451",
  }),
  makeDevice({
    id: 1005,
    uuid: "5523af00-1234-4abc-9def-aaaaaaaa1005",
    serialNumber: "SAMSUNGX501",
    friendlyName: "Carl's Galaxy S24",
    userName: "carl.petersen",
    model: "Galaxy S24 Ultra",
    os: "Android 14",
    platform: "Android",
    complianceStatus: "NonCompliant",
    lastSeen: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    ogName: "Remote / Field",
    ogId: 12,
    imei: "354217119980022",
  }),
  makeDevice({
    id: 1006,
    uuid: "5523af00-1234-4abc-9def-aaaaaaaa1006",
    serialNumber: "DELLLT2291",
    friendlyName: "Eva's Dell Latitude",
    userName: "eva.holm",
    model: "Latitude 7440",
    os: "Windows 11 23H2",
    platform: "WinRT",
    complianceStatus: "Compliant",
    lastSeen: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    ogName: "HQ / Finance",
    ogId: 7,
    assetNumber: "DELL-7440-12",
  }),
  makeDevice({
    id: 1007,
    uuid: "5523af00-1234-4abc-9def-aaaaaaaa1007",
    serialNumber: "HPELITE884",
    friendlyName: "Mike's EliteBook",
    userName: "michael.nguyen",
    model: "EliteBook 860 G10",
    os: "Windows 11 23H2",
    platform: "WinRT",
    complianceStatus: "Compliant",
    lastSeen: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    ogName: "HQ / Engineering",
    ogId: 6,
  }),
  makeDevice({
    id: 1008,
    uuid: "5523af00-1234-4abc-9def-aaaaaaaa1008",
    serialNumber: "F2LNQ3PXJ147",
    friendlyName: "Lisa's iPhone",
    userName: "lisa.andersen",
    model: "iPhone 15",
    os: "iOS 17.4",
    platform: "Apple",
    ownership: "BYOD",
    complianceStatus: "Compliant",
    lastSeen: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    ogName: "HQ / Marketing",
    ogId: 5,
    imei: "354217116630099",
  }),
];

const FAKE_TAGS: Tag[] = [
  { id: 501, tagName: "VPN-Required", deviceCount: 142 },
  { id: 502, tagName: "Executive-Device", deviceCount: 12 },
  { id: 503, tagName: "BYOD", deviceCount: 87 },
  { id: 504, tagName: "Shared-Device", deviceCount: 34 },
  { id: 505, tagName: "Kiosk-Mode", deviceCount: 8 },
  { id: 506, tagName: "High-Security", deviceCount: 56 },
  { id: 507, tagName: "Field-Workers", deviceCount: 23 },
  { id: 508, tagName: "Training-Ready", deviceCount: 19 },
  { id: 509, tagName: "Compliance-Watch", deviceCount: 41 },
  { id: 510, tagName: "Test-Devices", deviceCount: 7 },
];

const FAKE_OGS: OrgGroup[] = [
  {
    id: 1,
    name: "Acme Corporation",
    groupId: "acmecorp",
    ogType: "Customer",
    parentId: null,
    children: [
      {
        id: 2,
        name: "HQ",
        groupId: "hq",
        ogType: "Container",
        parentId: 1,
        children: [
          { id: 3, name: "IT", groupId: "hq-it", ogType: "Container", parentId: 2, children: [] },
          { id: 4, name: "Executive", groupId: "hq-exec", ogType: "Container", parentId: 2, children: [] },
          { id: 5, name: "Marketing", groupId: "hq-marketing", ogType: "Container", parentId: 2, children: [] },
          { id: 6, name: "Engineering", groupId: "hq-eng", ogType: "Container", parentId: 2, children: [] },
          { id: 7, name: "Finance", groupId: "hq-fin", ogType: "Container", parentId: 2, children: [] },
        ],
      },
      {
        id: 8,
        name: "Branch Office",
        groupId: "branch",
        ogType: "Container",
        parentId: 1,
        children: [
          { id: 9, name: "Sales", groupId: "branch-sales", ogType: "Container", parentId: 8, children: [] },
          { id: 10, name: "Support", groupId: "branch-support", ogType: "Container", parentId: 8, children: [] },
        ],
      },
      {
        id: 11,
        name: "Remote",
        groupId: "remote",
        ogType: "Container",
        parentId: 1,
        children: [
          { id: 12, name: "Field", groupId: "remote-field", ogType: "Container", parentId: 11, children: [] },
        ],
      },
    ],
  },
];

const FAKE_PROFILES: Profile[] = [
  { id: 201, name: "Corporate WiFi", description: "Configures corporate SSID with 802.1X", platform: "Apple", profileType: "Network", ogName: "Acme Corporation" },
  { id: 202, name: "Email - Exchange", description: "Exchange ActiveSync mailbox", platform: "Apple", profileType: "Email", ogName: "Acme Corporation" },
  { id: 203, name: "VPN Always-On", description: "Always-on VPN tunnel for corporate access", platform: "Apple", profileType: "VPN", ogName: "Acme Corporation" },
  { id: 204, name: "Passcode Policy", description: "Enforces 6-digit passcode + 5min timeout", platform: "Apple", profileType: "Passcode", ogName: "Acme Corporation" },
  { id: 205, name: "Restrictions - Standard", description: "Disables iCloud backup, restricts AirDrop", platform: "Apple", profileType: "Restrictions", ogName: "Acme Corporation" },
  { id: 206, name: "Windows BitLocker", description: "Enables BitLocker drive encryption", platform: "WinRT", profileType: "Encryption", ogName: "Acme Corporation" },
  { id: 207, name: "Windows Firewall", description: "Standard firewall rules + logging", platform: "WinRT", profileType: "Firewall", ogName: "Acme Corporation" },
  { id: 208, name: "Android Work Profile", description: "Sets up Android Enterprise work profile", platform: "Android", profileType: "Work Profile", ogName: "Acme Corporation" },
];

const FAKE_APPS: App[] = [
  { id: 301, name: "Microsoft Outlook", bundleId: "com.microsoft.Office.Outlook", version: "4.2421.0", platform: "Apple", appType: "public", ogName: "Acme Corporation" },
  { id: 302, name: "Microsoft Teams", bundleId: "com.microsoft.skype.teams", version: "6.13.0", platform: "Apple", appType: "public", ogName: "Acme Corporation" },
  { id: 303, name: "Slack", bundleId: "com.tinyspeck.chatlyio", version: "24.04.10", platform: "Apple", appType: "public", ogName: "Acme Corporation" },
  { id: 304, name: "Workspace ONE Hub", bundleId: "com.airwatch.airwatchagent", version: "24.4.0", platform: "Apple", appType: "internal", ogName: "Acme Corporation" },
  { id: 305, name: "Cisco AnyConnect", bundleId: "com.cisco.anyconnect.gui", version: "5.0.04032", platform: "Apple", appType: "public", ogName: "Acme Corporation" },
  { id: 306, name: "1Password", bundleId: "com.agilebits.onepassword7", version: "8.10.34", platform: "Apple", appType: "public", ogName: "Acme Corporation" },
  { id: 307, name: "Adobe Acrobat Reader", bundleId: "com.adobe.Adobe-Reader", version: "24.4.0", platform: "Apple", appType: "public", ogName: "Acme Corporation" },
  { id: 308, name: "Internal CRM", bundleId: "com.acme.crm", version: "2.1.4", platform: "Apple", appType: "internal", ogName: "Acme Corporation" },
];

// -- Mock implementations --

export async function saveCredentials(_config: WS1Config): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
}

export async function loadCredentials(): Promise<WS1Config | null> {
  return {
    tenantUrl: "https://as135.awmdm.com",
    apiKey: "••••••••••••••••",
    authMode: "basic",
    username: "admin@acmecorp.com",
    password: "••••••••",
  };
}

export async function testConnection(): Promise<ConnectionInfo> {
  return {
    connected: true,
    tenantName: "Acme Corporation",
    version: "2024.3.1",
  };
}

export async function clearCredentials(): Promise<void> {}

export async function searchDevices(
  query: string,
  searchBy: string,
  page: number,
  pageSize: number
): Promise<DeviceSearchResult> {
  await new Promise((r) => setTimeout(r, 80));
  const q = query.trim().toLowerCase();
  if (!q) {
    return { devices: FAKE_DEVICES.slice(0, pageSize), page, pageSize, total: FAKE_DEVICES.length };
  }

  const matchField = (d: Device): boolean => {
    switch (searchBy) {
      case "Serialnumber":
        return d.serialNumber.toLowerCase() === q;
      case "Username":
        return d.userName.toLowerCase().includes(q);
      case "Udid":
        return d.udid.toLowerCase() === q || d.uuid.toLowerCase() === q;
      case "ImeiNumber":
        return d.imei === q;
      case "Macaddress":
        return d.macAddress.toLowerCase() === q || d.macAddress.replace(/[:-]/g, "").toLowerCase() === q.replace(/[:-]/g, "");
      case "Assettag":
        return d.assetNumber.toLowerCase() === q;
      case "DeviceFriendlyName":
        return d.friendlyName.toLowerCase().includes(q);
      default:
        return false;
    }
  };

  const filtered = FAKE_DEVICES.filter(matchField);
  return { devices: filtered, page, pageSize, total: filtered.length };
}

export async function getDeviceTags(deviceId: number): Promise<Tag[]> {
  // Simulate per-device tags
  const idx = deviceId % FAKE_TAGS.length;
  return [FAKE_TAGS[idx], FAKE_TAGS[(idx + 1) % FAKE_TAGS.length]];
}

export async function getTags(_ogId: number): Promise<Tag[]> {
  return FAKE_TAGS;
}

export async function addTagsToDevices(
  _tagId: number,
  deviceIds: number[]
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 400));
  return { total: deviceIds.length, accepted: deviceIds.length, failed: 0, errors: [] };
}

export async function removeTagsFromDevices(
  _tagId: number,
  deviceIds: number[]
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 400));
  return { total: deviceIds.length, accepted: deviceIds.length, failed: 0, errors: [] };
}

export async function searchOrgGroups(): Promise<OrgGroup[]> {
  return FAKE_OGS;
}

export async function getOgChildren(_ogId: number): Promise<OrgGroup[]> {
  return [];
}

export async function moveDeviceToOg(): Promise<void> {}

export async function bulkMoveDevices(
  deviceIds: number[],
  _targetOgId: number
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 600));
  return { total: deviceIds.length, accepted: deviceIds.length, failed: 0, errors: [] };
}

export async function getProfiles(): Promise<Profile[]> {
  return FAKE_PROFILES;
}

export async function assignProfile(
  _profileId: number,
  deviceIds: number[]
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 600));
  return { total: deviceIds.length, accepted: deviceIds.length, failed: 0, errors: [] };
}

export async function getApps(): Promise<App[]> {
  return FAKE_APPS;
}

export async function assignApp(
  _appId: number,
  deviceIds: number[]
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 700));
  return { total: deviceIds.length, accepted: deviceIds.length, failed: 0, errors: [] };
}

export async function createTag(name: string, _ogId: number): Promise<Tag> {
  await new Promise((r) => setTimeout(r, 300));
  return { id: 600 + Math.floor(Math.random() * 100), tagName: name, deviceCount: 0 };
}

// -- Smart Groups --

const FAKE_SGS: SmartGroup[] = [
  { id: 7001, name: "All iPads", criteriaType: "UserDevice", managedByOgId: 1, managedByOgName: "Acme Corporation", deviceCount: 412, appCount: 8, profileCount: 4 },
  { id: 7002, name: "Executive Devices", criteriaType: "All", managedByOgId: 4, managedByOgName: "HQ / Executive", deviceCount: 12, appCount: 12, profileCount: 6 },
  { id: 7003, name: "Marketing Macs", criteriaType: "All", managedByOgId: 5, managedByOgName: "HQ / Marketing", deviceCount: 38, appCount: 5, profileCount: 3 },
  { id: 7004, name: "Engineering Windows", criteriaType: "UserDevice", managedByOgId: 6, managedByOgName: "HQ / Engineering", deviceCount: 84, appCount: 11, profileCount: 5 },
  { id: 7005, name: "Field Workers Android", criteriaType: "UserDevice", managedByOgId: 12, managedByOgName: "Remote / Field", deviceCount: 23, appCount: 4, profileCount: 2 },
  { id: 7006, name: "BYOD iOS", criteriaType: "All", managedByOgId: 1, managedByOgName: "Acme Corporation", deviceCount: 87, appCount: 3, profileCount: 1 },
  { id: 7007, name: "Test Devices", criteriaType: "UserDevice", managedByOgId: 3, managedByOgName: "HQ / IT", deviceCount: 7, appCount: 2, profileCount: 8 },
  { id: 7008, name: "Compliance Watch", criteriaType: "All", managedByOgId: 1, managedByOgName: "Acme Corporation", deviceCount: 41, appCount: 0, profileCount: 0 },
];

// Get all devices that live in a given OG _or any of its descendants_.
// Mock: uses ogId on each fake device and the OG tree to compute descendants.
export async function getDevicesInOg(ogId: number): Promise<Device[]> {
  await new Promise((r) => setTimeout(r, 150));
  const collectIds = (groups: OrgGroup[], targetId: number, found: Set<number>) => {
    for (const g of groups) {
      if (g.id === targetId) {
        const collect = (gg: OrgGroup) => {
          found.add(gg.id);
          for (const child of gg.children) collect(child);
        };
        collect(g);
        return true;
      }
      if (collectIds(g.children, targetId, found)) return true;
    }
    return false;
  };
  const ids = new Set<number>();
  collectIds(FAKE_OGS, ogId, ids);
  return FAKE_DEVICES.filter((d) => ids.has(d.ogId));
}

export async function searchSmartGroups(): Promise<SmartGroup[]> {
  await new Promise((r) => setTimeout(r, 100));
  return FAKE_SGS;
}

export async function getSmartGroup(id: number): Promise<SmartGroup | null> {
  return FAKE_SGS.find((s) => s.id === id) ?? null;
}

export async function getSmartGroupDevices(id: number): Promise<Device[]> {
  await new Promise((r) => setTimeout(r, 200));
  // Return random subset of fake devices keyed by sg id
  const seed = id % FAKE_DEVICES.length;
  return FAKE_DEVICES.slice(0, Math.max(1, Math.min(FAKE_DEVICES.length, seed + 3)));
}

export async function addDevicesToSmartGroup(
  _sgId: number,
  deviceIds: number[]
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 500));
  return { total: deviceIds.length, accepted: deviceIds.length, failed: 0, errors: [] };
}

export async function removeDevicesFromSmartGroup(
  _sgId: number,
  deviceIds: number[]
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 500));
  return { total: deviceIds.length, accepted: deviceIds.length, failed: 0, errors: [] };
}

// Updated app assignment (apps go to smart groups, not devices)
export async function assignAppToSmartGroup(
  _appId: number,
  smartGroupIds: number[],
  _pushMode: AppPushMode
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 600));
  return { total: smartGroupIds.length, accepted: smartGroupIds.length, failed: 0, errors: [] };
}

// Profile install per-device using POST /api/mdm/profiles/{id}/install with {SerialNumber}
export async function installProfileOnDevices(
  _profileId: number,
  serialNumbers: string[]
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 700));
  return { total: serialNumbers.length, accepted: serialNumbers.length, failed: 0, errors: [] };
}

export async function removeProfileFromDevices(
  _profileId: number,
  serialNumbers: string[]
): Promise<BulkActionResult> {
  await new Promise((r) => setTimeout(r, 600));
  return { total: serialNumbers.length, accepted: serialNumbers.length, failed: 0, errors: [] };
}

// -- Raw endpoint runner (Library tab mock) --

export async function runRawEndpoint(req: {
  method: string;
  path: string;
  body?: unknown;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  await new Promise((r) => setTimeout(r, 300));
  // Mock: echo the request shape with a fake-success response shape.
  return {
    ok: true,
    status: 200,
    body: {
      _mock: true,
      message: "Mock response — wire the Rust runner to call against your real tenant.",
      request: req,
    },
  };
}
