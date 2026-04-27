import { useEffect, useState } from "react";
import { TargetPicker } from "../../components/TargetPicker/TargetPicker";
import * as api from "../../ipc/client";
import type { OrgGroup } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import { FooterSlot } from "../../components/AppShell/FooterSlot";
import shared from "../_shared/ActionPage.module.css";
import styles from "./CreateTag.module.css";

interface FlatOG {
  id: number;
  name: string;
  fullPath: string;
  type: string;
}

function flattenOGs(groups: OrgGroup[], prefix = ""): FlatOG[] {
  const result: FlatOG[] = [];
  for (const g of groups) {
    const path = prefix ? `${prefix} / ${g.name}` : g.name;
    result.push({ id: g.id, name: g.name, fullPath: path, type: g.ogType });
    if (g.children.length > 0) result.push(...flattenOGs(g.children, path));
  }
  return result;
}

export function CreateTag() {
  const [name, setName] = useState("");
  const [ogs, setOgs] = useState<FlatOG[]>([]);
  const [ogId, setOgId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const loadOgs = async () => {
    if (ogs.length > 0) return;
    const tree = await api.searchOrgGroups();
    setOgs(flattenOGs(tree));
  };

  useEffect(() => {
    loadOgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = name.trim().length > 0 && ogId !== null;

  const handleCreate = async () => {
    if (!ready || !ogId) return;
    setBusy(true);
    try {
      const tag = await api.createTag(name.trim(), ogId);
      setCreated(tag.tagName);
      addToast(`Tag "${tag.tagName}" created`, "success");
      setName("");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to create tag", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Create tag</h1>
        <p className={shared.subtitle}>
          Create a new device tag in your tenant. Once created, use{" "}
          <strong>Tag devices</strong> to apply it.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack} style={{ maxWidth: 560 }}>
          <div className={styles.field}>
            <label className={styles.label}>Tag name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Field-Workers-2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              maxLength={64}
            />
            <span className={styles.hint}>
              Use letters, numbers, and dashes. WS1 enforces uniqueness within an OG.
            </span>
          </div>

          <TargetPicker
            label="Owning organization group"
            emptyHint="Pick an OG…"
            items={ogs.map((o) => ({
              id: o.id,
              primary: o.name,
              secondary: o.fullPath,
              meta: o.type,
            }))}
            selectedId={ogId}
            onSelect={setOgId}
            onLoad={loadOgs}
          />

          {created && (
            <div className={shared.result}>
              <div className={shared.resultRow}>
                <span className={shared.resultLabel}>Created</span>
                <span className={shared.resultValue}>&quot;{created}&quot;</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <FooterSlot className={shared.footer}>
        <span className={shared.footerInfo}>
          {ready ? (
            <span style={{ color: "var(--fg-0)" }}>
              Ready to create &quot;{name}&quot;
            </span>
          ) : (
            <span style={{ color: "var(--fg-3)" }}>
              Enter a name and pick an OG
            </span>
          )}
        </span>
        <span className={shared.footerSpacer} />
        <button
          className={shared.btnPrimary}
          onClick={handleCreate}
          disabled={!ready || busy}
        >
          {busy ? "Creating…" : "Create tag"}
        </button>
      </FooterSlot>
    </div>
  );
}
