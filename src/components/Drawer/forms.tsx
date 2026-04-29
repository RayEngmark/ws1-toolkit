import { useEffect, useState } from "react";
import * as api from "../../ipc/client";
import type {
  AppPushMode,
  BulkActionResult,
  Device,
  OrgGroup,
  Profile,
  SmartGroup,
  Tag,
} from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import { useScopeStore } from "../../state/scopeStore";
import { TargetPicker, type TargetItem } from "../TargetPicker/TargetPicker";
import { Drawer } from "./Drawer";
import { DeviceListInput } from "./DeviceListInput";
import styles from "./forms.module.css";

/* -------------------- Apply / Remove tag -------------------- */

export function ApplyTagDrawer({
  ctx,
}: {
  ctx: { deviceIds?: number[]; tagId?: number; mode?: "add" | "remove" };
}) {
  const close = useUIStore((s) => s.closeDrawer);
  const addToast = useUIStore((s) => s.addToast);
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [busy, setBusy] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagId, setTagId] = useState<number | null>(ctx.tagId ?? null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [result, setResult] = useState<BulkActionResult | null>(null);
  const lockedDeviceIds = ctx.deviceIds;
  const mode = ctx.mode ?? "add";

  useEffect(() => {
    if (!ctx.tagId && activeOgId !== null) {
      api.getTags(activeOgId).then(setTags);
    }
  }, [ctx.tagId, activeOgId]);

  const deviceIds = lockedDeviceIds ?? devices.map((d) => d.id);
  const ready = tagId !== null && deviceIds.length > 0 && !busy;

  const fire = async () => {
    if (!tagId) return;
    setBusy(true);
    setResult(null);
    try {
      const res =
        mode === "remove"
          ? await api.removeTagsFromDevices(tagId, deviceIds)
          : await api.addTagsToDevices(tagId, deviceIds);
      setResult(res);
      addToast(
        `${mode === "remove" ? "Removed" : "Applied"} tag on ${res.accepted}/${res.total} devices`,
        res.failed === 0 ? "success" : "warning"
      );
      // Only close on a clean run — leave the drawer open with the result
      // panel showing on partial or full failure so the operator can read
      // why each device was rejected.
      if (res.failed === 0 && res.accepted === res.total) close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult({
        total: deviceIds.length,
        accepted: 0,
        failed: deviceIds.length,
        errors: [msg],
      });
      addToast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title={mode === "remove" ? "Remove tag" : "Apply tag"}
      footer={
        <ConfirmFooter
          ready={ready}
          busy={busy}
          onFire={fire}
          label={mode === "remove" ? "Remove tag" : "Apply tag"}
          dismissLabel={result ? "Close" : "Cancel"}
        />
      }
    >
      {!ctx.tagId && (
        <TargetPicker
          label="Tag"
          emptyHint="pick a tag"
          items={tags.map(toTagItem)}
          selectedId={tagId}
          onSelect={setTagId}
        />
      )}
      {!lockedDeviceIds && (
        <FormSection label="Devices">
          <DeviceListInput onResolved={setDevices} />
        </FormSection>
      )}
      {lockedDeviceIds && (
        <FormSection label="Devices">
          <span className={styles.locked}>{lockedDeviceIds.length} selected</span>
        </FormSection>
      )}
      {result && <BulkResultPanel result={result} verb={mode === "remove" ? "removed" : "applied"} />}
    </Drawer>
  );
}

/* -------------------- Move to OG -------------------- */

export function MoveOgDrawer({
  ctx,
}: {
  ctx: { deviceIds?: number[]; targetOgId?: number };
}) {
  const close = useUIStore((s) => s.closeDrawer);
  const addToast = useUIStore((s) => s.addToast);
  const [busy, setBusy] = useState(false);
  const [ogs, setOgs] = useState<OrgGroup[]>([]);
  const [targetOgId, setTargetOgId] = useState<number | null>(
    ctx.targetOgId ?? null
  );
  const [devices, setDevices] = useState<Device[]>([]);
  const lockedDeviceIds = ctx.deviceIds;

  useEffect(() => {
    if (!ctx.targetOgId) api.searchOrgGroups().then((tree) => setOgs(flatten(tree)));
  }, [ctx.targetOgId]);

  const deviceIds = lockedDeviceIds ?? devices.map((d) => d.id);
  const ready = targetOgId !== null && deviceIds.length > 0 && !busy;

  const fire = async () => {
    if (!targetOgId) return;
    setBusy(true);
    try {
      const res = await api.bulkMoveDevices(deviceIds, targetOgId);
      addToast(
        `Moved ${res.accepted}/${res.total} devices`,
        res.failed === 0 ? "success" : "warning"
      );
      close();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title="Move to organization group"
      footer={<ConfirmFooter ready={ready} busy={busy} onFire={fire} label="Move" />}
    >
      {!ctx.targetOgId && (
        <TargetPicker
          label="Target OG"
          emptyHint="pick an OG"
          items={ogs.map(toOgItem)}
          selectedId={targetOgId}
          onSelect={setTargetOgId}
        />
      )}
      {!lockedDeviceIds && (
        <FormSection label="Devices">
          <DeviceListInput onResolved={setDevices} />
        </FormSection>
      )}
      {lockedDeviceIds && (
        <FormSection label="Devices">
          <span className={styles.locked}>{lockedDeviceIds.length} selected</span>
        </FormSection>
      )}
    </Drawer>
  );
}

/* -------------------- Add to / Remove from Smart Group -------------------- */

export function SmartGroupMembershipDrawer({
  ctx,
}: {
  ctx: { deviceIds?: number[]; smartGroupId?: number; mode: "add" | "remove" };
}) {
  const close = useUIStore((s) => s.closeDrawer);
  const addToast = useUIStore((s) => s.addToast);
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [busy, setBusy] = useState(false);
  const [sgs, setSgs] = useState<SmartGroup[]>([]);
  const [sgId, setSgId] = useState<number | null>(ctx.smartGroupId ?? null);
  const [devices, setDevices] = useState<Device[]>([]);
  const lockedDeviceIds = ctx.deviceIds;
  const isRemove = ctx.mode === "remove";

  useEffect(() => {
    if (!ctx.smartGroupId) api.searchSmartGroups(activeOgId).then(setSgs);
  }, [ctx.smartGroupId, activeOgId]);

  const deviceIds = lockedDeviceIds ?? devices.map((d) => d.id);
  const ready = sgId !== null && deviceIds.length > 0 && !busy;

  const fire = async () => {
    if (!sgId) return;
    setBusy(true);
    try {
      const res = isRemove
        ? await api.removeDevicesFromSmartGroup(sgId, deviceIds)
        : await api.addDevicesToSmartGroup(sgId, deviceIds);
      addToast(
        `${isRemove ? "Removed" : "Added"} ${res.accepted}/${res.total} devices`,
        res.failed === 0 ? "success" : "warning"
      );
      close();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title={isRemove ? "Remove devices from smart group" : "Add devices to smart group"}
      footer={
        <ConfirmFooter
          ready={ready}
          busy={busy}
          onFire={fire}
          label={isRemove ? "Remove" : "Add"}
        />
      }
    >
      {!ctx.smartGroupId && (
        <TargetPicker
          label="Smart group"
          emptyHint="pick a smart group"
          items={sgs.map(toSgItem)}
          selectedId={sgId}
          onSelect={setSgId}
        />
      )}
      {!lockedDeviceIds && (
        <FormSection label="Devices">
          <DeviceListInput onResolved={setDevices} />
        </FormSection>
      )}
      {lockedDeviceIds && (
        <FormSection label="Devices">
          <span className={styles.locked}>{lockedDeviceIds.length} selected</span>
        </FormSection>
      )}
    </Drawer>
  );
}

/* -------------------- Assign profile (per-device) -------------------- */

export function AssignProfileDrawer({
  ctx,
}: {
  ctx: {
    profileId?: number;
    profileName?: string;
    deviceIds?: number[];
    serialNumbers?: string[];
  };
}) {
  const close = useUIStore((s) => s.closeDrawer);
  const addToast = useUIStore((s) => s.addToast);
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [busy, setBusy] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const profileLocked = ctx.profileId !== undefined;
  const [profileId, setProfileId] = useState<number | null>(
    ctx.profileId ?? null
  );
  const [devices, setDevices] = useState<Device[]>([]);
  const [result, setResult] = useState<BulkActionResult | null>(null);
  const lockedDeviceIds = ctx.deviceIds;

  useEffect(() => {
    if (!profileLocked) api.getProfiles(activeOgId).then(setProfiles);
  }, [profileLocked, activeOgId]);

  // For per-device profile install we need serials. If devices were
  // resolved here (paste list), we have them. If lockedDeviceIds came
  // from a Devices-page selection, we need to look them up.
  const [lockedSerials, setLockedSerials] = useState<string[] | null>(null);
  useEffect(() => {
    if (!lockedDeviceIds) {
      setLockedSerials(null);
      return;
    }
    // We have ids only — fetch serials. Simplest: every Devices-page
    // selection already has serials in selectionStore, so caller passes
    // them. But to be defensive, surface a clear note if missing.
    setLockedSerials(null);
  }, [lockedDeviceIds]);

  // Caller is responsible for passing serials when locking devices.
  const lockedSerialsFromCtx = ctx.serialNumbers;
  const serials =
    lockedSerialsFromCtx ??
    lockedSerials ??
    devices.map((d) => d.serialNumber).filter(Boolean);
  const ready = profileId !== null && serials.length > 0 && !busy;

  const fire = async () => {
    if (profileId === null) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await api.installProfileOnDevices(profileId, serials);
      setResult(res);
      addToast(
        `Installed on ${res.accepted}/${res.total} devices`,
        res.failed === 0 ? "success" : "warning"
      );
      if (res.failed === 0 && res.accepted === res.total) close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult({
        total: serials.length,
        accepted: 0,
        failed: serials.length,
        errors: [msg],
      });
      addToast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title="Install profile on devices"
      footer={
        <ConfirmFooter
          ready={ready}
          busy={busy}
          onFire={fire}
          label="Install"
          dismissLabel={result ? "Close" : "Cancel"}
        />
      }
    >
      {profileLocked ? (
        <FormSection label="Profile">
          <span className={styles.locked}>
            {ctx.profileName ?? `Profile ${ctx.profileId}`}
          </span>
        </FormSection>
      ) : (
        <TargetPicker
          label="Profile"
          emptyHint="pick a profile"
          items={profiles.map(toProfileItem)}
          selectedId={profileId}
          onSelect={setProfileId}
        />
      )}
      {!lockedDeviceIds && (
        <FormSection label="Devices">
          <DeviceListInput onResolved={setDevices} />
        </FormSection>
      )}
      {lockedDeviceIds && (
        <FormSection label="Devices">
          <span className={styles.locked}>
            {lockedDeviceIds.length} selected
            {lockedSerialsFromCtx === undefined &&
              " — caller must pass serial numbers"}
          </span>
        </FormSection>
      )}
      {result && <BulkResultPanel result={result} verb="installed" />}
    </Drawer>
  );
}

/* -------------------- Assign profile to a Smart Group -------------------- */

/**
 * Bind a profile's assignment to a smart group via the documented
 * `PUT /api/mdm/profiles/resources/editassignment/{id}` flow. Idempotent —
 * re-binding an already-assigned SG is a no-op rather than a duplicate.
 *
 * Lock behaviour:
 *   - smartGroupId locked → operator only picks the profile (entered from SG)
 *   - profileId locked    → operator only picks the SG (entered from Profile)
 */
export function AssignProfileToSgDrawer({
  ctx,
}: {
  ctx: {
    profileId?: number;
    profileName?: string;
    smartGroupId?: number;
    smartGroupName?: string;
  };
}) {
  const addToast = useUIStore((s) => s.addToast);
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [busy, setBusy] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sgs, setSgs] = useState<SmartGroup[]>([]);
  const profileLocked = ctx.profileId !== undefined;
  const sgLocked = ctx.smartGroupId !== undefined;
  const [profileId, setProfileId] = useState<number | null>(
    ctx.profileId ?? null
  );
  const [sgId, setSgId] = useState<number | null>(ctx.smartGroupId ?? null);
  const [result, setResult] = useState<{
    ok: boolean;
    detail: string;
  } | null>(null);

  useEffect(() => {
    if (!profileLocked) api.getProfiles(activeOgId).then(setProfiles);
    if (!sgLocked) api.searchSmartGroups(null).then(setSgs);
  }, [profileLocked, sgLocked, activeOgId]);

  const ready = profileId !== null && sgId !== null && !busy;
  const profileLabel =
    ctx.profileName ??
    profiles.find((p) => p.id === profileId)?.name ??
    (profileId !== null ? `Profile ${profileId}` : "");
  const sgLabel =
    ctx.smartGroupName ??
    sgs.find((s) => s.id === sgId)?.name ??
    (sgId !== null ? `Smart group ${sgId}` : "");

  const fire = async () => {
    if (profileId === null || sgId === null) return;
    setBusy(true);
    setResult(null);
    try {
      await api.assignProfileToSmartGroup(profileId, sgId);
      const detail = `"${profileLabel}" → "${sgLabel}"`;
      setResult({ ok: true, detail: `Assigned ${detail}` });
      addToast(`Assigned profile to smart group`, "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult({ ok: false, detail: msg });
      addToast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title="Assign profile to smart group"
      footer={
        <ConfirmFooter
          ready={ready}
          busy={busy}
          onFire={fire}
          label="Assign"
          dismissLabel={result ? "Close" : "Cancel"}
        />
      }
    >
      {profileLocked ? (
        <FormSection label="Profile">
          <span className={styles.locked}>
            {ctx.profileName ?? `Profile ${ctx.profileId}`}
          </span>
        </FormSection>
      ) : (
        <TargetPicker
          label="Profile"
          emptyHint="pick a profile"
          items={profiles.map(toProfileItem)}
          selectedId={profileId}
          onSelect={setProfileId}
        />
      )}
      {sgLocked ? (
        <FormSection label="Smart group">
          <span className={styles.locked}>
            {ctx.smartGroupName ?? `Smart group ${ctx.smartGroupId}`}
          </span>
        </FormSection>
      ) : (
        <TargetPicker
          label="Smart group"
          emptyHint="pick a smart group"
          items={sgs.map(toSgItem)}
          selectedId={sgId}
          onSelect={setSgId}
        />
      )}
      {result && (
        <div
          className={`${styles.result} ${result.ok ? styles.resultOk : styles.resultFail}`}
        >
          <div className={styles.resultHead}>
            <span>{result.detail}</span>
          </div>
        </div>
      )}
    </Drawer>
  );
}

/* -------------------- Create tag -------------------- */

export function CreateTagDrawer({
  ctx,
}: {
  ctx: { ogId?: number };
}) {
  const close = useUIStore((s) => s.closeDrawer);
  const addToast = useUIStore((s) => s.addToast);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [ogs, setOgs] = useState<OrgGroup[]>([]);
  const [ogId, setOgId] = useState<number | null>(ctx.ogId ?? null);

  useEffect(() => {
    api.searchOrgGroups().then((tree) => {
      const flat = flatten(tree);
      setOgs(flat);
      if (ogId === null && flat.length > 0) setOgId(flat[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = name.trim().length > 0 && ogId !== null && !busy;

  const fire = async () => {
    if (!ogId) return;
    setBusy(true);
    try {
      const tag = await api.createTag(name.trim(), ogId);
      addToast(`Created tag "${tag.tagName}"`, "success");
      close();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "create failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title="New tag"
      footer={<ConfirmFooter ready={ready} busy={busy} onFire={fire} label="Create" />}
    >
      <FormSection label="Name">
        <input
          className={styles.textInput}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Loaner · Staff laptops · Q3 imaged"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </FormSection>
      <TargetPicker
        label="Organization group"
        emptyHint="pick the OG this tag belongs to"
        items={ogs.map(toOgItem)}
        selectedId={ogId}
        onSelect={setOgId}
      />
    </Drawer>
  );
}

/* -------------------- Assign app to smart group -------------------- */

export function AssignAppDrawer({
  ctx,
}: {
  ctx: { appId?: number; smartGroupId?: number };
}) {
  const close = useUIStore((s) => s.closeDrawer);
  const addToast = useUIStore((s) => s.addToast);
  const activeOgId = useScopeStore((s) => s.activeOgId);
  const [busy, setBusy] = useState(false);
  const [apps, setApps] = useState<TargetItem[]>([]);
  const [sgs, setSgs] = useState<SmartGroup[]>([]);
  const [appId, setAppId] = useState<number | null>(ctx.appId ?? null);
  const [sgId, setSgId] = useState<number | null>(ctx.smartGroupId ?? null);
  const [pushMode, setPushMode] = useState<AppPushMode>("Auto");

  useEffect(() => {
    if (!ctx.appId) api.getApps(activeOgId).then((a) => setApps(a.map(toAppItem)));
    if (!ctx.smartGroupId) api.searchSmartGroups(activeOgId).then(setSgs);
  }, [ctx.appId, ctx.smartGroupId, activeOgId]);

  const ready = appId !== null && sgId !== null && !busy;

  const fire = async () => {
    if (!appId || !sgId) return;
    setBusy(true);
    try {
      const res = await api.assignAppToSmartGroup(appId, [sgId], pushMode);
      addToast(
        res.failed === 0
          ? `Assigned (${pushMode})`
          : `Failed: ${res.errors[0] ?? "unknown"}`,
        res.failed === 0 ? "success" : "error"
      );
      close();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      title="Assign app to smart group"
      footer={<ConfirmFooter ready={ready} busy={busy} onFire={fire} label="Assign" />}
    >
      {!ctx.appId && (
        <TargetPicker
          label="App"
          emptyHint="pick an app"
          items={apps}
          selectedId={appId}
          onSelect={setAppId}
        />
      )}
      {!ctx.smartGroupId && (
        <TargetPicker
          label="Smart group"
          emptyHint="pick a smart group"
          items={sgs.map(toSgItem)}
          selectedId={sgId}
          onSelect={setSgId}
        />
      )}
      <FormSection label="Push mode">
        <div className={styles.toggleRow}>
          <button
            className={`${styles.toggle} ${pushMode === "Auto" ? styles.toggleOn : ""}`}
            onClick={() => setPushMode("Auto")}
            type="button"
          >
            Auto
          </button>
          <button
            className={`${styles.toggle} ${pushMode === "OnDemand" ? styles.toggleOn : ""}`}
            onClick={() => setPushMode("OnDemand")}
            type="button"
          >
            On demand
          </button>
        </div>
      </FormSection>
    </Drawer>
  );
}

/* -------------------- Shared helpers -------------------- */

function ConfirmFooter({
  ready,
  busy,
  onFire,
  label,
  dismissLabel = "Cancel",
}: {
  ready: boolean;
  busy: boolean;
  onFire: () => void;
  label: string;
  dismissLabel?: string;
}) {
  const close = useUIStore((s) => s.closeDrawer);
  return (
    <>
      <button className={styles.cancel} onClick={close} disabled={busy}>
        {dismissLabel}
      </button>
      <button
        className={styles.primary}
        onClick={onFire}
        disabled={!ready || busy}
      >
        {busy ? "…" : label}
      </button>
    </>
  );
}

/**
 * Persistent result panel for bulk actions. Shown inside the drawer body
 * after a fire — keeps WS1's per-item fault messages on screen so the
 * operator doesn't have to chase a toast that auto-dismisses in 4.5s.
 */
function BulkResultPanel({
  result,
  verb,
}: {
  result: BulkActionResult;
  verb: string;
}) {
  const tone =
    result.failed === 0 && result.accepted === result.total
      ? styles.resultOk
      : result.accepted === 0
        ? styles.resultFail
        : styles.resultPartial;
  return (
    <div className={`${styles.result} ${tone}`}>
      <div className={styles.resultHead}>
        <span>
          {verb}{" "}
          <span className={styles.resultHeadCounts}>
            {result.accepted} / {result.total}
          </span>
        </span>
        {result.failed > 0 && <span>{result.failed} failed</span>}
      </div>
      {result.errors.length > 0 && (
        <ul className={styles.resultErrors}>
          {result.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>{label}</div>
      {children}
    </div>
  );
}

function flatten(roots: OrgGroup[]): OrgGroup[] {
  const out: OrgGroup[] = [];
  const walk = (og: OrgGroup) => {
    out.push(og);
    og.children.forEach(walk);
  };
  roots.forEach(walk);
  return out;
}

function toTagItem(t: Tag): TargetItem {
  return {
    id: t.id,
    primary: t.tagName,
    meta: `ID ${t.id}`,
  };
}

function toOgItem(og: OrgGroup): TargetItem {
  return {
    id: og.id,
    primary: og.name,
    secondary: og.groupId,
    meta: og.ogType,
  };
}

function toSgItem(sg: SmartGroup): TargetItem {
  return {
    id: sg.id,
    primary: sg.name,
    secondary: sg.managedByOgName,
    meta: `${sg.deviceCount}`,
  };
}

function toProfileItem(p: Profile): TargetItem {
  return {
    id: p.id,
    primary: p.name,
    secondary: p.profileType,
    platform: p.platform,
    meta: p.ogName,
  };
}

function toAppItem(a: { id: number; name: string; bundleId: string; version: string; platform: string }): TargetItem {
  return {
    id: a.id,
    primary: a.name,
    secondary: a.bundleId,
    platform: a.platform,
    meta: a.version,
  };
}
