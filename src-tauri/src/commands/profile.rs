use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{
    extract_id, BulkActionResult, DeviceProfileWrapper, Profile, ProfileAssignment,
    ProfileSearchResponse, ResourceAssignment,
};
use crate::error::AppError;
use crate::state::AppState;

/// Wraps `GET /api/mdm/profiles/search`. Filters via query params: type,
/// profilename, organizationgroupid, platform, status, ownership.
/// The frontend passes the active OG scope so the listing reflects the
/// operator's current OG selection. `status` is intentionally NOT filtered —
/// some tenants store enum codes rather than the literal "Active" string;
/// surfacing every profile is the safe default and the UI can filter client-side.
#[tauri::command]
pub async fn get_profiles(
    state: State<'_, AppState>,
    og_id: Option<i64>,
) -> Result<Vec<Profile>, AppError> {
    let client = WS1Client::from_state(&state).await?;
    let path = match og_id {
        Some(id) => format!(
            "/api/mdm/profiles/search?organizationgroupid={}&pagesize=500",
            id
        ),
        None => "/api/mdm/profiles/search?pagesize=500".to_string(),
    };
    let resp: ProfileSearchResponse = client.get(&path).await?;
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

async fn fetch_profile_assignment(
    client: &WS1Client<'_>,
    profile_id: i64,
) -> Result<ProfileAssignment, AppError> {
    let path = format!("/api/mdm/profiles/{}", profile_id);
    let wrapper: DeviceProfileWrapper = client.get(&path).await?;
    let general = wrapper.general.unwrap_or_default();
    Ok(ProfileAssignment {
        profile_id: extract_id(general.profile_id).max(profile_id),
        assignment_type: general.assignment_type.unwrap_or_else(|| "Auto".into()),
        managed_og_id: general.managed_location_group_id.unwrap_or(0),
        assigned_sg_ids: general
            .assigned_smart_groups
            .unwrap_or_default()
            .into_iter()
            .map(|s| extract_id(s.smart_group_id))
            .filter(|id| *id != 0)
            .collect(),
        excluded_sg_ids: general
            .excluded_smart_groups
            .unwrap_or_default()
            .into_iter()
            .map(|s| extract_id(s.smart_group_id))
            .filter(|id| *id != 0)
            .collect(),
    })
}

async fn put_profile_assignment(
    client: &WS1Client<'_>,
    a: &ProfileAssignment,
) -> Result<(), AppError> {
    let body = ResourceAssignment {
        assignment_type: a.assignment_type.clone(),
        managed_location_group_id: a.managed_og_id,
        assigned_smart_groups: a.assigned_sg_ids.clone(),
        excluded_smart_groups: a.excluded_sg_ids.clone(),
    };
    let path = format!("/api/mdm/profiles/resources/editassignment/{}", a.profile_id);
    client
        .put_no_body(&path, &serde_json::to_value(&body)?)
        .await
}

/// Returns the profile's current Smart Group assignment state — needed both
/// by the SG detail panel (to render which profiles already target it) and
/// by the assign-profile-to-SG drawer (to merge a new SG into the list
/// instead of replacing it). Reads `GET /api/mdm/profiles/{id}` (v2) and
/// projects the `General.AssignedSmartGroups` / `ExcludedSmartGroups` arrays.
#[tauri::command]
pub async fn get_profile_assignment(
    state: State<'_, AppState>,
    profile_id: i64,
) -> Result<ProfileAssignment, AppError> {
    let client = WS1Client::from_state(&state).await?;
    fetch_profile_assignment(&client, profile_id).await
}

/// Bind a smart group to a profile's assignment list. Idempotent — if the
/// SG is already assigned, this is a no-op rather than a duplicate. Uses
/// the documented `PUT /api/mdm/profiles/resources/editassignment/{id}`
/// flow which replaces the entire assignment payload, so we GET the current
/// state first and merge.
#[tauri::command]
pub async fn assign_profile_to_smart_group(
    state: State<'_, AppState>,
    profile_id: i64,
    smart_group_id: i64,
) -> Result<ProfileAssignment, AppError> {
    let client = WS1Client::from_state(&state).await?;
    let mut current = fetch_profile_assignment(&client, profile_id).await?;

    if !current.assigned_sg_ids.contains(&smart_group_id) {
        current.assigned_sg_ids.push(smart_group_id);
    }
    // Adding to assigned + excluded simultaneously is contradictory; if the
    // SG was previously excluded, drop it from the exclusions when binding.
    current.excluded_sg_ids.retain(|id| *id != smart_group_id);

    put_profile_assignment(&client, &current).await?;
    Ok(current)
}

/// Inverse of `assign_profile_to_smart_group` — drops the SG from the
/// profile's assigned list (no-op if it wasn't there).
#[tauri::command]
pub async fn unassign_profile_from_smart_group(
    state: State<'_, AppState>,
    profile_id: i64,
    smart_group_id: i64,
) -> Result<ProfileAssignment, AppError> {
    let client = WS1Client::from_state(&state).await?;
    let mut current = fetch_profile_assignment(&client, profile_id).await?;

    let before = current.assigned_sg_ids.len();
    current.assigned_sg_ids.retain(|id| *id != smart_group_id);
    if current.assigned_sg_ids.len() == before {
        return Ok(current);
    }
    put_profile_assignment(&client, &current).await?;
    Ok(current)
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
