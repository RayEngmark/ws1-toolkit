import { useDeviceStore } from "../../state/deviceStore";
import { useUIStore } from "../../state/uiStore";
import { Button } from "../../components/shared/Button/Button";
import { Input } from "../../components/shared/Input/Input";
import { Select } from "../../components/shared/Select/Select";
import { Badge } from "../../components/shared/Badge/Badge";
import { Spinner } from "../../components/shared/Spinner/Spinner";
import { EmptyState } from "../../components/shared/EmptyState/EmptyState";
import styles from "./DeviceSearch.module.css";

const SEARCH_OPTIONS = [
  { value: "Serialnumber", label: "Serial Number" },
  { value: "Username", label: "Username" },
  { value: "DeviceFriendlyName", label: "Device Name" },
  { value: "Macaddress", label: "MAC Address" },
  { value: "Imei", label: "IMEI" },
];

function complianceBadge(status: string) {
  if (status === "Compliant")
    return <Badge variant="success">Compliant</Badge>;
  if (status === "NonCompliant")
    return <Badge variant="danger">Non-Compliant</Badge>;
  return <Badge>Unknown</Badge>;
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    const now = Date.now();
    const diff = now - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return dateStr;
  }
}

export function DeviceSearch() {
  const store = useDeviceStore();
  const navigate = useUIStore((s) => s.navigate);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    store.search();
  };

  const allSelected =
    store.devices.length > 0 &&
    store.devices.every((d) => store.selectedIds.has(d.id));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Device Search</h2>
        <form className={styles.searchBar} onSubmit={handleSearch}>
          <Input
            placeholder="Enter search query..."
            value={store.searchQuery}
            onChange={(e) => store.setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            options={SEARCH_OPTIONS}
            value={store.searchBy}
            onChange={(e) => store.setSearchBy(e.target.value)}
            className={styles.searchSelect}
          />
          <Button variant="primary" type="submit" loading={store.isLoading}>
            Search
          </Button>
        </form>
      </div>

      {store.error && <div className={styles.error}>{store.error}</div>}

      {store.isLoading && store.devices.length === 0 ? (
        <div className={styles.center}>
          <Spinner />
        </div>
      ) : store.devices.length === 0 ? (
        <EmptyState
          title="No devices found"
          description="Search for devices by serial number, username, or device name"
        />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkCol}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        allSelected ? store.clearSelection() : store.selectAll()
                      }
                    />
                  </th>
                  <th>User</th>
                  <th>Device Name</th>
                  <th>Serial</th>
                  <th>Model</th>
                  <th>OS</th>
                  <th>Compliance</th>
                  <th>OG</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {store.devices.map((d) => (
                  <tr
                    key={d.id}
                    className={
                      store.selectedIds.has(d.id) ? styles.selectedRow : ""
                    }
                  >
                    <td className={styles.checkCol}>
                      <input
                        type="checkbox"
                        checked={store.selectedIds.has(d.id)}
                        onChange={() => store.toggleSelect(d.id)}
                      />
                    </td>
                    <td className={styles.userCell}>{d.userName}</td>
                    <td>{d.friendlyName}</td>
                    <td className={styles.mono}>{d.serialNumber}</td>
                    <td>{d.model}</td>
                    <td>{d.os}</td>
                    <td>{complianceBadge(d.complianceStatus)}</td>
                    <td className={styles.ogCell}>{d.ogName}</td>
                    <td className={styles.dimCell}>
                      {relativeTime(d.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.footer}>
            <div className={styles.selectionInfo}>
              {store.selectedIds.size > 0 && (
                <>
                  <span className={styles.selectionCount}>
                    {store.selectedIds.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate("tagger")}
                  >
                    Tag Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate("ogmover")}
                  >
                    Move Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={store.clearSelection}
                  >
                    Clear
                  </Button>
                </>
              )}
            </div>

            <div className={styles.pagination}>
              <span className={styles.pageInfo}>
                Showing {store.devices.length} of {store.total}
              </span>
              {store.page > 0 && (
                <Button
                  size="sm"
                  onClick={() => store.loadPage(store.page - 1)}
                >
                  Prev
                </Button>
              )}
              {(store.page + 1) * store.pageSize < store.total && (
                <Button
                  size="sm"
                  onClick={() => store.loadPage(store.page + 1)}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
