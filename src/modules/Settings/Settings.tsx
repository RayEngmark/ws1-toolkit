import { useConnectionStore } from "../../state/connectionStore";
import { useUIStore } from "../../state/uiStore";
import styles from "./Settings.module.css";

export function Settings() {
  const store = useConnectionStore();
  const addToast = useUIStore((s) => s.addToast);

  const handleSave = async () => {
    await store.saveCredentials();
    addToast("Credentials saved", "success");
  };

  const handleTest = async () => {
    const info = await store.testConnection();
    if (info.connected) addToast("Connection OK", "success");
    else addToast(info.error ?? "Connection failed", "error");
  };

  const handleClear = async () => {
    await store.clearCredentials();
    addToast("Credentials cleared", "info");
  };

  if (store.isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading credentials…</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>Connection</div>

        <div className={styles.group}>
          <div className={styles.groupHeader}>Tenant</div>
          <Field label="URL">
            <input
              className={styles.input}
              type="text"
              placeholder="https://tenant.awmdm.com"
              value={store.tenantUrl}
              onChange={(e) => store.setField("tenantUrl", e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </Field>
          <Field label="API Key">
            <input
              className={styles.input}
              type="password"
              placeholder="aw-tenant-code"
              value={store.apiKey}
              onChange={(e) => store.setField("apiKey", e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </Field>
        </div>

        <div className={styles.group}>
          <div className={styles.groupHeader}>Authentication</div>
          <Field label="Method">
            <div className={styles.segmented}>
              <button
                type="button"
                className={`${styles.segment} ${store.authMode === "basic" ? styles.segmentActive : ""}`}
                onClick={() => store.setAuthMode("basic")}
              >
                Basic
              </button>
              <button
                type="button"
                className={`${styles.segment} ${store.authMode === "oauth" ? styles.segmentActive : ""}`}
                onClick={() => store.setAuthMode("oauth")}
              >
                OAuth 2.0
              </button>
            </div>
          </Field>

          {store.authMode === "basic" ? (
            <>
              <Field label="Username">
                <input
                  className={styles.input}
                  type="text"
                  placeholder="admin@tenant.com"
                  value={store.username}
                  onChange={(e) => store.setField("username", e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                />
              </Field>
              <Field label="Password">
                <input
                  className={styles.input}
                  type="password"
                  value={store.password}
                  onChange={(e) => store.setField("password", e.target.value)}
                  autoComplete="off"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Token URL">
                <input
                  className={styles.input}
                  type="text"
                  placeholder="https://na.uemauth.vmwservices.com/connect/token"
                  value={store.tokenUrl}
                  onChange={(e) => store.setField("tokenUrl", e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                />
              </Field>
              <Field label="Client ID">
                <input
                  className={styles.input}
                  type="text"
                  value={store.clientId}
                  onChange={(e) => store.setField("clientId", e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                />
              </Field>
              <Field label="Client Secret">
                <input
                  className={styles.input}
                  type="password"
                  value={store.clientSecret}
                  onChange={(e) => store.setField("clientSecret", e.target.value)}
                  autoComplete="off"
                />
              </Field>
            </>
          )}
        </div>

        {(store.connectionError || store.isConnected) && (
          <div
            className={`${styles.statusRow} ${store.isConnected ? styles.statusOk : styles.statusErr}`}
          >
            <span className={styles.statusLabel}>Status</span>
            <span className={styles.statusValue}>
              {store.isConnected
                ? "Connected"
                : store.connectionError ?? "Unknown error"}
            </span>
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.actionPrimary}
            onClick={handleTest}
            disabled={store.isTesting || !store.tenantUrl || !store.apiKey}
          >
            {store.isTesting ? "Testing…" : "Test Connection"}
          </button>
          <button
            className={styles.action}
            onClick={handleSave}
            disabled={store.isSaving || !store.tenantUrl || !store.apiKey}
          >
            {store.isSaving ? "Saving…" : "Save"}
          </button>
          <div className={styles.actionSpacer} />
          <button className={styles.actionDanger} onClick={handleClear}>
            Clear
          </button>
        </div>

        <div className={styles.footerHint}>
          Credentials are stored locally in your user profile. They are never sent
          anywhere except directly to your WS1 tenant.
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldControl}>{children}</div>
    </div>
  );
}
