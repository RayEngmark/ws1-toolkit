use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, AUTHORIZATION, CONTENT_TYPE};

use crate::error::AppError;
use crate::state::{AppState, OAuthToken, WS1Config};

/// Build the standard WS1 headers — `aw-tenant-code` API key + Bearer token.
pub fn build_headers(config: &WS1Config, bearer_token: &str) -> Result<HeaderMap, AppError> {
    let mut headers = HeaderMap::new();

    headers.insert(
        "aw-tenant-code",
        HeaderValue::from_str(&config.api_key)
            .map_err(|e| AppError::Auth(format!("Invalid API key: {}", e)))?,
    );

    // WS1 endpoints disagree on which versions they expose: MDM v1/v2/v3 mostly
    // serve `application/json;version=2`, but `/api/system/*` only declares v1
    // in the spec. A blanket `version=2` Accept can 406 on stricter tenants for
    // system-side calls. Send a q-weighted fallback so each endpoint can pick
    // its preferred version without us second-guessing per call site.
    headers.insert(
        ACCEPT,
        HeaderValue::from_static(
            "application/json;version=2, application/json;version=1;q=0.9, application/json;q=0.8",
        ),
    );
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let auth_value = format!("Bearer {}", bearer_token);
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&auth_value)
            .map_err(|e| AppError::Auth(format!("Invalid token: {}", e)))?,
    );

    Ok(headers)
}

/// OAuth client_credentials flow with cached + auto-refreshed token.
pub async fn refresh_oauth_token(state: &AppState, config: &WS1Config) -> Result<String, AppError> {
    // Cache hit?
    {
        let token_guard = state.oauth_token.read().await;
        if let Some(ref token) = *token_guard {
            if token.expires_at > std::time::Instant::now() {
                return Ok(token.access_token.clone());
            }
        }
    }

    if config.client_id.is_empty()
        || config.client_secret.is_empty()
        || config.token_url.is_empty()
    {
        return Err(AppError::Auth(
            "OAuth client_id, client_secret, and token_url are all required".into(),
        ));
    }

    let params = [
        ("grant_type", "client_credentials"),
        ("client_id", config.client_id.as_str()),
        ("client_secret", config.client_secret.as_str()),
    ];

    let resp = state.client.post(&config.token_url).form(&params).send().await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(AppError::Auth(format!(
            "OAuth token request failed ({}): {}",
            status, body
        )));
    }

    let token_resp: crate::api::types::OAuthTokenResponse = resp.json().await?;
    let expires_in = token_resp.expires_in.unwrap_or(3600);
    let expires_at = std::time::Instant::now()
        + std::time::Duration::from_secs(expires_in.saturating_sub(60));

    let access_token = token_resp.access_token.clone();

    let mut token_guard = state.oauth_token.write().await;
    *token_guard = Some(OAuthToken {
        access_token: token_resp.access_token,
        expires_at,
    });

    Ok(access_token)
}
