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
) -> Result<DeviceSearchResult, AppError> {
    let client = WS1Client::from_state(&state).await?;

    // On Omnissa-rebrand tenants, /api/mdm/devices/search does NOT accept
    // searchby/id and silently ignores unknown params (returning ALL devices).
    // Alternate-id lookups (serial / MAC / UDID / IMEI / EAS id / device id)
    // belong on /api/mdm/devices?searchby=…&id=… which returns a single
    // Device or 404. Attribute filters (user, model, platform…) stay on
    // /devices/search.
    match search_by.as_str() {
        "Serialnumber" | "Macaddress" | "Udid" | "ImeiNumber" | "EasId" | "DeviceId" => {
            let path = format!("/api/mdm/devices?searchby={}&id={}", search_by, query);
            match client.get::<DeviceSummary>(&path).await {
                Ok(summary) => Ok(DeviceSearchResult {
                    devices: vec![summary.into()],
                    page: 0,
                    page_size: 1,
                    total: 1,
                }),
                Err(_) => Ok(DeviceSearchResult {
                    devices: vec![],
                    page: 0,
                    page_size: 0,
                    total: 0,
                }),
            }
        }
        "Username" => {
            let path = format!(
                "/api/mdm/devices/search?user={}&page={}&pagesize={}",
                query, page, page_size
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
        // Fall back to fetching the first 500 devices and filtering client-side
        // by the matching field. Slower than a server-side filter but the only
        // way to make name lookups work on this tenant's API surface — better
        // than silently returning nothing.
        "DeviceFriendlyName" | "Assettag" => {
            let path = "/api/mdm/devices/search?pagesize=500";
            let resp: DeviceSearchResponse = client.get(path).await?;
            let needle = query.to_lowercase();
            let devices: Vec<Device> = resp
                .devices
                .unwrap_or_default()
                .into_iter()
                .map(Device::from)
                .filter(|d| {
                    let hay = if search_by == "DeviceFriendlyName" {
                        d.friendly_name.to_lowercase()
                    } else {
                        d.asset_number.to_lowercase()
                    };
                    !needle.is_empty() && hay.contains(&needle)
                })
                .collect();
            let total = devices.len() as i32;
            Ok(DeviceSearchResult {
                devices,
                page: 0,
                page_size: total,
                total,
            })
        }
        _ => Ok(DeviceSearchResult {
            devices: vec![],
            page: 0,
            page_size: 0,
            total: 0,
        }),
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
