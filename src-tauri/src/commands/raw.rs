use serde::{Deserialize, Serialize};
use tauri::State;

use crate::api::auth::refresh_oauth_token;
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

/// Try to fetch the OpenAPI / Swagger spec for MDM API V1 from the connected
/// tenant. WS1's `/api/help` page is a Swagger UI; the underlying spec lives at
/// one of a small set of known paths. We try them in order and return the first
/// that returns valid JSON containing a `paths` object (Swagger 2.0 / OpenAPI
/// 3.0 root).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecFetchResult {
    pub source_path: String,
    pub spec: serde_json::Value,
}

#[tauri::command]
pub async fn fetch_api_spec(
    state: State<'_, AppState>,
    custom_url: Option<String>,
) -> Result<SpecFetchResult, AppError> {
    let config = {
        let g = state.config.read().await;
        g.as_ref()
            .ok_or_else(|| AppError::NotConfigured("No WS1 credentials configured".into()))?
            .clone()
    };

    // OAuth token (only sent when needed; the spec URL may be public, but most
    // tenants gate it behind auth).
    let token = refresh_oauth_token(&state, &config).await.ok();

    // Candidate paths to probe. User-provided custom URL wins.
    let mut candidates: Vec<String> = Vec::new();
    if let Some(custom) = custom_url.as_ref() {
        if !custom.trim().is_empty() {
            candidates.push(custom.trim().to_string());
        }
    }
    if !config.spec_url.trim().is_empty() {
        candidates.push(config.spec_url.trim().to_string());
    }
    // Common fallback patterns for WS1 Swagger spec URLs.
    let base = config.tenant_url.trim_end_matches('/');
    for tail in [
        "/api/help/Docs/v1/MDM%20API%20V1",
        "/API/help/Docs/v1/MDM%20API%20V1",
        "/api/help/swagger/v1/MDM%20API%20V1",
        "/api/help/Docs/MDM%20API%20V1",
        "/api/help/swagger.json",
        "/api/help/v1/swagger.json",
    ] {
        candidates.push(format!("{}{}", base, tail));
    }

    let mut last_err = String::new();
    for url in candidates.iter() {
        let mut req = state.client.get(url);
        if let Some(tok) = token.as_ref() {
            req = req.bearer_auth(tok);
            req = req.header("aw-tenant-code", &config.api_key);
            req = req.header("Accept", "application/json");
        }
        match req.send().await {
            Ok(resp) => {
                let status = resp.status();
                if !status.is_success() {
                    last_err = format!("{} → HTTP {}", url, status);
                    continue;
                }
                let text = resp.text().await.unwrap_or_default();
                match serde_json::from_str::<serde_json::Value>(&text) {
                    Ok(v) => {
                        if v.get("paths").is_some() {
                            return Ok(SpecFetchResult {
                                source_path: url.clone(),
                                spec: v,
                            });
                        } else {
                            last_err =
                                format!("{} → JSON had no `paths` field (not a Swagger doc)", url);
                        }
                    }
                    Err(e) => {
                        last_err = format!("{} → not valid JSON: {}", url, e);
                    }
                }
            }
            Err(e) => {
                last_err = format!("{} → network error: {}", url, e);
            }
        }
    }

    Err(AppError::Api(format!(
        "Could not auto-discover the API spec. Last error: {}",
        last_err
    )))
}
