use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{BulkActionResult, BulkResponse, Tag, TagEntry, TagSearchResponse};
use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub async fn get_tags(
    state: State<'_, AppState>,
    og_id: i64,
) -> Result<Vec<Tag>, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let path = format!("/api/system/groups/{}/tags", og_id);
    let resp: TagSearchResponse = client.get(&path).await?;

    let tags: Vec<Tag> = resp
        .tags
        .unwrap_or_default()
        .into_iter()
        .map(Tag::from)
        .collect();

    Ok(tags)
}

#[tauri::command]
pub async fn add_tags_to_devices(
    state: State<'_, AppState>,
    tag_id: i64,
    device_ids: Vec<i64>,
) -> Result<BulkActionResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let path = format!("/api/mdm/tags/{}/adddevices", tag_id);
    let body = serde_json::json!({
        "BulkValues": {
            "Value": device_ids.iter().map(|id| id.to_string()).collect::<Vec<_>>()
        }
    });
    let total = device_ids.len() as i32;

    match client.post::<BulkResponse>(&path, &body).await {
        Ok(resp) => Ok(resp.into_action_result(total)),
        Err(e) => Ok(BulkActionResult {
            total,
            accepted: 0,
            failed: total,
            errors: vec![e.to_string()],
        }),
    }
}

/// Wraps `POST /api/mdm/tags/addtag` (or PUT to /api/mdm/tags/{id} depending on
/// tenant version). Body shape based on observed WS1 API help:
/// `{"TagName": "...", "LocationGroupId": <ogId>, "TagType": 1}`.
/// Note: tenant-specific. Validate against /api/help on first use.
#[tauri::command]
pub async fn create_tag(
    state: State<'_, AppState>,
    name: String,
    og_id: i64,
) -> Result<Tag, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let body = serde_json::json!({
        "TagName": name,
        "LocationGroupId": og_id,
        "TagType": 1
    });

    let entry: TagEntry = client.post("/api/mdm/tags/addtag", &body).await?;
    Ok(Tag::from(entry))
}

#[tauri::command]
pub async fn remove_tags_from_devices(
    state: State<'_, AppState>,
    tag_id: i64,
    device_ids: Vec<i64>,
) -> Result<BulkActionResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let path = format!("/api/mdm/tags/{}/removedevices", tag_id);
    let body = serde_json::json!({
        "BulkValues": {
            "Value": device_ids.iter().map(|id| id.to_string()).collect::<Vec<_>>()
        }
    });
    let total = device_ids.len() as i32;

    match client.post::<BulkResponse>(&path, &body).await {
        Ok(resp) => Ok(resp.into_action_result(total)),
        Err(e) => Ok(BulkActionResult {
            total,
            accepted: 0,
            failed: total,
            errors: vec![e.to_string()],
        }),
    }
}
