use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{BulkActionResult, Tag, TagSearchResponse};
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

    let mut result = BulkActionResult {
        total: device_ids.len() as i32,
        accepted: 0,
        failed: 0,
        errors: Vec::new(),
    };

    match client.post_no_body(&path, &body).await {
        Ok(()) => {
            result.accepted = result.total;
        }
        Err(e) => {
            result.failed = result.total;
            result.errors.push(e.to_string());
        }
    }

    Ok(result)
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

    let mut result = BulkActionResult {
        total: device_ids.len() as i32,
        accepted: 0,
        failed: 0,
        errors: Vec::new(),
    };

    match client.post_no_body(&path, &body).await {
        Ok(()) => {
            result.accepted = result.total;
        }
        Err(e) => {
            result.failed = result.total;
            result.errors.push(e.to_string());
        }
    }

    Ok(result)
}
