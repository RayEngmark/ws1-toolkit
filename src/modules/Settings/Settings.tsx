import { useState } from "react";
import { useConnectionStore } from "../../state/connectionStore";
import { useUIStore } from "../../state/uiStore";
import { useCatalogStore } from "../../library/catalogStore";
import { specToCatalog } from "../../library/specToCatalog";
import * as api from "../../ipc/client";
import styles from "./Settings.module.css";

export function Settings() {
  const store = useConnectionStore();
  const addToast = useUIStore((s) => s.addToast);
  const catalog = useCatalogStore();
  const [isImporting, setIsImporting] = useState(false);

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

  const handleImportLibrary = async () => {
    setIsImporting(true);
    try {
      const result = await api.fetchApiSpec(store.specUrl.trim() || undefined);
      const endpoints = specToCatalog(result.spec);
      if (endpoints.length === 0) {
        addToast("Spec parsed but no endpoints found", "error");
        return;
      }
      catalog.setImported(endpoints, result.sourceUrl);
      addToast(`Imported ${endpoints.length} endpoints`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      addToast(msg, "error");
    } finally {
      setIsImporting(false);
    }
  };

  if (store.isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading credentials…</div>
      </div>
    );
  }

  const canSubmit =
    !!store.tenantUrl &&
    !!store.apiKey &&
    !!store.clientId &&
    !!store.clientSecret &&
    !!store.tokenUrl;

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>Connection — OAuth 2.0</div>

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
          <div className={styles.groupHeader}>OAuth credentials</div>
          <Field label="Token URL">
            <input
              className={styles.input}
              type="text"
              placeholder="https://<region>.uemauth.<your-tenant-domain>/connect/token"
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
        </div>

        <div className={styles.group}>
          <div className={styles.groupHeader}>API library</div>
          <Field label="Spec URL">
            <input
              className={styles.input}
              type="text"
              placeholder="optional override — leave blank to auto-discover"
              value={store.specUrl}
              onChange={(e) => store.setField("specUrl", e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </Field>
          <div className={styles.libraryStatus}>
            <span className={styles.statusLabel}>Source</span>
            <span className={styles.statusValue}>
              {catalog.source === "imported"
                ? `imported · ${catalog.endpoints.length} endpoints${
                    catalog.importedAt
                      ? ` · ${new Date(catalog.importedAt).toLocaleString()}`
                      : ""
                  }`
                : `bundled · ${catalog.endpoints.length} endpoints`}
            </span>
          </div>
          {catalog.source === "imported" && catalog.sourceUrl && (
            <div className={styles.libraryStatus}>
              <span className={styles.statusLabel}>From</span>
              <span className={styles.statusValueMono}>{catalog.sourceUrl}</span>
            </div>
          )}
          <div className={styles.libraryActions}>
            <button
              className={styles.action}
              onClick={handleImportLibrary}
              disabled={isImporting || !store.isConnected}
              title={
                store.isConnected
                  ? "Fetch the OpenAPI/Swagger spec from your tenant"
                  : "Connect first to import"
              }
            >
              {isImporting ? "Importing…" : "Import API library from tenant"}
            </button>
            {catalog.source === "imported" && (
              <button
                className={styles.action}
                onClick={() => {
                  catalog.resetToBundled();
                  addToast("Reverted to bundled catalog", "info");
                }}
              >
                Revert to bundled
              </button>
            )}
          </div>
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
            disabled={store.isTesting || !canSubmit}
          >
            {store.isTesting ? "Testing…" : "Test Connection"}
          </button>
          <button
            className={styles.action}
            onClick={handleSave}
            disabled={store.isSaving || !canSubmit}
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
