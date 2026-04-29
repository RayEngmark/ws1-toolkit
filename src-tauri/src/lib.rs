mod api;
mod commands;
mod error;
mod state;

use commands::{app, connection, device, org_group, profile, raw, smart_group, tag};
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
            tag::create_tag,
            // Organization Groups
            org_group::search_org_groups,
            org_group::get_og_children,
            org_group::get_devices_in_og,
            org_group::move_device_to_og,
            org_group::bulk_move_devices,
            // Profiles
            profile::get_profiles,
            profile::install_profile_on_devices,
            profile::remove_profile_from_devices,
            profile::get_profile_assignment,
            profile::assign_profile_to_smart_group,
            profile::unassign_profile_from_smart_group,
            // Apps
            app::get_apps,
            app::assign_app_to_smart_group,
            // Smart Groups
            smart_group::search_smart_groups,
            smart_group::get_smart_group,
            smart_group::get_smart_group_devices,
            smart_group::add_devices_to_smart_group,
            smart_group::remove_devices_from_smart_group,
            // Raw runner (Library tab) + spec discovery
            raw::run_raw_endpoint,
            raw::fetch_api_spec,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
