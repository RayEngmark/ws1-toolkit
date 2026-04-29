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
    pub id: Option<FlexId>,
    pub uuid: Option<String>,
    pub udid: Option<String>,
    pub serial_number: Option<String>,
    pub mac_address: Option<String>,
    pub imei: Option<String>,
    pub asset_number: Option<String>,
    pub device_friendly_name: Option<String>,
    pub user_name: Option<String>,
    pub model: Option<String>,
    pub operating_system: Option<String>,
    pub compliance_status: Option<String>,
    pub last_seen: Option<String>,
    pub platform: Option<String>,
    pub ownership: Option<String>,
    pub enrollment_status: Option<String>,
    #[serde(rename = "LocationGroupId")]
    pub location_group_id: Option<FlexId>,
    #[serde(rename = "LocationGroupName")]
    pub location_group_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct IdValue {
    pub value: Option<i64>,
}

/// WS1 returns `Id` either as a bare integer or as `{ Value: <int> }`
/// depending on the endpoint and tenant version. Accept both shapes
/// without falling back silently to 0 — `extract_id` exposes whatever
/// the server actually sent.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FlexId {
    Plain(i64),
    Wrapped(IdValue),
}

pub fn extract_id(f: Option<FlexId>) -> i64 {
    match f {
        Some(FlexId::Plain(n)) => n,
        Some(FlexId::Wrapped(IdValue { value })) => value.unwrap_or_default(),
        None => 0,
    }
}

// Flattened device for frontend consumption. Field set must mirror the TS
// Device contract in src/ipc/contracts.ts — anything missing here surfaces
// as undefined on the JS side and breaks the typed UI. Per the data-integrity
// rule: never substitute placeholder strings for missing fields; pass empty
// through and let the renderer show "—".
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub id: i64,
    pub uuid: String,
    pub udid: String,
    pub serial_number: String,
    pub mac_address: String,
    pub imei: String,
    pub asset_number: String,
    pub friendly_name: String,
    pub user_name: String,
    pub model: String,
    pub os: String,
    pub platform: String,
    pub compliance_status: String,
    pub last_seen: String,
    pub ownership: String,
    pub enrollment_status: String,
    pub og_id: i64,
    pub og_name: String,
}

impl From<DeviceSummary> for Device {
    fn from(d: DeviceSummary) -> Self {
        Self {
            id: extract_id(d.id),
            uuid: d.uuid.unwrap_or_default(),
            udid: d.udid.unwrap_or_default(),
            serial_number: d.serial_number.unwrap_or_default(),
            mac_address: d.mac_address.unwrap_or_default(),
            imei: d.imei.unwrap_or_default(),
            asset_number: d.asset_number.unwrap_or_default(),
            friendly_name: d.device_friendly_name.unwrap_or_default(),
            user_name: d.user_name.unwrap_or_default(),
            model: d.model.unwrap_or_default(),
            os: d.operating_system.unwrap_or_default(),
            platform: d.platform.unwrap_or_default(),
            compliance_status: d.compliance_status.unwrap_or_default(),
            last_seen: d.last_seen.unwrap_or_default(),
            ownership: d.ownership.unwrap_or_default(),
            enrollment_status: d.enrollment_status.unwrap_or_default(),
            og_id: extract_id(d.location_group_id),
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
    pub id: Option<FlexId>,
    pub tag_name: Option<String>,
    pub tag_type: Option<i32>,
    /// Older tenants used `TagAvAssigned`; the systemv1 spec doesn't list a
    /// device-count field at all on the per-OG /groups/{id}/tags response.
    /// Keep the alias so we surface a count when WS1 sends one and zero when
    /// it doesn't — never fabricated.
    #[serde(alias = "TagAvAssigned", alias = "AssignedDeviceCount")]
    pub device_count: Option<i32>,
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
            id: extract_id(t.id),
            tag_name: t.tag_name.unwrap_or_default(),
            device_count: t.device_count.unwrap_or_default(),
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
    pub id: Option<FlexId>,
    pub name: Option<String>,
    pub group_id: Option<String>,
    pub location_group_type: Option<String>,
    pub parent_location_group: Option<ParentOG>,
    pub children: Option<Vec<OGEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ParentOG {
    pub id: Option<FlexId>,
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
            id: extract_id(og.id),
            name: og.name.unwrap_or_default(),
            group_id: og.group_id.unwrap_or_default(),
            og_type: og.location_group_type.unwrap_or_default(),
            parent_id: og.parent_location_group.map(|p| extract_id(p.id)),
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
    // `/api/mdm/profiles/search` v1 / v2 response wraps the list in `ProfileList`
    // (per mdmv2 spec → ProfileSearchResultV2Entity). Older tenants used
    // `Profiles`; newer v3 uses lowercase `profiles`. Accept all three.
    #[serde(rename = "ProfileList", alias = "Profiles", alias = "profiles")]
    pub profiles: Option<Vec<ProfileEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ProfileEntry {
    // v2 `ProfileSearchResultV2Entity` carries the id as `ProfileId`. Older
    // tenants exposed a bare `Id` (sometimes `{ Value: n }`). Accept all three
    // so a v1-fallback tenant doesn't silently land on id=0.
    #[serde(rename = "ProfileId", alias = "Id")]
    pub id: Option<FlexId>,
    pub profile_name: Option<String>,
    pub profile_type: Option<String>,
    pub platform: Option<String>,
    // Not in the v2 spec at all; older surfaces did include it. Keep optional
    // so a missing field surfaces as empty rather than failing the deser.
    pub description: Option<String>,
    // v2 reports the owning OG as `ManagedBy`. The legacy AirWatch shape used
    // `LocationGroupName` — keep that as an alias.
    #[serde(rename = "ManagedBy", alias = "LocationGroupName")]
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
            id: extract_id(p.id),
            name: p.profile_name.unwrap_or_default(),
            description: p.description.unwrap_or_default(),
            platform: p.platform.unwrap_or_default(),
            profile_type: p.profile_type.unwrap_or_default(),
            og_name: p.location_group_name.unwrap_or_default(),
        }
    }
}

// -- Profile assignment (Smart Group binding) --

/// Inline reference to a smart group inside a profile's assignment payload —
/// `AssignedSmartGroups` / `ExcludedSmartGroups` on `GeneralPayloadV2Entity`.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct ProfileAssignedSg {
    pub smart_group_id: Option<FlexId>,
    pub name: Option<String>,
}

/// Top-level wrapper returned by `GET /api/mdm/profiles/{id}` — the v2 spec
/// nests every meaningful field under `General` (the GeneralPayloadV2Entity).
/// We only project the bits we need to round-trip an editassignment: the OG
/// id and the current assigned/excluded smart groups.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct DeviceProfileWrapper {
    pub general: Option<ProfileGeneral>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct ProfileGeneral {
    pub profile_id: Option<FlexId>,
    pub name: Option<String>,
    pub assignment_type: Option<String>,
    #[serde(rename = "ManagedLocationGroupID")]
    pub managed_location_group_id: Option<i64>,
    pub assigned_smart_groups: Option<Vec<ProfileAssignedSg>>,
    pub excluded_smart_groups: Option<Vec<ProfileAssignedSg>>,
}

/// Body sent to `PUT /api/mdm/profiles/resources/editassignment/{id}`. Per
/// spec this is a full *replacement* — passing only the new SG would wipe
/// any existing assignment, so callers must merge with whatever GET returned.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ResourceAssignment {
    pub assignment_type: String,
    #[serde(rename = "ManagedLocationGroupID")]
    pub managed_location_group_id: i64,
    pub assigned_smart_groups: Vec<i64>,
    pub excluded_smart_groups: Vec<i64>,
}

/// Lightweight projection of a profile's current SG assignments, returned
/// to the frontend so the SG detail panel can list which profiles target it
/// and the AssignProfileToSg drawer can show what's already bound.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileAssignment {
    pub profile_id: i64,
    pub assignment_type: String,
    pub managed_og_id: i64,
    pub assigned_sg_ids: Vec<i64>,
    pub excluded_sg_ids: Vec<i64>,
}

// -- App types (MAM) --

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct AppSearchResponse {
    // The MAM apps search response wrapper varies by tenant: most return
    // `Application` (singular), some `Apps`, and the internal-only variant
    // sometimes returns `application` lowercase. We don't bundle a MAM spec,
    // so accept every common shape rather than guess.
    #[serde(
        rename = "Application",
        alias = "Apps",
        alias = "application",
        alias = "InternalApplications"
    )]
    pub application: Option<Vec<AppEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct AppEntry {
    pub id: Option<FlexId>,
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
            id: extract_id(a.id),
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
    pub smart_group_id: Option<FlexId>,
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
            id: extract_id(s.smart_group_id),
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

/// WS1 bulk endpoints (e.g. `/api/mdm/tags/{id}/adddevices`) return HTTP 200
/// even when individual items in the bulk fail. The body carries the actual
/// per-item outcome — drop it on the floor and a wholesale rejection looks
/// like a clean success in the UI. Mirrors `BulkResponse` from `mdmv1.json`.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct BulkResponse {
    pub total_items: Option<i32>,
    pub accepted_items: Option<i32>,
    pub failed_items: Option<i32>,
    pub faults: Option<Faults>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct Faults {
    pub fault: Option<Vec<Fault>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "PascalCase")]
pub struct Fault {
    pub error_code: Option<i32>,
    pub item_value: Option<String>,
    pub message: Option<String>,
    pub activity_id: Option<String>,
}

impl BulkResponse {
    /// Project a WS1 BulkResponse onto the frontend-facing BulkActionResult.
    /// `requested` is what we sent — used as a fallback when WS1 omits totals.
    pub fn into_action_result(self, requested: i32) -> BulkActionResult {
        let total = self.total_items.unwrap_or(requested);
        let accepted = self.accepted_items.unwrap_or(0);
        let failed = self
            .failed_items
            .unwrap_or_else(|| (total - accepted).max(0));
        let errors = self
            .faults
            .and_then(|f| f.fault)
            .unwrap_or_default()
            .into_iter()
            .map(|f| match (f.item_value, f.error_code, f.message) {
                (Some(item), Some(code), Some(msg)) => format!("{} [{}]: {}", item, code, msg),
                (Some(item), None, Some(msg)) => format!("{}: {}", item, msg),
                (None, Some(code), Some(msg)) => format!("[{}] {}", code, msg),
                (Some(item), _, None) => item,
                (_, _, Some(msg)) => msg,
                _ => "unspecified WS1 fault".to_string(),
            })
            .collect();
        BulkActionResult {
            total,
            accepted,
            failed,
            errors,
        }
    }
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
