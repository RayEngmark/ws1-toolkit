use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{
    BulkActionResult, Device, DeviceSearchResponse, OGSearchResponse, OrgGroup,
};
use crate::error::AppError;
use crate::state::AppState;

/// `/api/system/groups/search` returns a *flat* list — there's no children
/// nesting on this endpoint regardless of `orderby`. We rebuild the tree
/// here from each entry's `ParentLocationGroup.Id`, returning only roots
/// (entries whose parent isn't present in the result, or who have no parent).
/// One network call instead of recursive /children fetches.
#[tauri::command]
pub async fn search_org_groups(
    state: State<'_, AppState>,
) -> Result<Vec<OrgGroup>, AppError> {
    let client = WS1Client::from_state(&state).await?;

    // pagesize=500 is the documented max for /groups/search. Multi-tenant
    // estates rarely exceed that; if they do, we'd paginate here. Keep simple.
    let path = "/api/system/groups/search?pagesize=500&orderby=name";
    let resp: OGSearchResponse = client.get(path).await?;

    let flat: Vec<OrgGroup> = resp
        .organization_groups
        .unwrap_or_default()
        .into_iter()
        .map(OrgGroup::from)
        .collect();

    // Reconstruct the tree. by_id owns the entries; child_map maps each
    // parent id to its child ids so we can DFS from each root and attach
    // children regardless of source order.
    use std::collections::HashMap;
    let mut by_id: HashMap<i64, OrgGroup> = HashMap::new();
    let mut child_map: HashMap<i64, Vec<i64>> = HashMap::new();
    let mut all_ids: Vec<i64> = Vec::with_capacity(flat.len());
    for og in flat {
        if let Some(pid) = og.parent_id {
            child_map.entry(pid).or_default().push(og.id);
        }
        all_ids.push(og.id);
        by_id.insert(og.id, og);
    }

    // Roots = any node whose parent isn't in our result set (or has no parent).
    let mut root_ids: Vec<i64> = Vec::new();
    for id in &all_ids {
        let og = by_id.get(id).expect("present");
        let is_root = match og.parent_id {
            Some(pid) => !by_id.contains_key(&pid) || pid == og.id,
            None => true,
        };
        if is_root {
            root_ids.push(*id);
        }
    }

    fn build(
        id: i64,
        by_id: &mut HashMap<i64, OrgGroup>,
        child_map: &HashMap<i64, Vec<i64>>,
    ) -> OrgGroup {
        let mut og = by_id.remove(&id).expect("entry");
        og.children.clear();
        if let Some(child_ids) = child_map.get(&id) {
            for cid in child_ids {
                if by_id.contains_key(cid) {
                    og.children.push(build(*cid, by_id, child_map));
                }
            }
        }
        og.children
            .sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        og
    }

    let mut roots: Vec<OrgGroup> = root_ids
        .iter()
        .map(|id| build(*id, &mut by_id, &child_map))
        .collect();
    roots.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(roots)
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

/// Wraps `GET /api/mdm/devices/search?lgid={ogId}&pagesize=500`.
/// `lgid` is the documented filter for "limit search to this OG"
/// (per /api/help/Docs/mdmv1 → /devices/search). Whether children are
/// included is controlled by the tenant's `Include child OGs` config —
/// we don't override it here.
#[tauri::command]
pub async fn get_devices_in_og(
    state: State<'_, AppState>,
    og_id: i64,
) -> Result<Vec<Device>, AppError> {
    let client = WS1Client::from_state(&state).await?;
    let path = format!(
        "/api/mdm/devices/search?lgid={}&pagesize=500",
        og_id
    );
    let resp: DeviceSearchResponse = client.get(&path).await?;
    Ok(resp
        .devices
        .unwrap_or_default()
        .into_iter()
        .map(Device::from)
        .collect())
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

    // PUT per the spec — /devices/{id}/commands/changeorganizationgroup/{ogid}
    // returns 405 Method Not Allowed on POST.
    client.put_no_body(&path, &serde_json::json!({})).await
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

        match client.put_no_body(&path, &serde_json::json!({})).await {
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
