use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

/// OAuth-only WS1 configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WS1Config {
    pub tenant_url: String,
    pub api_key: String,
    pub client_id: String,
    pub client_secret: String,
    pub token_url: String,
    /// Optional override for the Swagger spec URL used by "Import API library".
    /// When empty, the importer auto-discovers using common WS1 patterns.
    #[serde(default)]
    pub spec_url: String,
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
