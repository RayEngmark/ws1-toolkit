import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, XIcon, ChevronDown } from "../../lib/icons";
import styles from "./TargetPicker.module.css";

export interface TargetItem {
  id: number;
  primary: string;
  secondary?: string;
  tertiary?: string;
  meta?: string;
  platform?: string;
}

interface Props {
  label: string;
  emptyHint: string;
  items: TargetItem[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  loading?: boolean;
  onLoad?: () => void;
}

export function TargetPicker({
  label,
  emptyHint,
  items,
  selectedId,
  onSelect,
  loading,
  onLoad,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.primary.toLowerCase().includes(q) ||
        i.secondary?.toLowerCase().includes(q) ||
        i.tertiary?.toLowerCase().includes(q) ||
        i.platform?.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      if (items.length === 0 && !loading && onLoad) onLoad();
    } else {
      setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className={styles.picker} ref={ref}>
      <div className={styles.header}>
        <span className={styles.title}>{label}</span>
      </div>

      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {selected ? (
          <span className={styles.selectedView}>
            <span className={styles.selectedPrimary}>{selected.primary}</span>
            {selected.secondary && (
              <span className={styles.selectedSecondary}>
                {selected.secondary}
              </span>
            )}
          </span>
        ) : (
          <span className={styles.placeholder}>{emptyHint}</span>
        )}
        <span className={styles.triggerRight}>
          {selected && (
            <span
              className={styles.clearOne}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              title="Clear"
            >
              <XIcon size={12} />
            </span>
          )}
          <ChevronDown size={12} />
        </span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.searchField}>
            <span className={styles.searchIcon}>
              <SearchIcon size={12} />
            </span>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder={`Filter ${label.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className={styles.list}>
            {loading ? (
              <div className={styles.loading}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>No matches</div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.item} ${item.id === selectedId ? styles.itemSelected : ""}`}
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <span className={styles.itemPrimary}>{item.primary}</span>
                  {item.secondary && (
                    <span className={styles.itemSecondary}>{item.secondary}</span>
                  )}
                  <span className={styles.itemRight}>
                    {item.platform && (
                      <span className={styles.itemPlatform}>{item.platform}</span>
                    )}
                    {item.meta && (
                      <span className={styles.itemMeta}>{item.meta}</span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
