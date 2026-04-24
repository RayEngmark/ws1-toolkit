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
