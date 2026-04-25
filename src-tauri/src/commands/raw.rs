use serde::{Deserialize, Serialize};
use tauri::State;

use crate::api::client::{RawResponse, WS1Client};
use crate::error::AppError;
use crate::state::AppState;

/// Tauri command for the Library tab's raw endpoint runner.
/// The frontend constructs the resolved path (with placeholders filled in) and
/// the optional JSON body, then this command calls the WS1 client with the
/// usual auth headers and returns the response untouched.
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RawRequest {
    pub method: String,
    pub path: String,
    #[serde(default)]
    pub body: Option<serde_json::Value>,
}

#[tauri::command]
pub async fn run_raw_endpoint(
    state: State<'_, AppState>,
    request: RawRequest,
) -> Result<RawResponse, AppError> {
    let client = WS1Client::from_state(&state).await?;
    client
        .raw_request(&request.method, &request.path, request.body.as_ref())
        .await
}
