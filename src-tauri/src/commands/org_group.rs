use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{BulkActionResult, OGSearchResponse, OrgGroup};
use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub async fn search_org_groups(
    state: State<'_, AppState>,
) -> Result<Vec<OrgGroup>, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let path = "/api/system/groups/search?orderby=name";
    let resp: OGSearchResponse = client.get(path).await?;

    let groups: Vec<OrgGroup> = resp
        .organization_groups
        .unwrap_or_default()
        .into_iter()
        .map(OrgGroup::from)
        .collect();

    Ok(groups)
}

#[tauri::command]
pub async fn get_og_children(
    state: State<'_, AppState>,
    og_id: i64,
) -> Result<Vec<OrgGroup>, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let path = format!("/api/system/groups/{}/children", og_id);
    let resp: serde_json::Value = client.get(&path).await?;

    // Parse children from the response
    let children = if let Some(arr) = resp.as_array() {
        arr.iter()
            .filter_map(|v| {
                let id = v.get("Id")?.as_i64()?;
                let name = v.get("Name")?.as_str()?.to_string();
                let group_id = v.get("GroupId")?.as_str().unwrap_or("").to_string();
                let og_type = v.get("LocationGroupType")?.as_str().unwrap_or("").to_string();
                Some(OrgGroup {
                    id,
                    name,
                    group_id,
                    og_type,
                    parent_id: Some(og_id),
                    children: Vec::new(),
                })
            })
            .collect()
    } else {
        Vec::new()
    };

    Ok(children)
}

#[tauri::command]
pub async fn move_device_to_og(
    state: State<'_, AppState>,
    device_id: i64,
    target_og_id: i64,
) -> Result<(), AppError> {
    let client = WS1Client::from_state(&state).await?;

    let path = format!(
        "/api/mdm/devices/{}/commands/changeorganizationgroup/{}",
        device_id, target_og_id
    );

    client.post_no_body(&path, &serde_json::json!({})).await
}

#[tauri::command]
pub async fn bulk_move_devices(
    state: State<'_, AppState>,
    device_ids: Vec<i64>,
    target_og_id: i64,
) -> Result<BulkActionResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let mut result = BulkActionResult {
        total: device_ids.len() as i32,
        accepted: 0,
        failed: 0,
        errors: Vec::new(),
    };

    for device_id in &device_ids {
        let path = format!(
            "/api/mdm/devices/{}/commands/changeorganizationgroup/{}",
            device_id, target_og_id
        );

        match client.post_no_body(&path, &serde_json::json!({})).await {
            Ok(()) => result.accepted += 1,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("Device {}: {}", device_id, e));
            }
        }

        // Small delay between calls to avoid rate limiting
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }

    Ok(result)
}
