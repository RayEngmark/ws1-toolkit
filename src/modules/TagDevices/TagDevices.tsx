import { useEffect, useState } from "react";
import { DeviceShuttle } from "../../components/DeviceShuttle/DeviceShuttle";
import { TargetPicker } from "../../components/TargetPicker/TargetPicker";
import * as api from "../../ipc/client";
import type { BulkActionResult, Tag } from "../../ipc/contracts";
import { useSelectionStore } from "../../state/selectionStore";
import { useUIStore } from "../../state/uiStore";
import { useScopeStore } from "../../state/scopeStore";
import { useEntryContext } from "../../dynamic/entryContext";
import { FooterSlot } from "../../components/AppShell/FooterSlot";
import shared from "../_shared/ActionPage.module.css";

export function TagDevices() {
  const ctx = useEntryContext();
  // If user drilled in from Tags, pick the tag first.
  const tagFirst = ctx?.objectKey === "tags";
  const selection = useSelectionStore((s) => s.devices);
  const clearSelection = useSelectionStore((s) => s.clear);
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagId, setTagId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<{ kind: "add" | "remove"; tag: string; result: BulkActionResult } | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const loadTags = async () => {
    if (activeOgId === null) return;
    setTags(await api.getTags(activeOgId));
  };

  // Reload whenever the active OG changes — tag lists are OG-scoped.
  useEffect(() => {
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOgId]);

  const selectedTag = tags.find((t) => t.id === tagId);
  const ready = selection.length > 0 && tagId !== null;

  const apply = async (kind: "add" | "remove") => {
    if (!tagId || selection.length === 0) return;
    setBusy(true);
    setLastResult(null);
    try {
      const ids = selection.map((d) => d.id);
      const result =
        kind === "add"
          ? await api.addTagsToDevices(tagId, ids)
          : await api.removeTagsFromDevices(tagId, ids);
      setLastResult({ kind, tag: selectedTag?.tagName ?? "", result });
      if (result.accepted > 0) {
        addToast(
          `${kind === "add" ? "Added" : "Removed"} "${selectedTag?.tagName}" ${kind === "add" ? "to" : "from"} ${result.accepted} device(s)`,
          "success"
        );
      }
      if (result.failed > 0) {
        // Show WS1's actual error so the operator can see why it rejected.
        const detail = result.errors[0] ? ` — ${result.errors[0]}` : "";
        addToast(`${result.failed} device(s) failed${detail}`, "error");
      }
      if (result.failed === 0 && result.accepted > 0) clearSelection();
    } catch (e) {
      addToast(
        `Tag ${kind} failed: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Tag devices</h1>
        <p className={shared.subtitle}>
          Add or remove a tag on the selected devices.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack}>
          {tagFirst ? (
            <>
              <TargetPicker
                label="Tag"
                emptyHint="Pick a tag…"
                items={tags.map((t) => ({
                  id: t.id,
                  primary: t.tagName,
                  meta: `ID ${t.id}`,
                }))}
                selectedId={tagId}
                onSelect={setTagId}
                onLoad={loadTags}
              />
              {tagId !== null && <DeviceShuttle />}
            </>
          ) : (
            <>
              <DeviceShuttle />
              {selection.length > 0 && (
                <TargetPicker
                  label="Tag"
                  emptyHint="Pick a tag…"
                  items={tags.map((t) => ({
                    id: t.id,
                    primary: t.tagName,
                    meta: `ID ${t.id}`,
                  }))}
                  selectedId={tagId}
                  onSelect={setTagId}
                  onLoad={loadTags}
                />
              )}
            </>
          )}

          {lastResult && (
            <div
              className={`${shared.result} ${lastResult.result.failed > 0 ? shared.resultErr : ""}`}
            >
              <div className={shared.resultRow}>
                <span className={shared.resultLabel}>Last run</span>
                <span className={shared.resultValue}>
                  {lastResult.kind === "add" ? "Added" : "Removed"}{" "}
                  &quot;{lastResult.tag}&quot; · {lastResult.result.accepted}{" "}
                  accepted, {lastResult.result.failed} failed
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <FooterSlot className={shared.footer}>
        <span className={shared.footerInfo}>
          {ready ? (
            <>
              <span className={shared.footerCount}>{selection.length}</span>
              <span>device(s) ·</span>
              <span>tag &quot;{selectedTag?.tagName}&quot;</span>
            </>
          ) : (
            <span style={{ color: "var(--fg-3)" }}>
              {selection.length === 0
                ? "Add devices to the selection"
                : "Pick a tag"}
            </span>
          )}
        </span>
        <span className={shared.footerSpacer} />
        <button
          className={shared.btnPrimary}
          onClick={() => apply("add")}
          disabled={!ready || busy}
        >
          {busy ? "Working…" : `Add tag to ${selection.length || 0} device(s)`}
        </button>
        <button
          className={shared.btnDanger}
          onClick={() => apply("remove")}
          disabled={!ready || busy}
        >
          Remove tag
        </button>
      </FooterSlot>
    </div>
  );
}
