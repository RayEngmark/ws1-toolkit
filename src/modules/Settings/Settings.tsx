import { useEffect } from "react";
import { useConnectionStore } from "../../state/connectionStore";
import { useUIStore } from "../../state/uiStore";
import { Button } from "../../components/shared/Button/Button";
import { Input } from "../../components/shared/Input/Input";
import styles from "./Settings.module.css";

export function Settings() {
  const store = useConnectionStore();
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    store.loadCredentials();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    await store.saveCredentials();
    addToast("Credentials saved", "success");
  };

  const handleTest = async () => {
    const info = await store.testConnection();
    if (info.connected) {
      addToast("Connected successfully!", "success");
    } else {
      addToast(info.error ?? "Connection failed", "error");
    }
  };

  const handleClear = async () => {
    await store.clearCredentials();
    addToast("Credentials cleared", "info");
  };

  if (store.isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.loadingText}>Loading credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Connection Settings</h2>
          <p className={styles.subtitle}>
            Configure your Workspace ONE UEM tenant connection
          </p>
        </div>

        <div className={styles.form}>
          <Input
            label="Tenant URL"
            placeholder="https://your-tenant.awmdm.com"
            value={store.tenantUrl}
            onChange={(e) => store.setField("tenantUrl", e.target.value)}
          />

          <Input
            label="API Key"
            type="password"
            placeholder="aw-tenant-code value"
            value={store.apiKey}
            onChange={(e) => store.setField("apiKey", e.target.value)}
          />

          <div className={styles.authToggle}>
            <span className={styles.authLabel}>Authentication Mode</span>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleBtn} ${store.authMode === "basic" ? styles.toggleActive : ""}`}
                onClick={() => store.setAuthMode("basic")}
              >
                Basic Auth
              </button>
              <button
                className={`${styles.toggleBtn} ${store.authMode === "oauth" ? styles.toggleActive : ""}`}
                onClick={() => store.setAuthMode("oauth")}
              >
                OAuth 2.0
              </button>
            </div>
          </div>

          {store.authMode === "basic" ? (
            <div className={styles.authFields}>
              <Input
                label="Username"
                placeholder="admin@tenant.com"
                value={store.username}
                onChange={(e) => store.setField("username", e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                value={store.password}
                onChange={(e) => store.setField("password", e.target.value)}
              />
            </div>
          ) : (
            <div className={styles.authFields}>
              <Input
                label="Token URL"
                placeholder="https://na.uemauth.vmwservices.com/connect/token"
                value={store.tokenUrl}
                onChange={(e) => store.setField("tokenUrl", e.target.value)}
              />
              <Input
                label="Client ID"
                value={store.clientId}
                onChange={(e) => store.setField("clientId", e.target.value)}
              />
              <Input
                label="Client Secret"
                type="password"
                value={store.clientSecret}
                onChange={(e) => store.setField("clientSecret", e.target.value)}
              />
            </div>
          )}

          {store.connectionError && (
            <div className={styles.errorBox}>
              {store.connectionError}
            </div>
          )}

          {store.isConnected && (
            <div className={styles.successBox}>
              Connected to {store.tenantUrl}
            </div>
          )}

          <div className={styles.actions}>
            <Button
              variant="primary"
              onClick={handleTest}
              loading={store.isTesting}
            >
              Test Connection
            </Button>
            <Button onClick={handleSave} loading={store.isSaving}>
              Save
            </Button>
            <Button variant="danger" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
