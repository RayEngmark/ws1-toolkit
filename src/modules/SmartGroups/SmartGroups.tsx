import { useEffect, useState } from "react";
import * as api from "../../ipc/client";
import type { Device, SmartGroup } from "../../ipc/contracts";
import { useUIStore } from "../../state/uiStore";
import { NounPage } from "../../components/NounPage/NounPage";
import { FooterButton } from "../../components/NounPage/FooterButton";
import { DetailGrid } from "../../components/DetailGrid/DetailGrid";
import styles from "./SmartGroups.module.css";

export function SmartGroups() {
  const [items, setItems] = useState<SmartGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openDrawer = useUIStore((s) => s.openDrawer);

  // The listing intentionally does NOT pass the active OG: WS1's
  // `?organizationgroupid=` filter only returns SGs *managed by* that OG,
  // dropping every SG that lives at a child / sibling OG. Surfacing all
  // SGs the OAuth client can see matches what the operator expects from a
  // "Smart Groups" page; the operator-driven search box still lets them
  // narrow down by OG name.
  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    api
      .searchSmartGroups(null)
      .then((sgs) => {
        if (!cancelled) setItems(sgs);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NounPage
      title="Smart Groups"
      subtitle="The primary surface for assigning profiles and apps to fleets of devices. Pick one to see its members and bind a profile."
      items={items}
      loadError={error}
      filterPlaceholder="filter by name or OG…"
      itemKey={(sg) => sg.id}
      itemMatch={(sg, q) =>
        sg.name.toLowerCase().includes(q.toLowerCase()) ||
        sg.managedByOgName.toLowerCase().includes(q.toLowerCase())
      }
      renderRow={(sg) => (
        <>
          <span className={styles.rowName}>{sg.name}</span>
          <span className={styles.rowMeta}>
            {sg.deviceCount} devices · {sg.managedByOgName}
          </span>
        </>
      )}
      renderDetail={(sg) => <SmartGroupDetail sg={sg} />}
      renderFooter={(sg) => (
        <>
          <FooterButton
            label="Assign profile"
            onClick={() =>
              openDrawer("assign-profile-to-sg", {
                smartGroupId: sg.id,
                smartGroupName: sg.name,
              })
            }
          />
          <FooterButton
            label="Assign app"
            onClick={() => openDrawer("assign-app", { smartGroupId: sg.id })}
          />
          <FooterButton
            label="Add devices"
            onClick={() => openDrawer("add-to-sg", { smartGroupId: sg.id })}
          />
          <FooterButton
            label="Remove devices"
            onClick={() =>
              openDrawer("remove-from-sg", { smartGroupId: sg.id })
            }
          />
        </>
      )}
    />
  );
}

/**
 * Renders the standard SG metadata grid plus a member list fetched on
 * demand. Members are loaded per-pick so opening the page doesn't hammer
 * `/smartgroups/{id}/devices` for every row.
 */
function SmartGroupDetail({ sg }: { sg: SmartGroup }) {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDevices(null);
    setMemberError(null);
    api
      .getSmartGroupDevices(sg.id)
      .then((d) => {
        if (!cancelled) setDevices(d);
      })
      .catch((e) => {
        if (!cancelled)
          setMemberError(e instanceof Error ? e.message : "member load failed");
      });
    return () => {
      cancelled = true;
    };
  }, [sg.id]);

  return (
    <div className={styles.detail}>
      <DetailGrid
        title={sg.name}
        sub={`ID ${sg.id} · ${sg.criteriaType || "—"}`}
        rows={[
          { label: "ID", value: sg.id, mono: true },
          { label: "Name", value: sg.name },
          { label: "Criteria", value: sg.criteriaType },
          { label: "OG", value: sg.managedByOgName },
          { label: "OG ID", value: sg.managedByOgId, mono: true },
          { label: "Devices", value: sg.deviceCount, mono: true },
          { label: "App assignments", value: sg.appCount, mono: true },
          { label: "Profile assignments", value: sg.profileCount, mono: true },
        ]}
        raw={sg}
      />
      <section className={styles.members}>
        <header className={styles.membersHead}>
          <span>Members</span>
          <span className={styles.membersCount}>
            {devices === null
              ? "loading…"
              : `${devices.length} device${devices.length === 1 ? "" : "s"}`}
          </span>
        </header>
        {memberError ? (
          <div className={styles.membersError}>{memberError}</div>
        ) : devices === null ? null : devices.length === 0 ? (
          <div className={styles.membersEmpty}>no members</div>
        ) : (
          <ul className={styles.memberList}>
            {devices.slice(0, 200).map((d) => (
              <li key={d.id} className={styles.memberRow}>
                <span className={styles.memberName}>
                  {d.friendlyName || d.serialNumber || `device ${d.id}`}
                </span>
                <span className={styles.memberMeta}>
                  {d.serialNumber}
                  {d.platform ? ` · ${d.platform}` : ""}
                  {d.userName ? ` · ${d.userName}` : ""}
                </span>
              </li>
            ))}
            {devices.length > 200 && (
              <li className={styles.memberMore}>
                …{devices.length - 200} more
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
