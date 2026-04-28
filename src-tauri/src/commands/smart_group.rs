use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{
    BulkActionResult, Device, DeviceSearchResponse, SmartGroup, SmartGroupSearchResponse,
};
use crate::error::AppError;
use crate::state::AppState;

/// Wraps `GET /api/mdm/smartgroups/search`.
/// Optional params: name, organizationgroupid, managedbyorganizationgroupid,
/// orderby, page, pagesize. The frontend passes the active OG scope so the
/// list reflects the operator's current OG selection.
#[tauri::command]
pub async fn search_smart_groups(
    state: State<'_, AppState>,
    og_id: Option<i64>,
) -> Result<Vec<SmartGroup>, AppError> {
    let client = WS1Client::from_state(&state).await?;
    let path = match og_id {
        Some(id) => format!(
            "/api/mdm/smartgroups/search?organizationgroupid={}&pagesize=500",
            id
        ),
        None => "/api/mdm/smartgroups/search?pagesize=500".to_string(),
    };
    let resp: SmartGroupSearchResponse = client.get(&path).await?;
    Ok(resp
        .smart_groups
        .unwrap_or_default()
        .into_iter()
        .map(SmartGroup::from)
        .collect())
}

/// Wraps `GET /api/mdm/smartgroups/{id}`. Returns full SG details.
#[tauri::command]
pub async fn get_smart_group(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Option<SmartGroup>, AppError> {
    let client = WS1Client::from_state(&state).await?;
    let path = format!("/api/mdm/smartgroups/{}", id);
    let entry = client
        .get::<crate::api::types::SmartGroupEntry>(&path)
        .await?;
    Ok(Some(SmartGroup::from(entry)))
}

/// Wraps `GET /api/mdm/smartgroups/{id}/devices`. Returns devices that are members
/// of the smart group (criteria-matched + manually-added, minus exclusions).
#[tauri::command]
pub async fn get_smart_group_devices(
    state: State<'_, AppState>,
    id: i64,
) -> Result<Vec<Device>, AppError> {
    let client = WS1Client::from_state(&state).await?;
    let path = format!("/api/mdm/smartgroups/{}/devices", id);
    let resp: DeviceSearchResponse = client.get(&path).await?;
    Ok(resp
        .devices
        .unwrap_or_default()
        .into_iter()
        .map(Device::from)
        .collect())
}

/// Wraps `POST /api/mdm/smartgroups/{id}/update` with body
/// `{"DeviceAdditions":[{"Id":"123"}, ...]}`.
/// Confirmed via PyVMwareAirWatch source.
#[tauri::command]
pub async fn add_devices_to_smart_group(
    state: State<'_, AppState>,
    smart_group_id: i64,
    device_ids: Vec<i64>,
) -> Result<BulkActionResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let additions: Vec<serde_json::Value> = device_ids
        .iter()
        .map(|id| serde_json::json!({ "Id": id.to_string() }))
        .collect();

    let path = format!("/api/mdm/smartgroups/{}/update", smart_group_id);
    let body = serde_json::json!({ "DeviceAdditions": additions });

    let mut result = BulkActionResult {
        total: device_ids.len() as i32,
        accepted: 0,
        failed: 0,
        errors: Vec::new(),
    };

    match client.post_no_body(&path, &body).await {
        Ok(()) => result.accepted = result.total,
        Err(e) => {
            result.failed = result.total;
            result.errors.push(e.to_string());
        }
    }
    Ok(result)
}

/// Wraps `POST /api/mdm/smartgroups/{id}/update` with body
/// `{"DeviceExclusions":[{"Id":"123"}, ...]}`.
#[tauri::command]
pub async fn remove_devices_from_smart_group(
    state: State<'_, AppState>,
    smart_group_id: i64,
    device_ids: Vec<i64>,
) -> Result<BulkActionResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let exclusions: Vec<serde_json::Value> = device_ids
        .iter()
        .map(|id| serde_json::json!({ "Id": id.to_string() }))
        .collect();

    let path = format!("/api/mdm/smartgroups/{}/update", smart_group_id);
    let body = serde_json::json!({ "DeviceExclusions": exclusions });

    let mut result = BulkActionResult {
        total: device_ids.len() as i32,
        accepted: 0,
        failed: 0,
        errors: Vec::new(),
    };

    match client.post_no_body(&path, &body).await {
        Ok(()) => result.accepted = result.total,
        Err(e) => {
            result.failed = result.total;
            result.errors.push(e.to_string());
        }
    }
    Ok(result)
}
