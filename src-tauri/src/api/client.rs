use reqwest::Method;
use serde::de::DeserializeOwned;

use crate::api::auth::{build_headers, refresh_oauth_token};
use crate::error::AppError;
use crate::state::{AppState, AuthMode, WS1Config};

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
        match self.config.auth_mode {
            AuthMode::Basic => build_headers(&self.config, None),
            AuthMode::OAuth => {
                let token = refresh_oauth_token(self.state, &self.config).await?;
                build_headers(&self.config, Some(&token))
            }
        }
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

    /// Test connection by hitting /api/system/info
    pub async fn test_connection(&self) -> Result<(), AppError> {
        let url = format!("{}/api/system/info", self.base_url());
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
