import { useEffect, useState } from "react";
import { DeviceShuttle } from "../../components/DeviceShuttle/DeviceShuttle";
import { TargetPicker } from "../../components/TargetPicker/TargetPicker";
import * as api from "../../ipc/client";
import type {
  BulkActionResult,
  Profile,
  ProfileTarget,
  SmartGroup,
} from "../../ipc/contracts";
import { useSelectionStore } from "../../state/selectionStore";
import { useUIStore } from "../../state/uiStore";
import { useScopeStore } from "../../state/scopeStore";
import { useEntryContext } from "../../dynamic/entryContext";
import { FooterSlot } from "../../components/AppShell/FooterSlot";
import shared from "../_shared/ActionPage.module.css";
import styles from "./AssignProfile.module.css";

export function AssignProfile() {
  const ctx = useEntryContext();

  // Lock target when the user drilled in via a path that implies it.
  const lockedTarget: ProfileTarget | null = (() => {
    if (!ctx) return null;
    if (ctx.objectKey === "devices") return "devices";
    if (ctx.objectKey === "smartgroups") return "smartgroup";
    if (ctx.objectKey === "profiles") {
      if (ctx.actionKey === "devices") return "devices";
      if (ctx.actionKey === "sg") return "smartgroup";
    }
    return null;
  })();

  const [target, setTarget] = useState<ProfileTarget>(
    lockedTarget ?? "devices"
  );

  // If the user lands on this page via Profiles → ..., pick the profile first.
  const profileFirst = ctx?.objectKey === "profiles";

  const selection = useSelectionStore((s) => s.devices);
  const clearSelection = useSelectionStore((s) => s.clear);

  const [sgs, setSgs] = useState<SmartGroup[]>([]);
  const [sgId, setSgId] = useState<number | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const addToast = useUIStore((s) => s.addToast);
  const activeOgId = useScopeStore((s) => s.activeOgId);

  const loadProfiles = async () => {
    setProfiles(await api.getProfiles(activeOgId));
  };
  const loadSgs = async () => {
    setSgs(await api.searchSmartGroups(activeOgId));
  };

  useEffect(() => {
    loadProfiles();
    if (target === "smartgroup") loadSgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOgId, target]);

  const selectedProfile = profiles.find((p) => p.id === profileId);
  const selectedSg = sgs.find((s) => s.id === sgId);

  const ready =
    profileId !== null &&
    ((target === "devices" && selection.length > 0) ||
      (target === "smartgroup" && sgId !== null));

  const apply = async () => {
    if (!profileId || !ready) return;
    setBusy(true);
    setLastResult(null);
    try {
      let result: BulkActionResult;
      if (target === "devices") {
        const serials = selection.map((d) => d.serialNumber);
        result = await api.installProfileOnDevices(profileId, serials);
        setLastResult(
          `Installed "${selectedProfile?.name}" on ${result.accepted} of ${result.total} devices`
        );
        if (result.accepted > 0) {
          addToast(
            `Installed "${selectedProfile?.name}" on ${result.accepted} device(s)`,
            "success"
          );
        }
      } else {
        result = { total: 1, accepted: 1, failed: 0, errors: [] };
        setLastResult(
          `Profile "${selectedProfile?.name}" assigned to "${selectedSg?.name}"`
        );
        addToast(
          `Assigned "${selectedProfile?.name}" to "${selectedSg?.name}"`,
          "success"
        );
      }
      if (result.failed > 0) {
        const detail = result.errors[0] ? ` — ${result.errors[0]}` : "";
        addToast(`${result.failed} failed${detail}`, "error");
      }
      if (target === "devices" && result.failed === 0 && result.accepted > 0) {
        clearSelection();
      }
    } catch (e) {
      addToast(
        `Profile assignment failed: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  const incompatible =
    target === "devices" && selectedProfile && selection.length > 0
      ? selection.filter((d) => d.platform !== selectedProfile.platform).length
      : 0;

  // Build the picker components so we can reorder cleanly
  const targetPicker =
    target === "devices" ? (
      <DeviceShuttle />
    ) : (
      <TargetPicker
        label="Smart Group"
        emptyHint="Pick destination smart group…"
        items={sgs.map((s) => ({
          id: s.id,
          primary: s.name,
          secondary: s.managedByOgName,
          meta: `${s.deviceCount} devices`,
        }))}
        selectedId={sgId}
        onSelect={setSgId}
        onLoad={loadSgs}
      />
    );

  const profilePicker = (
    <TargetPicker
      label="Profile"
      emptyHint="Pick a profile…"
      items={profiles.map((p) => ({
        id: p.id,
        primary: p.name,
        secondary: p.description,
        platform: p.platform,
        meta: p.profileType,
      }))}
      selectedId={profileId}
      onSelect={setProfileId}
      onLoad={loadProfiles}
    />
  );

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Assign profile</h1>
        <p className={shared.subtitle}>
          Push a configuration profile (WiFi, VPN, restrictions, etc.) to a list
          of devices or to all members of a smart group.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack}>
          {lockedTarget === null && (
            <div className={styles.targetSwitcher}>
              <div className={styles.targetHeader}>Target</div>
              <div className={styles.targetTabs}>
                <button
                  className={`${styles.targetTab} ${target === "devices" ? styles.targetActive : ""}`}
                  onClick={() => setTarget("devices")}
                >
                  <div className={styles.targetTitle}>Devices</div>
                  <div className={styles.targetDesc}>
                    Install on the selected devices. Calls{" "}
                    <code>POST /api/mdm/profiles/&#123;id&#125;/install</code> per
                    device.
                  </div>
                </button>
                <button
                  className={`${styles.targetTab} ${target === "smartgroup" ? styles.targetActive : ""}`}
                  onClick={() => {
                    setTarget("smartgroup");
                    loadSgs();
                  }}
                >
                  <div className={styles.targetTitle}>Smart Group</div>
                  <div className={styles.targetDesc}>
                    Assign profile to all current and future members of a smart
                    group.
                  </div>
                </button>
              </div>
            </div>
          )}

          {profileFirst ? (
            <>
              {profilePicker}
              {profileId !== null && targetPicker}
            </>
          ) : (
            <>
              {targetPicker}
              {((target === "devices" && selection.length > 0) ||
                (target === "smartgroup" && sgId !== null)) &&
                profilePicker}
            </>
          )}

          {target === "devices" && incompatible > 0 && (
            <div className={shared.result} style={{ borderLeftColor: "var(--warning)" }}>
              <div className={shared.resultRow}>
                <span className={shared.resultLabel}>Platform mismatch</span>
                <span className={shared.resultValue}>
                  {incompatible} device(s) aren&apos;t {selectedProfile?.platform} —
                  those will fail and be reported back
                </span>
              </div>
            </div>
          )}

          {lastResult && (
            <div className={shared.result}>
              <div className={shared.resultRow}>
                <span className={shared.resultLabel}>Last run</span>
                <span className={shared.resultValue}>{lastResult}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <FooterSlot className={shared.footer}>
        <span className={shared.footerInfo}>
          {ready ? (
            target === "devices" ? (
              <>
                <span className={shared.footerCount}>{selection.length}</span>
                <span>device(s) ·</span>
                <strong style={{ color: "var(--fg-0)" }}>
                  {selectedProfile?.name}
                </strong>
              </>
            ) : (
              <>
                <strong style={{ color: "var(--fg-0)" }}>
                  {selectedProfile?.name}
                </strong>
                <span>→</span>
                <strong style={{ color: "var(--fg-0)" }}>
                  {selectedSg?.name}
                </strong>
              </>
            )
          ) : (
            <span style={{ color: "var(--fg-3)" }}>
              {target === "devices"
                ? selection.length === 0
                  ? "Add devices to the selection"
                  : "Pick a profile"
                : sgId === null
                ? "Pick a smart group"
                : "Pick a profile"}
            </span>
          )}
        </span>
        <span className={shared.footerSpacer} />
        <button
          className={shared.btnPrimary}
          onClick={apply}
          disabled={!ready || busy}
        >
          {busy
            ? "Assigning…"
            : target === "devices"
              ? `Install on ${selection.length || 0} device(s)`
              : "Assign to smart group"}
        </button>
      </FooterSlot>
    </div>
  );
}
