import { useEffect, useMemo, useState } from "react";
import shared from "../../modules/_shared/ActionPage.module.css";
import styles from "./NounPage.module.css";

/**
 * Generic two-column noun page: filterable list on the left, tabbed detail
 * panel on the right. Fills the available height like LookupDevice.
 */
export interface NounPageProps<T> {
  title: string;
  subtitle?: string;
  /** null = loading. */
  items: T[] | null;
  loadError?: string | null;
  itemKey: (item: T) => string | number;
  itemMatch: (item: T, query: string) => boolean;
  renderRow: (item: T, isSelected: boolean) => React.ReactNode;
  renderDetail: (item: T) => React.ReactNode;
  filterPlaceholder?: string;
  /** Optional extra control row above the filter (e.g. an OG selector). */
  controlsSlot?: React.ReactNode;
}

export function NounPage<T>({
  title,
  subtitle,
  items,
  loadError,
  itemKey,
  itemMatch,
  renderRow,
  renderDetail,
  filterPlaceholder,
  controlsSlot,
}: NounPageProps<T>) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<T | null>(null);

  // Reset picked when items change (e.g. OG switched)
  useEffect(() => {
    setPicked(null);
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim();
    if (!q) return items;
    return items.filter((item) => itemMatch(item, q));
  }, [items, query, itemMatch]);

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>{title}</h1>
        {subtitle && <p className={shared.subtitle}>{subtitle}</p>}
      </header>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          {controlsSlot && <div className={styles.controls}>{controlsSlot}</div>}
          <div className={styles.filterRow}>
            <input
              className={styles.filter}
              type="text"
              placeholder={filterPlaceholder ?? "filter…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <div className={styles.listHeader}>
            <span>Items</span>
            <span className={styles.listCount}>
              {items === null
                ? "loading…"
                : query.trim()
                  ? `${filtered.length} / ${items.length}`
                  : `${items.length}`}
            </span>
          </div>
          <div className={styles.list}>
            {loadError ? (
              <div className={styles.error}>{loadError}</div>
            ) : items === null ? (
              <div className={styles.empty}>loading…</div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                {query.trim() ? "no matches" : "nothing here"}
              </div>
            ) : (
              filtered.map((item) => {
                const key = itemKey(item);
                const isSelected = picked !== null && itemKey(picked) === key;
                return (
                  <button
                    key={key}
                    className={`${styles.row} ${isSelected ? styles.rowPicked : ""}`}
                    onClick={() => setPicked(item)}
                  >
                    {renderRow(item, isSelected)}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.rightCol}>
          {picked ? (
            renderDetail(picked)
          ) : (
            <div className={styles.detailEmpty}>
              <span className={styles.detailEmptyText}>
                pick one on the left to see details
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
