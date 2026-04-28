use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{App, AppSearchResponse, BulkActionResult};
use crate::error::AppError;
use crate::state::AppState;

/// Wraps `GET /api/mam/apps/search`. Returns internal apps in the active
/// OG (or tenant root if scope is unset). MAM endpoints accept the same
/// `locationgroupid` filter as MDM.
#[tauri::command]
pub async fn get_apps(
    state: State<'_, AppState>,
    og_id: Option<i64>,
) -> Result<Vec<App>, AppError> {
    let client = WS1Client::from_state(&state).await?;
    let path = match og_id {
        Some(id) => format!(
            "/api/mam/apps/search?locationgroupid={}&pagesize=500",
            id
        ),
        None => "/api/mam/apps/search?pagesize=500".to_string(),
    };
    let resp: AppSearchResponse = client.get(&path).await?;
    Ok(resp
        .application
        .unwrap_or_default()
        .into_iter()
        .map(App::from)
        .collect())
}

/// Wraps `POST /api/mam/apps/internal/{appId}/assignments` with body
/// `{"SmartGroupIds":[...], "DeploymentParameters":{"PushMode":"Auto|OnDemand"}}`.
/// Confirmed via AirWatchImporter (jprichards) production script.
/// WS1 has no direct device-targeting endpoint for app assignment.
#[tauri::command]
pub async fn assign_app_to_smart_group(
    state: State<'_, AppState>,
    app_id: i64,
    smart_group_ids: Vec<i64>,
    push_mode: String,
) -> Result<BulkActionResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let path = format!("/api/mam/apps/internal/{}/assignments", app_id);
    let body = serde_json::json!({
        "SmartGroupIds": smart_group_ids,
        "DeploymentParameters": {
            "PushMode": push_mode
        }
    });

    let mut result = BulkActionResult {
        total: smart_group_ids.len() as i32,
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
