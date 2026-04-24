use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("API request failed: {0}")]
    Api(String),
    #[error("Authentication failed: {0}")]
    Auth(String),
    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),
    #[error("Store error: {0}")]
    Store(String),
    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("Not configured: {0}")]
    NotConfigured(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_str())
    }
}
