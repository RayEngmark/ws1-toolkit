mod api;
mod commands;
mod error;
mod state;

use commands::{connection, device, org_group, tag};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // Connection
            connection::save_credentials,
            connection::load_credentials,
            connection::test_connection,
            connection::clear_credentials,
            // Devices
            device::search_devices,
            device::get_device_tags,
            // Tags
            tag::get_tags,
            tag::add_tags_to_devices,
            tag::remove_tags_from_devices,
            // Organization Groups
            org_group::search_org_groups,
            org_group::get_og_children,
            org_group::move_device_to_og,
            org_group::bulk_move_devices,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
