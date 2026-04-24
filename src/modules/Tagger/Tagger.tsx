import { useState } from "react";
import { useDeviceSelection } from "../../hooks/useDeviceSelection";
import { useTagStore } from "../../state/tagStore";
import { useUIStore } from "../../state/uiStore";
import { Button } from "../../components/shared/Button/Button";
import { Input } from "../../components/shared/Input/Input";
import { Badge } from "../../components/shared/Badge/Badge";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import styles from "./Tagger.module.css";

export function Tagger() {
  const { selectedDevices, hasSelection } = useDeviceSelection();
  const tagStore = useTagStore();
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useUIStore((s) => s.navigate);
  const [ogIdInput, setOgIdInput] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const handleLoadTags = () => {
    const ogId = Number.parseInt(ogIdInput, 10);
    if (!Number.isNaN(ogId)) {
      tagStore.loadTags(ogId);
    }
  };

  const handleAddTags = async () => {
    const deviceIds = selectedDevices.map((d) => d.id);
    for (const tagId of tagStore.selectedTagIds) {
      const result = await tagStore.addTagsToDevices(tagId, deviceIds);
      if (result.accepted > 0) {
        const tag = tagStore.availableTags.find((t) => t.id === tagId);
        addToast(
          `Added "${tag?.tagName}" to ${result.accepted} device(s)`,
          "success"
        );
      }
      if (result.failed > 0) {
        addToast(`Failed to tag ${result.failed} device(s)`, "error");
      }
    }
    tagStore.clearTagSelection();
  };

  const handleRemoveTags = async () => {
    const deviceIds = selectedDevices.map((d) => d.id);
    for (const tagId of tagStore.selectedTagIds) {
      const result = await tagStore.removeTagsFromDevices(tagId, deviceIds);
      if (result.accepted > 0) {
        const tag = tagStore.availableTags.find((t) => t.id === tagId);
        addToast(
          `Removed "${tag?.tagName}" from ${result.accepted} device(s)`,
          "success"
        );
      }
      if (result.failed > 0) {
        addToast(`Failed to remove tags from ${result.failed} device(s)`, "error");
      }
    }
    tagStore.clearTagSelection();
  };

  const filteredTags = tagStore.availableTags.filter((t) =>
    t.tagName.toLowerCase().includes(tagFilter.toLowerCase())
  );

  if (!hasSelection) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="No devices selected"
          description="Go to Device Search and select devices to tag"
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
                <div className={styles.deviceOg}>{d.ogName}</div>
              </div>
            ))}
          </div>
          <div className={styles.panelFooter}>
            <Button size="sm" variant="ghost" onClick={() => navigate("devices")}>
              Back to Search
            </Button>
          </div>
        </div>

        {/* Right: Tags */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Available Tags</h3>
          </div>
          <div className={styles.tagControls}>
            <div className={styles.ogInput}>
              <Input
                placeholder="OG ID"
                value={ogIdInput}
                onChange={(e) => setOgIdInput(e.target.value)}
              />
              <Button size="sm" onClick={handleLoadTags} loading={tagStore.isLoading}>
                Load Tags
              </Button>
            </div>
            {tagStore.availableTags.length > 0 && (
              <Input
                placeholder="Filter tags..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              />
            )}
          </div>

          {tagStore.isLoading ? (
            <div className={styles.center}>
              <Spinner />
            </div>
          ) : tagStore.availableTags.length === 0 ? (
            <div className={styles.tagEmpty}>
              Enter an Organization Group ID and click Load Tags
            </div>
          ) : (
            <div className={styles.tagList}>
              {filteredTags.map((tag) => (
                <label key={tag.id} className={styles.tagItem}>
                  <input
                    type="checkbox"
                    checked={tagStore.selectedTagIds.has(tag.id)}
                    onChange={() => tagStore.toggleTag(tag.id)}
                  />
                  <span className={styles.tagName}>{tag.tagName}</span>
                  <Badge>{tag.deviceCount} devices</Badge>
                </label>
              ))}
            </div>
          )}

          {tagStore.selectedTagIds.size > 0 && (
            <div className={styles.tagActions}>
              <Button variant="primary" onClick={handleAddTags}>
                Add {tagStore.selectedTagIds.size} Tag(s) to {selectedDevices.length} Device(s)
              </Button>
              <Button variant="danger" onClick={handleRemoveTags}>
                Remove Tag(s)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
