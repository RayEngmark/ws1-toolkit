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

/// Add devices to a smart group's manual additions list.
///
/// Per `mdmv1` spec, the only documented modification path for a smart group
/// is `PUT /api/mdm/smartgroups/{id}` (full update). The earlier
/// `POST /smartgroups/{id}/update` we used was from PyVMwareAirWatch — it
/// works on some tenants but isn't in the bundled spec, so we don't rely on
/// it. Implementation is read-modify-write:
///   1. GET /smartgroups/{id} to get the full current state.
///   2. Append `{Id: "<deviceId>"}` entries to `DeviceAdditions`.
///   3. Strip server-computed count fields (`Devices`, `Assignments`,
///      `Exclusions`) the PUT body schema doesn't accept.
///   4. PUT it back.
#[tauri::command]
pub async fn add_devices_to_smart_group(
    state: State<'_, AppState>,
    smart_group_id: i64,
    device_ids: Vec<i64>,
) -> Result<BulkActionResult, AppError> {
    update_sg_membership(state, smart_group_id, device_ids, "DeviceAdditions").await
}

/// Add devices to a smart group's exclusions list. Same read-modify-write
/// flow as `add_devices_to_smart_group`, just mutating `DeviceExclusions`.
#[tauri::command]
pub async fn remove_devices_from_smart_group(
    state: State<'_, AppState>,
    smart_group_id: i64,
    device_ids: Vec<i64>,
) -> Result<BulkActionResult, AppError> {
    update_sg_membership(state, smart_group_id, device_ids, "DeviceExclusions").await
}

async fn update_sg_membership(
    state: State<'_, AppState>,
    smart_group_id: i64,
    device_ids: Vec<i64>,
    list_field: &str,
) -> Result<BulkActionResult, AppError> {
    let total = device_ids.len() as i32;
    if device_ids.is_empty() {
        return Ok(BulkActionResult {
            total: 0,
            accepted: 0,
            failed: 0,
            errors: Vec::new(),
        });
    }

    let client = WS1Client::from_state(&state).await?;
    let path = format!("/api/mdm/smartgroups/{}", smart_group_id);

    // 1. Fetch current SG state. Keep raw so we round-trip every field
    //    intact and don't drop properties the spec doesn't enumerate
    //    (real WS1 responses sometimes include keys beyond the schema).
    let mut sg: serde_json::Value = client.get(&path).await?;

    // 2. Strip read-only count fields. The PUT body schema (per
    //    SmartGroupEditV1Model) does not include `Devices`/`Assignments`/
    //    `Exclusions` — sending them risks 400 on stricter tenants.
    if let Some(obj) = sg.as_object_mut() {
        obj.remove("Devices");
        obj.remove("Assignments");
        obj.remove("Exclusions");
    }

    // 3. Mutate the requested list. SmartGroupDevice.Id is a string per the
    //    spec, so stringify the numeric ids. Skip duplicates so a re-run is
    //    idempotent rather than producing a 400 from "device already added".
    let arr_obj = sg
        .get_mut(list_field)
        .ok_or_else(|| AppError::Api(format!("SG response missing `{}` field", list_field)))?;
    let arr = arr_obj
        .as_array_mut()
        .ok_or_else(|| AppError::Api(format!("`{}` is not an array", list_field)))?;

    for id in &device_ids {
        let id_str = id.to_string();
        let already = arr.iter().any(|d| {
            d.get("Id")
                .and_then(|v| v.as_str())
                .map(|s| s == id_str)
                .unwrap_or(false)
        });
        if !already {
            arr.push(serde_json::json!({ "Id": id_str }));
        }
    }

    // 4. PUT the full body back. WS1 returns 204 on success.
    let mut result = BulkActionResult {
        total,
        accepted: 0,
        failed: 0,
        errors: Vec::new(),
    };
    match client.put_no_body(&path, &sg).await {
        Ok(()) => result.accepted = total,
        Err(e) => {
            result.failed = total;
            result.errors.push(e.to_string());
        }
    }
    Ok(result)
}
