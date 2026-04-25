use tauri::State;
use tauri_plugin_store::StoreExt;

use crate::api::client::WS1Client;
use crate::api::types::ConnectionInfo;
use crate::error::AppError;
use crate::state::{AppState, WS1Config};

// OAuth-only — Basic auth fields removed.

#[tauri::command]
pub async fn save_credentials(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    config: WS1Config,
) -> Result<(), AppError> {
    // Save to tauri-plugin-store
    let store = app
        .store("credentials.json")
        .map_err(|e| AppError::Store(e.to_string()))?;

    let config_json = serde_json::to_value(&config)?;
    store.set("ws1_config", config_json);

    // Update in-memory state
    let mut config_guard = state.config.write().await;
    *config_guard = Some(config);

    // Clear any cached OAuth token so it refreshes with new creds
    let mut token_guard = state.oauth_token.write().await;
    *token_guard = None;

    Ok(())
}

#[tauri::command]
pub async fn load_credentials(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<Option<WS1Config>, AppError> {
    let store = app
        .store("credentials.json")
        .map_err(|e| AppError::Store(e.to_string()))?;

    let config_val = store.get("ws1_config");

    if let Some(val) = config_val {
        let config: WS1Config = serde_json::from_value(val)?;

        // Load into state
        let mut config_guard = state.config.write().await;
        *config_guard = Some(config.clone());

        Ok(Some(config))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn test_connection(state: State<'_, AppState>) -> Result<ConnectionInfo, AppError> {
    let client = WS1Client::from_state(&state).await?;

    match client.test_connection().await {
        Ok(()) => Ok(ConnectionInfo {
            connected: true,
            tenant_name: {
                let cfg = state.config.read().await;
                cfg.as_ref().map(|c| c.tenant_url.clone())
            },
            version: None,
            error: None,
        }),
        Err(e) => Ok(ConnectionInfo {
            connected: false,
            tenant_name: None,
            version: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub async fn clear_credentials(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), AppError> {
    let store = app
        .store("credentials.json")
        .map_err(|e| AppError::Store(e.to_string()))?;

    store.delete("ws1_config");

    let mut config_guard = state.config.write().await;
    *config_guard = None;

    let mut token_guard = state.oauth_token.write().await;
    *token_guard = None;

    Ok(())
}
