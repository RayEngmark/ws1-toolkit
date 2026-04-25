import { useEffect, useState } from "react";
import { DevicePicker } from "../../components/DevicePicker/DevicePicker";
import { TargetPicker } from "../../components/TargetPicker/TargetPicker";
import * as api from "../../ipc/client";
import type { BulkActionResult, Device, Tag } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import shared from "../_shared/ActionPage.module.css";

export function TagDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagId, setTagId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<{ kind: "add" | "remove"; tag: string; result: BulkActionResult } | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const loadTags = async () => {
    if (tags.length > 0) return;
    setTags(await api.getTags(0));
  };

  useEffect(() => {
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedTag = tags.find((t) => t.id === tagId);

  const apply = async (kind: "add" | "remove") => {
    if (!tagId || devices.length === 0) return;
    setBusy(true);
    setLastResult(null);
    try {
      const ids = devices.map((d) => d.id);
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
        addToast(`${result.failed} device(s) failed`, "error");
      }
    } finally {
      setBusy(false);
    }
  };

  const ready = devices.length > 0 && tagId !== null;

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Tag devices</h1>
        <p className={shared.subtitle}>
          Add or remove a tag on multiple devices at once. Paste any mix of
          serials, usernames, UUIDs, or asset tags — we resolve them all.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack}>
          <DevicePicker resolved={devices} onChange={setDevices} />

          <TargetPicker
            label="Tag"
            emptyHint="Pick a tag…"
            items={tags.map((t) => ({
              id: t.id,
              primary: t.tagName,
              meta: `${t.deviceCount} devices`,
            }))}
            selectedId={tagId}
            onSelect={setTagId}
            onLoad={loadTags}
          />

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

      <footer className={shared.footer}>
        <span className={shared.footerInfo}>
          {ready ? (
            <>
              <span className={shared.footerCount}>{devices.length}</span>
              <span>device(s) ·</span>
              <span>tag &quot;{selectedTag?.tagName}&quot;</span>
            </>
          ) : (
            <span style={{ color: "var(--fg-3)" }}>
              Paste devices and pick a tag to enable actions
            </span>
          )}
        </span>
        <span className={shared.footerSpacer} />
        <button
          className={shared.btnPrimary}
          onClick={() => apply("add")}
          disabled={!ready || busy}
        >
          {busy ? "Working…" : `Add tag to ${devices.length || 0} device(s)`}
        </button>
        <button
          className={shared.btnDanger}
          onClick={() => apply("remove")}
          disabled={!ready || busy}
        >
          Remove tag
        </button>
      </footer>
    </div>
  );
}
