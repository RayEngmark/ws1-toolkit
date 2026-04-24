use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WS1Config {
    pub tenant_url: String,
    pub api_key: String,
    pub auth_mode: AuthMode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_secret: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AuthMode {
    Basic,
    OAuth,
}

#[derive(Debug)]
pub struct OAuthToken {
    pub access_token: String,
    pub expires_at: std::time::Instant,
}

pub struct AppState {
    pub client: reqwest::Client,
    pub config: RwLock<Option<WS1Config>>,
    pub oauth_token: RwLock<Option<OAuthToken>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
            config: RwLock::new(None),
            oauth_token: RwLock::new(None),
        }
    }
}
