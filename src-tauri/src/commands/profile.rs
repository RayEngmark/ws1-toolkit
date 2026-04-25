use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{BulkActionResult, Profile, ProfileSearchResponse};
use crate::error::AppError;
use crate::state::AppState;

/// Wraps `GET /api/mdm/profiles/search`. Confirmed via PyVMwareAirWatch + multiple
/// production scripts. Supports filters via query params: type, profilename,
/// organizationgroupid, platform, status, ownership.
#[tauri::command]
pub async fn get_profiles(state: State<'_, AppState>) -> Result<Vec<Profile>, AppError> {
    let client = WS1Client::from_state(&state).await?;
    let resp: ProfileSearchResponse = client.get("/api/mdm/profiles/search?status=Active").await?;
    Ok(resp
        .profiles
        .unwrap_or_default()
        .into_iter()
        .map(Profile::from)
        .collect())
}

/// Wraps `POST /api/mdm/profiles/{profileId}/install` with body `{"SerialNumber": "..."}`.
/// Confirmed via Gusto IT, MrTechGadget, ionTomorrow, helmlingp scripts.
/// One call per device — sequential with small delay to avoid throttling.
#[tauri::command]
pub async fn install_profile_on_devices(
    state: State<'_, AppState>,
    profile_id: i64,
    serial_numbers: Vec<String>,
) -> Result<BulkActionResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let mut result = BulkActionResult {
        total: serial_numbers.len() as i32,
        accepted: 0,
        failed: 0,
        errors: Vec::new(),
    };

    let path = format!("/api/mdm/profiles/{}/install", profile_id);
    for serial in &serial_numbers {
        let body = serde_json::json!({ "SerialNumber": serial });
        match client.post_no_body(&path, &body).await {
            Ok(()) => result.accepted += 1,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{}: {}", serial, e));
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(80)).await;
    }
    Ok(result)
}

/// Wraps `POST /api/mdm/profiles/{profileId}/remove` with body `{"SerialNumber": "..."}`.
/// Confirmed via Gusto IT script.
#[tauri::command]
pub async fn remove_profile_from_devices(
    state: State<'_, AppState>,
    profile_id: i64,
    serial_numbers: Vec<String>,
) -> Result<BulkActionResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let mut result = BulkActionResult {
        total: serial_numbers.len() as i32,
        accepted: 0,
        failed: 0,
        errors: Vec::new(),
    };

    let path = format!("/api/mdm/profiles/{}/remove", profile_id);
    for serial in &serial_numbers {
        let body = serde_json::json!({ "SerialNumber": serial });
        match client.post_no_body(&path, &body).await {
            Ok(()) => result.accepted += 1,
            Err(e) => {
                result.failed += 1;
                result.errors.push(format!("{}: {}", serial, e));
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(80)).await;
    }
    Ok(result)
}
