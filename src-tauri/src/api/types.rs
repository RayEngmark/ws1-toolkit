use serde::{Deserialize, Serialize};

// -- Device types --

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct DeviceSearchResponse {
    pub devices: Option<Vec<DeviceSummary>>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
    pub total: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct DeviceSummary {
    pub id: Option<IdValue>,
    pub serial_number: Option<String>,
    pub device_friendly_name: Option<String>,
    pub user_name: Option<String>,
    pub model: Option<String>,
    pub operating_system: Option<String>,
    pub compliance_status: Option<String>,
    pub last_seen: Option<String>,
    pub platform: Option<String>,
    pub ownership: Option<String>,
    pub enrollment_status: Option<String>,
    #[serde(rename = "LocationGroupName")]
    pub location_group_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct IdValue {
    pub value: Option<i64>,
}

// Flattened device for frontend consumption
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub id: i64,
    pub serial_number: String,
    pub friendly_name: String,
    pub user_name: String,
    pub model: String,
    pub os: String,
    pub platform: String,
    pub compliance_status: String,
    pub last_seen: String,
    pub ownership: String,
    pub enrollment_status: String,
    pub og_name: String,
}

impl From<DeviceSummary> for Device {
    fn from(d: DeviceSummary) -> Self {
        Self {
            id: d.id.and_then(|id| id.value).unwrap_or(0),
            serial_number: d.serial_number.unwrap_or_default(),
            friendly_name: d.device_friendly_name.unwrap_or_default(),
            user_name: d.user_name.unwrap_or_default(),
            model: d.model.unwrap_or_default(),
            os: d.operating_system.unwrap_or_default(),
            platform: d.platform.unwrap_or_default(),
            compliance_status: d.compliance_status.unwrap_or("Unknown".into()),
            last_seen: d.last_seen.unwrap_or_default(),
            ownership: d.ownership.unwrap_or_default(),
            enrollment_status: d.enrollment_status.unwrap_or_default(),
            og_name: d.location_group_name.unwrap_or_default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceSearchResult {
    pub devices: Vec<Device>,
    pub page: i32,
    pub page_size: i32,
    pub total: i32,
}

// -- Tag types --

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct TagSearchResponse {
    pub tags: Option<Vec<TagEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct TagEntry {
    pub id: Option<IdValue>,
    pub tag_name: Option<String>,
    pub tag_type: Option<i32>,
    pub tag_av_assigned: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: i64,
    pub tag_name: String,
    pub device_count: i32,
}

impl From<TagEntry> for Tag {
    fn from(t: TagEntry) -> Self {
        Self {
            id: t.id.and_then(|id| id.value).unwrap_or(0),
            tag_name: t.tag_name.unwrap_or_default(),
            device_count: t.tag_av_assigned.unwrap_or(0),
        }
    }
}

// -- Organization Group types --

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct OGSearchResponse {
    // /api/help/Docs/systemv1 documents the wrapper as `LocationGroups`
    // for /groups/search; older / regional tenants used `OrganizationGroups`.
    // Accept either name to avoid a silent empty list when WS1 ships the
    // other one.
    #[serde(alias = "LocationGroups")]
    pub organization_groups: Option<Vec<OGEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct OGEntry {
    pub id: Option<i64>,
    pub name: Option<String>,
    pub group_id: Option<String>,
    pub location_group_type: Option<String>,
    pub parent_location_group: Option<ParentOG>,
    pub children: Option<Vec<OGEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ParentOG {
    pub id: Option<IdValue>,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrgGroup {
    pub id: i64,
    pub name: String,
    pub group_id: String,
    pub og_type: String,
    pub parent_id: Option<i64>,
    pub children: Vec<OrgGroup>,
}

impl From<OGEntry> for OrgGroup {
    fn from(og: OGEntry) -> Self {
        Self {
            id: og.id.unwrap_or(0),
            name: og.name.unwrap_or_default(),
            group_id: og.group_id.unwrap_or_default(),
            og_type: og.location_group_type.unwrap_or_default(),
            parent_id: og.parent_location_group.and_then(|p| p.id.and_then(|id| id.value)),
            children: og
                .children
                .unwrap_or_default()
                .into_iter()
                .map(OrgGroup::from)
                .collect(),
        }
    }
}

// -- Profile types --

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ProfileSearchResponse {
    pub profiles: Option<Vec<ProfileEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ProfileEntry {
    pub id: Option<IdValue>,
    pub profile_name: Option<String>,
    pub profile_type: Option<String>,
    pub platform: Option<String>,
    pub description: Option<String>,
    pub location_group_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub platform: String,
    pub profile_type: String,
    pub og_name: String,
}

impl From<ProfileEntry> for Profile {
    fn from(p: ProfileEntry) -> Self {
        Self {
            id: p.id.and_then(|id| id.value).unwrap_or(0),
            name: p.profile_name.unwrap_or_default(),
            description: p.description.unwrap_or_default(),
            platform: p.platform.unwrap_or_default(),
            profile_type: p.profile_type.unwrap_or_default(),
            og_name: p.location_group_name.unwrap_or_default(),
        }
    }
}

// -- App types (MAM) --

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct AppSearchResponse {
    pub application: Option<Vec<AppEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct AppEntry {
    pub id: Option<IdValue>,
    pub application_name: Option<String>,
    pub bundle_id: Option<String>,
    pub app_version: Option<String>,
    pub platform: Option<String>,
    pub app_type: Option<String>,
    pub location_group_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct App {
    pub id: i64,
    pub name: String,
    pub bundle_id: String,
    pub version: String,
    pub platform: String,
    pub app_type: String,
    pub og_name: String,
}

impl From<AppEntry> for App {
    fn from(a: AppEntry) -> Self {
        Self {
            id: a.id.and_then(|id| id.value).unwrap_or(0),
            name: a.application_name.unwrap_or_default(),
            bundle_id: a.bundle_id.unwrap_or_default(),
            version: a.app_version.unwrap_or_default(),
            platform: a.platform.unwrap_or_default(),
            app_type: a.app_type.unwrap_or_default(),
            og_name: a.location_group_name.unwrap_or_default(),
        }
    }
}

// -- Smart Group types --

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct SmartGroupSearchResponse {
    pub smart_groups: Option<Vec<SmartGroupEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct SmartGroupEntry {
    // Field names verified against the live tenant spec at
    // /api/help/Docs/mdmv1 → SmartGroupSearchModel.
    #[serde(rename = "SmartGroupID")]
    pub smart_group_id: Option<i64>,
    pub name: Option<String>,
    // Search endpoint returns ManagedByOrganizationGroupId as a *string*
    // (decimal id serialized as text). Alias kept for older tenants where
    // it might come back as a number — serde will accept either.
    pub managed_by_organization_group_id: Option<String>,
    pub managed_by_organization_group_name: Option<String>,
    // Search endpoint uses Devices / Assignments / Exclusions; the
    // single-SG GET uses *Count variants. Accept both via alias so we work
    // on either response shape without falling back silently.
    #[serde(alias = "DeviceCount")]
    pub devices: Option<i32>,
    #[serde(alias = "AppsCount")]
    pub assignments: Option<i32>,
    pub exclusions: Option<i32>,
    // Only present in the single-SG GET — leave as Option, never fabricate.
    pub criteria_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmartGroup {
    pub id: i64,
    pub name: String,
    pub criteria_type: String,
    pub managed_by_og_id: i64,
    pub managed_by_og_name: String,
    pub device_count: i32,
    pub app_count: i32,
    pub profile_count: i32,
}

impl From<SmartGroupEntry> for SmartGroup {
    fn from(s: SmartGroupEntry) -> Self {
        // Conversions surface what the server actually returned. Any field
        // the spec omits passes through as `None` → `unwrap_or_default()`
        // returns the empty/zero default; we deliberately do NOT fabricate
        // a placeholder string ("Unknown" / "None") because the contract
        // says: if WS1 didn't send it, we don't pretend it did.
        Self {
            id: s.smart_group_id.unwrap_or_default(),
            name: s.name.unwrap_or_default(),
            criteria_type: s.criteria_type.unwrap_or_default(),
            // The string-id from the server -> i64 in our typed shape; if
            // the server sent something un-parseable, treat as 0 rather
            // than silently 404 on every action.
            managed_by_og_id: s
                .managed_by_organization_group_id
                .and_then(|s| s.parse().ok())
                .unwrap_or_default(),
            managed_by_og_name: s.managed_by_organization_group_name.unwrap_or_default(),
            device_count: s.devices.unwrap_or_default(),
            app_count: s.assignments.unwrap_or_default(),
            profile_count: 0, // not present in /search response — set 0 unless the single-GET fills it
        }
    }
}

// -- Bulk action types --

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkActionResult {
    pub total: i32,
    pub accepted: i32,
    pub failed: i32,
    pub errors: Vec<String>,
}

// -- Connection test --

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionInfo {
    pub connected: bool,
    pub tenant_name: Option<String>,
    pub version: Option<String>,
    pub error: Option<String>,
}

// -- OAuth token response --

#[derive(Debug, Deserialize)]
pub struct OAuthTokenResponse {
    pub access_token: String,
    pub expires_in: Option<u64>,
    pub token_type: Option<String>,
}
