use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{Device, DeviceSearchResponse, DeviceSearchResult, DeviceSummary};
use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub async fn search_devices(
    state: State<'_, AppState>,
    query: String,
    search_by: String,
    page: i32,
    page_size: i32,
    og_id: Option<i64>,
) -> Result<DeviceSearchResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    // Helper: append `&lgid={ogId}` when scope is set. Alternate-id lookups
    // hit `/api/mdm/devices?searchby=…&id=…` which doesn't support `lgid`
    // (single-record by-id), so we filter post-fetch for those.
    let lgid_q = og_id
        .map(|id| format!("&lgid={}", id))
        .unwrap_or_default();

    // On Omnissa-rebrand tenants, /api/mdm/devices/search does NOT accept
    // searchby/id and silently ignores unknown params (returning ALL devices).
    // Alternate-id lookups (serial / MAC / UDID / IMEI / EAS id / device id)
    // belong on /api/mdm/devices?searchby=…&id=… which returns a single
    // Device or 404. Attribute filters (user, model, platform…) stay on
    // /devices/search.
    match search_by.as_str() {
        "Serialnumber" | "Macaddress" | "Udid" | "ImeiNumber" | "EasId" | "DeviceId" => {
            // Alt-id lookups target a specific record by global identifier and
            // don't accept `lgid` server-side. We deliberately do NOT filter
            // the result by scope client-side — an operator who pastes an
            // exact ID expects a hit if the device exists in the tenant, even
            // when the active scope happens to exclude its OG. Scope is for
            // bulk listings; exact-id lookups are global.
            let path = format!("/api/mdm/devices?searchby={}&id={}", search_by, query);
            // Propagate the WS1 error verbatim — an unknown serial returns 404
            // with a body explaining why, and the operator needs to see that
            // rather than a silent empty list.
            let summary: DeviceSummary = client.get(&path).await?;
            Ok(DeviceSearchResult {
                devices: vec![summary.into()],
                page: 0,
                page_size: 1,
                total: 1,
            })
        }
        "Username" => {
            let path = format!(
                "/api/mdm/devices/search?user={}&page={}&pagesize={}{}",
                query, page, page_size, lgid_q
            );
            let resp: DeviceSearchResponse = client.get(&path).await?;
            let devices: Vec<Device> = resp
                .devices
                .unwrap_or_default()
                .into_iter()
                .map(Device::from)
                .collect();
            Ok(DeviceSearchResult {
                devices,
                page: resp.page.unwrap_or(0),
                page_size: resp.page_size.unwrap_or(page_size),
                total: resp.total.unwrap_or(0),
            })
        }
        // Friendly name and asset tag aren't filter params on /devices/search.
        // We have to fetch every device in the active scope and filter
        // client-side. Paginate up to MAX_PAGES * pagesize devices so this
        // works on tenants with more than 500 devices — capped to avoid
        // runaway. The previous single-page (500) limit silently dropped
        // anything past page 1, which is what made "search by hostname" feel
        // broken on the user's tenant.
        "DeviceFriendlyName" | "Assettag" => {
            const PAGE_SIZE: i32 = 500;
            const MAX_PAGES: i32 = 20; // 10k devices ceiling — enough for the team's fleet.
            let needle = query.to_lowercase();
            if needle.is_empty() {
                return Ok(DeviceSearchResult {
                    devices: vec![],
                    page: 0,
                    page_size: 0,
                    total: 0,
                });
            }
            let mut matches: Vec<Device> = Vec::new();
            for page_idx in 0..MAX_PAGES {
                let path = format!(
                    "/api/mdm/devices/search?pagesize={}&page={}{}",
                    PAGE_SIZE, page_idx, lgid_q
                );
                let resp: DeviceSearchResponse = client.get(&path).await?;
                let batch: Vec<DeviceSummary> = resp.devices.unwrap_or_default();
                let batch_len = batch.len();
                for s in batch {
                    let d: Device = s.into();
                    let hay = if search_by == "DeviceFriendlyName" {
                        d.friendly_name.to_lowercase()
                    } else {
                        d.asset_number.to_lowercase()
                    };
                    if hay.contains(&needle) {
                        matches.push(d);
                    }
                }
                // Last page reached when WS1 returned fewer rows than requested.
                if (batch_len as i32) < PAGE_SIZE {
                    break;
                }
            }
            let total = matches.len() as i32;
            Ok(DeviceSearchResult {
                devices: matches,
                page: 0,
                page_size: total,
                total,
            })
        }
        other => Err(AppError::Api(format!(
            "Unsupported searchBy value: {}",
            other
        ))),
    }
}

#[tauri::command]
pub async fn get_device_tags(
    state: State<'_, AppState>,
    device_id: i64,
) -> Result<Vec<crate::api::types::Tag>, AppError> {
    let client = WS1Client::from_state(&state).await?;

    let path = format!("/api/mdm/devices/{}/tags", device_id);

    // The device tags endpoint returns a different structure
    let resp: serde_json::Value = client.get(&path).await?;

    // Parse tags from the response
    let tags = if let Some(arr) = resp.as_array() {
        arr.iter()
            .filter_map(|v| {
                let id = v.get("Id")?.get("Value")?.as_i64()?;
                let name = v.get("TagName")?.as_str()?.to_string();
                Some(crate::api::types::Tag {
                    id,
                    tag_name: name,
                    device_count: 0,
                })
            })
            .collect()
    } else {
        Vec::new()
    };

    Ok(tags)
}
