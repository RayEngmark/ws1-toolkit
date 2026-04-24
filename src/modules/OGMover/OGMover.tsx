import { useEffect } from "react";
import { useDeviceSelection } from "../../hooks/useDeviceSelection";
import { useOrgGroupStore } from "../../state/orgGroupStore";
import { useUIStore } from "../../state/uiStore";
import { Button } from "../../components/shared/Button/Button";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import type { OrgGroup } from "../../ipc/contracts";
import styles from "./OGMover.module.css";

function OGTreeNode({
  group,
  depth,
}: {
  group: OrgGroup;
  depth: number;
}) {
  const { expandedIds, selectedOgId, toggleExpand, selectGroup } =
    useOrgGroupStore();
  const isExpanded = expandedIds.has(group.id);
  const isSelected = selectedOgId === group.id;
  const hasChildren = group.children.length > 0;

  return (
    <>
      <div
        className={`${styles.treeNode} ${isSelected ? styles.treeNodeSelected : ""}`}
        style={{ paddingLeft: depth * 20 + 12 }}
        onClick={() => selectGroup(group.id)}
      >
        <button
          className={styles.expandBtn}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(group.id);
          }}
        >
          {hasChildren || !isExpanded ? (isExpanded ? "\u25BC" : "\u25B6") : "\u00A0"}
        </button>
        <span className={styles.treeLabel}>{group.name}</span>
        <span className={styles.treeType}>{group.ogType}</span>
      </div>
      {isExpanded &&
        group.children.map((child) => (
          <OGTreeNode key={child.id} group={child} depth={depth + 1} />
        ))}
    </>
  );
}

export function OGMover() {
  const { selectedDevices, hasSelection } = useDeviceSelection();
  const ogStore = useOrgGroupStore();
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useUIStore((s) => s.navigate);

  useEffect(() => {
    if (ogStore.groups.length === 0) {
      ogStore.loadGroups();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedGroup = ogStore.selectedOgId
    ? findGroup(ogStore.groups, ogStore.selectedOgId)
    : null;

  const handleMove = async () => {
    if (!ogStore.selectedOgId) return;
    const deviceIds = selectedDevices.map((d) => d.id);
    const result = await ogStore.moveDevices(deviceIds, ogStore.selectedOgId);
    if (result.accepted > 0) {
      addToast(
        `Moved ${result.accepted} device(s) to "${selectedGroup?.name}"`,
        "success"
      );
    }
    if (result.failed > 0) {
      addToast(`Failed to move ${result.failed} device(s)`, "error");
    }
  };

  if (!hasSelection) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="No devices selected"
          description="Go to Device Search and select devices to move"
        />
        <div className={styles.backBtn}>
          <Button onClick={() => navigate("devices")}>Go to Device Search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.split}>
        {/* Left: Selected devices */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
              Selected Devices ({selectedDevices.length})
            </h3>
          </div>
          <div className={styles.deviceList}>
            {selectedDevices.map((d) => (
              <div key={d.id} className={styles.deviceItem}>
                <div className={styles.deviceName}>{d.friendlyName}</div>
                <div className={styles.deviceMeta}>
                  {d.userName} &middot; {d.serialNumber}
                </div>
                <div className={styles.deviceOg}>Current OG: {d.ogName}</div>
              </div>
            ))}
          </div>
          <div className={styles.panelFooter}>
            <Button size="sm" variant="ghost" onClick={() => navigate("devices")}>
              Back to Search
            </Button>
          </div>
        </div>

        {/* Center: OG Tree */}
        <div className={`${styles.panel} ${styles.treePanel}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Organization Groups</h3>
          </div>
          {ogStore.isLoading ? (
            <div className={styles.center}>
              <Spinner />
            </div>
          ) : ogStore.groups.length === 0 ? (
            <div className={styles.center}>
              <span className={styles.dim}>No groups found</span>
            </div>
          ) : (
            <div className={styles.treeWrap}>
              {ogStore.groups.map((g) => (
                <OGTreeNode key={g.id} group={g} depth={0} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Move summary */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Move Summary</h3>
          </div>
          <div className={styles.summary}>
            {selectedGroup ? (
              <>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Target OG</span>
                  <span className={styles.summaryValue}>{selectedGroup.name}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Devices to move</span>
                  <span className={styles.summaryValue}>
                    {selectedDevices.length}
                  </span>
                </div>
                <div className={styles.warning}>
                  Moving devices will change their profile and policy assignments.
                  Make sure the target OG has the correct profiles configured.
                </div>
                <Button
                  variant="primary"
                  onClick={handleMove}
                  loading={ogStore.isMoving}
                >
                  Move {selectedDevices.length} Device(s)
                </Button>
              </>
            ) : (
              <div className={styles.dim}>
                Select an Organization Group from the tree to move devices
              </div>
            )}

            {ogStore.lastResult && (
              <div className={styles.result}>
                <div className={styles.resultLine}>
                  Accepted: {ogStore.lastResult.accepted}
                </div>
                {ogStore.lastResult.failed > 0 && (
                  <div className={styles.resultError}>
                    Failed: {ogStore.lastResult.failed}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function findGroup(groups: OrgGroup[], id: number): OrgGroup | null {
  for (const g of groups) {
    if (g.id === id) return g;
    const found = findGroup(g.children, id);
    if (found) return found;
  }
  return null;
}
