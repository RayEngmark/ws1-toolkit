use reqwest::Method;
use serde::de::DeserializeOwned;
use serde::Serialize;

use crate::api::auth::{build_headers, refresh_oauth_token};
use crate::error::AppError;
use crate::state::{AppState, WS1Config};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RawResponse {
    pub ok: bool,
    pub status: u16,
    pub body: serde_json::Value,
}

pub struct WS1Client<'a> {
    state: &'a AppState,
    config: WS1Config,
}

impl<'a> WS1Client<'a> {
    pub async fn from_state(state: &'a AppState) -> Result<WS1Client<'a>, AppError> {
        let config_guard = state.config.read().await;
        let config = config_guard
            .as_ref()
            .ok_or_else(|| AppError::NotConfigured("No WS1 credentials configured".into()))?
            .clone();
        Ok(WS1Client { state, config })
    }

    fn base_url(&self) -> &str {
        self.config.tenant_url.trim_end_matches('/')
    }

    async fn get_headers(&self) -> Result<reqwest::header::HeaderMap, AppError> {
        let token = refresh_oauth_token(self.state, &self.config).await?;
        build_headers(&self.config, &token)
    }

    pub async fn request<T: DeserializeOwned>(
        &self,
        method: Method,
        path: &str,
        body: Option<&serde_json::Value>,
    ) -> Result<T, AppError> {
        let url = format!("{}{}", self.base_url(), path);
        let headers = self.get_headers().await?;

        let mut req = self.state.client.request(method, &url).headers(headers);

        if let Some(body) = body {
            req = req.json(body);
        }

        let resp = req.send().await?;
        let status = resp.status();

        if !status.is_success() {
            let body_text = resp.text().await.unwrap_or_default();
            return Err(AppError::Api(format!("HTTP {} — {}", status, body_text)));
        }

        let result = resp.json::<T>().await?;
        Ok(result)
    }

    pub async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T, AppError> {
        self.request::<T>(Method::GET, path, None).await
    }

    pub async fn post<T: DeserializeOwned>(
        &self,
        path: &str,
        body: &serde_json::Value,
    ) -> Result<T, AppError> {
        self.request::<T>(Method::POST, path, Some(body)).await
    }

    /// POST that returns no meaningful body (204 / empty response)
    pub async fn post_no_body(&self, path: &str, body: &serde_json::Value) -> Result<(), AppError> {
        let url = format!("{}{}", self.base_url(), path);
        let headers = self.get_headers().await?;

        let resp = self
            .state
            .client
            .post(&url)
            .headers(headers)
            .json(body)
            .send()
            .await?;

        let status = resp.status();
        if !status.is_success() {
            let body_text = resp.text().await.unwrap_or_default();
            return Err(AppError::Api(format!("HTTP {} — {}", status, body_text)));
        }

        Ok(())
    }

    /// Run an arbitrary endpoint — used by the Library tab's raw runner.
    /// Returns (status, body-as-json-or-string).
    ///
    /// Security:
    /// - Path must be tenant-relative (start with `/`) and must not contain
    ///   protocol markers (`://`, `\\`, scheme prefixes) so a malformed
    ///   placeholder substitution can't redirect the request to a different host.
    /// - Method whitelist: GET / POST / PUT / PATCH / DELETE only.
    pub async fn raw_request(
        &self,
        method: &str,
        path: &str,
        body: Option<&serde_json::Value>,
    ) -> Result<RawResponse, AppError> {
        let m = method.to_uppercase();
        let parsed_method = match m.as_str() {
            "GET" => Method::GET,
            "POST" => Method::POST,
            "PUT" => Method::PUT,
            "PATCH" => Method::PATCH,
            "DELETE" => Method::DELETE,
            other => return Err(AppError::Api(format!("Unsupported HTTP method: {}", other))),
        };

        // Path safety
        if !path.starts_with('/') {
            return Err(AppError::Api("Path must be tenant-relative (start with '/')".into()));
        }
        if path.starts_with("//")
            || path.contains("://")
            || path.contains('\\')
            || path.to_lowercase().starts_with("/http")
        {
            return Err(AppError::Api(
                "Path looks like an absolute URL or contains protocol — refusing to send".into(),
            ));
        }

        let url = format!("{}{}", self.base_url(), path);
        let headers = self.get_headers().await?;
        let mut req = self.state.client.request(parsed_method, &url).headers(headers);
        if let Some(body) = body {
            req = req.json(body);
        }

        let resp = req.send().await?;
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();

        // Try to parse as JSON; fall back to raw text.
        let body_value = if text.is_empty() {
            serde_json::Value::Null
        } else {
            match serde_json::from_str::<serde_json::Value>(&text) {
                Ok(v) => v,
                Err(_) => serde_json::Value::String(text),
            }
        };

        Ok(RawResponse {
            ok: status.is_success(),
            status: status.as_u16(),
            body: body_value,
        })
    }

    /// Test connection by hitting a known-good lightweight endpoint.
    /// /api/system/info was retired post-Omnissa-rebrand on some tenants;
    /// /api/system/groups/search is what the rest of the app uses.
    pub async fn test_connection(&self) -> Result<(), AppError> {
        let url = format!(
            "{}/api/system/groups/search?orderby=name&pagesize=1",
            self.base_url()
        );
        let headers = self.get_headers().await?;

        let resp = self.state.client.get(&url).headers(headers).send().await?;
        let status = resp.status();

        if !status.is_success() {
            let body_text = resp.text().await.unwrap_or_default();
            return Err(AppError::Api(format!(
                "Connection test failed ({}): {}",
                status, body_text
            )));
        }

        Ok(())
    }
}
