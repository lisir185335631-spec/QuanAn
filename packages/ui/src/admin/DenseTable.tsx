// @quanan/ui/admin · DenseTable — virtualised 32px dense rows (PRD-11 US-022)
// Always uses @tanstack/react-virtual for smooth 100k+ row scrolling.

import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ReactNode, CSSProperties } from 'react';

export interface DenseTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T, idx: number) => ReactNode;
}

export interface DenseTableProps<T> {
  columns: DenseTableColumn<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onSort?: (key: string, dir: 'asc' | 'desc' | null) => void;
  // optional extras kept for backward-compat with existing pages
  maxHeight?: string;
  selectedKey?: string | number;
  getRowKey?: (row: T, idx: number) => string | number;
}

type SortDir = 'asc' | 'desc' | null;

const ROW_HEIGHT = 32;
const SKELETON_ROWS = 5;

// ── styles ───────────────────────────────────────────────────────────────────

const headCellStyle: CSSProperties = {
  padding: '6px 8px',
  textAlign: 'left',
  color: '#888',
  fontWeight: 500,
  fontSize: '12px',
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const cellStyle: CSSProperties = {
  padding: '4px 8px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '13px',
  color: '#e0e0e0',
  display: 'flex',
  alignItems: 'center',
  height: ROW_HEIGHT,
};

// ── sort indicator ────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc') return <span style={{ fontSize: 10, color: '#c8a84b' }}>▲</span>;
  if (dir === 'desc') return <span style={{ fontSize: 10, color: '#c8a84b' }}>▼</span>;
  return <span style={{ fontSize: 10, color: '#444' }}>⇅</span>;
}

// ── skeleton row ─────────────────────────────────────────────────────────────

function SkeletonCell({ width }: { width?: string }) {
  return (
    <div
      style={{
        height: 12,
        borderRadius: 4,
        background: 'linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%)',
        backgroundSize: '200% 100%',
        animation: 'denseSkeleton 1.4s ease infinite',
        width: width ?? '60%',
      }}
    />
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function DenseTable<T>(props: DenseTableProps<T>) {
  const {
    columns,
    data,
    loading = false,
    onRowClick,
    onSort,
    maxHeight = '600px',
    selectedKey,
    getRowKey,
  } = props;

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  const colWidths = columns.map((c) => c.width ?? '1fr').join(' ');

  const count = loading ? SKELETON_ROWS : data.length;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  function handleSort(col: DenseTableColumn<T>) {
    if (!col.sortable) return;
    let nextDir: SortDir;
    if (sortKey !== col.key) {
      nextDir = 'asc';
    } else if (sortDir === 'asc') {
      nextDir = 'desc';
    } else if (sortDir === 'desc') {
      nextDir = null;
    } else {
      nextDir = 'asc';
    }
    setSortKey(nextDir === null ? null : col.key);
    setSortDir(nextDir);
    onSort?.(col.key, nextDir);
  }

  return (
    <div style={{ fontSize: '13px', color: '#e0e0e0' }}>
      {/* skeleton animation keyframes */}
      <style>{`@keyframes denseSkeleton{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* sticky header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: colWidths,
          borderBottom: '1px solid #2a2a2a',
          background: '#111111',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            style={{
              ...headCellStyle,
              cursor: col.sortable ? 'pointer' : 'default',
            }}
            onClick={() => handleSort(col)}
          >
            {col.label}
            {col.sortable && (
              <SortIcon dir={sortKey === col.key ? sortDir : null} />
            )}
          </div>
        ))}
      </div>

      {/* scrollable virtualised body */}
      <div ref={parentRef} style={{ maxHeight, overflow: 'auto' }}>
        {!loading && data.length === 0 ? (
          <div
            style={{ padding: '16px 8px', textAlign: 'center', color: '#555', fontSize: 13 }}
          >
            无数据
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vRow) => {
              if (loading) {
                // skeleton placeholder row
                return (
                  <div
                    key={`sk-${vRow.index}`}
                    style={{
                      position: 'absolute',
                      top: vRow.start,
                      left: 0,
                      right: 0,
                      height: ROW_HEIGHT,
                      display: 'grid',
                      gridTemplateColumns: colWidths,
                      alignItems: 'center',
                      borderBottom: '1px solid #1a1a1a',
                    }}
                  >
                    {columns.map((col) => (
                      <div key={col.key} style={cellStyle}>
                        <SkeletonCell width={col.width ? '70%' : undefined} />
                      </div>
                    ))}
                  </div>
                );
              }

              const row = data[vRow.index];
              if (!row) return null;
              const rowKeyVal = getRowKey ? getRowKey(row, vRow.index) : vRow.index;
              const isSelected =
                selectedKey !== undefined && String(selectedKey) === String(rowKeyVal);

              return (
                <div
                  key={vRow.key}
                  data-index={vRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: vRow.start,
                    left: 0,
                    right: 0,
                    height: ROW_HEIGHT,
                    display: 'grid',
                    gridTemplateColumns: colWidths,
                    alignItems: 'center',
                    borderBottom: '1px solid #1a1a1a',
                    background: isSelected ? '#1e1e1e' : undefined,
                    cursor: onRowClick ? 'pointer' : undefined,
                    transition: 'background 0.1s',
                  }}
                  onClick={onRowClick ? () => onRowClick(row as T) : undefined}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background = '#1a1a1a';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background = '';
                  }}
                >
                  {columns.map((col) => (
                    <div key={col.key} style={cellStyle}>
                      {col.render
                        ? col.render(row as T, vRow.index)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
