use tauri::State;

use crate::api::client::WS1Client;
use crate::api::types::{Device, DeviceSearchResponse, DeviceSearchResult};
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

    // The `id=` query param only matches WS1's internal numeric device ID —
    // passing a serial/IMEI/MAC/UUID into it gets silently ignored and the
    // server returns all devices. Use the field-specific param instead.
    let param_name = match search_by.as_str() {
        "Serialnumber" => "serialnumber",
        "Macaddress" => "macaddress",
        "Udid" => "udid",
        "ImeiNumber" => "imeinumber",
        "Username" => "user",
        "Assettag" => "assetnumber",
        "DeviceFriendlyName" => "devicefriendlyname",
        _ => "id",
    };

    let path = format!(
        "/api/mdm/devices/search?searchby={}&{}={}&page={}&pagesize={}",
        search_by, param_name, query, page, page_size
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
