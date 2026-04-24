use base64::Engine;
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, AUTHORIZATION, CONTENT_TYPE};

use crate::error::AppError;
use crate::state::{AppState, AuthMode, OAuthToken, WS1Config};

pub fn build_headers(config: &WS1Config, bearer_token: Option<&str>) -> Result<HeaderMap, AppError> {
    let mut headers = HeaderMap::new();

    headers.insert(
        "aw-tenant-code",
        HeaderValue::from_str(&config.api_key)
            .map_err(|e| AppError::Auth(format!("Invalid API key: {}", e)))?,
    );

    headers.insert(ACCEPT, HeaderValue::from_static("application/json;version=2"));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    match &config.auth_mode {
        AuthMode::Basic => {
            let username = config
                .username
                .as_ref()
                .ok_or_else(|| AppError::Auth("Username required for Basic auth".into()))?;
            let password = config
                .password
                .as_ref()
                .ok_or_else(|| AppError::Auth("Password required for Basic auth".into()))?;

            let credentials = format!("{}:{}", username, password);
            let encoded = base64::engine::general_purpose::STANDARD.encode(credentials);
            let auth_value = format!("Basic {}", encoded);
            headers.insert(
                AUTHORIZATION,
                HeaderValue::from_str(&auth_value)
                    .map_err(|e| AppError::Auth(format!("Invalid credentials: {}", e)))?,
            );
        }
        AuthMode::OAuth => {
            let token = bearer_token
                .ok_or_else(|| AppError::Auth("OAuth token not available".into()))?;
            let auth_value = format!("Bearer {}", token);
            headers.insert(
                AUTHORIZATION,
                HeaderValue::from_str(&auth_value)
                    .map_err(|e| AppError::Auth(format!("Invalid token: {}", e)))?,
            );
        }
    }

    Ok(headers)
}

pub async fn refresh_oauth_token(state: &AppState, config: &WS1Config) -> Result<String, AppError> {
    // Check if existing token is still valid
    {
        let token_guard = state.oauth_token.read().await;
        if let Some(ref token) = *token_guard {
            if token.expires_at > std::time::Instant::now() {
                return Ok(token.access_token.clone());
            }
        }
    }

    // Fetch new token
    let client_id = config
        .client_id
        .as_ref()
        .ok_or_else(|| AppError::Auth("Client ID required for OAuth".into()))?;
    let client_secret = config
        .client_secret
        .as_ref()
        .ok_or_else(|| AppError::Auth("Client Secret required for OAuth".into()))?;
    let token_url = config
        .token_url
        .as_ref()
        .ok_or_else(|| AppError::Auth("Token URL required for OAuth".into()))?;

    let params = [
        ("grant_type", "client_credentials"),
        ("client_id", client_id),
        ("client_secret", client_secret),
    ];

    let resp = state
        .client
        .post(token_url)
        .form(&params)
        .send()
        .await?;

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
    // Refresh 60 seconds before actual expiry
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
