// @quanqn/ui/admin · DenseTable — dense 32px rows + optional virtualScroll
// virtualScroll: true → useVirtualizer; false (default) → plain DOM render

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ReactNode, CSSProperties } from 'react';

export interface DenseTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

interface DenseTableProps<T> {
  columns: DenseTableColumn<T>[];
  rows: T[];
  keyField: keyof T;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number;
  /** Enable virtual scrolling for large datasets (1000+ rows). Requires maxHeight. */
  virtualScroll?: boolean;
  /** Container max-height for virtual scroll (default '600px') */
  maxHeight?: string;
}

const ROW_HEIGHT = 32;

const headThStyle: CSSProperties = {
  padding: '6px 8px',
  textAlign: 'left',
  color: '#888',
  fontWeight: 500,
  fontSize: '12px',
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const cellStyle: CSSProperties = {
  padding: '4px 8px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function VirtualTable<T>({
  columns,
  rows,
  keyField,
  onRowClick,
  selectedKey,
  maxHeight = '600px',
  emptyText = '暂无数据',
}: Omit<DenseTableProps<T>, 'virtualScroll'>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const colWidths = columns.map((c) => c.width ?? '1fr').join(' ');

  return (
    <div style={{ fontSize: '13px', color: '#e0e0e0' }}>
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
          <div key={col.key} style={headThStyle}>
            {col.header}
          </div>
        ))}
      </div>
      {/* scrollable body */}
      <div
        ref={parentRef}
        style={{ maxHeight, overflow: 'auto' }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: '16px 8px', textAlign: 'center', color: '#555' }}>
            {emptyText}
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = rows[vRow.index];
              if (!row) return null;
              const key = String(row[keyField]);
              const isSelected = selectedKey !== undefined && String(selectedKey) === key;
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
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#1a1a1a';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = '';
                  }}
                >
                  {columns.map((col) => (
                    <div key={col.key} style={cellStyle}>
                      {col.render(row as T)}
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

function PlainTable<T>({
  columns,
  rows,
  keyField,
  onRowClick,
  selectedKey,
  emptyText = '暂无数据',
}: Omit<DenseTableProps<T>, 'virtualScroll' | 'maxHeight'>) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
        color: '#e0e0e0',
      }}
    >
      <thead>
        <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
          {columns.map((col) => (
            <th
              key={col.key}
              style={{
                padding: '6px 8px',
                textAlign: 'left',
                color: '#888',
                fontWeight: 500,
                width: col.width,
              }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              style={{ padding: '16px 8px', textAlign: 'center', color: '#555' }}
            >
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const key = String(row[keyField]);
            const isSelected = selectedKey !== undefined && String(selectedKey) === key;
            return (
              <tr
                key={key}
                style={{
                  borderBottom: '1px solid #1a1a1a',
                  height: `${ROW_HEIGHT}px`,
                  background: isSelected ? '#1e1e1e' : undefined,
                  cursor: onRowClick ? 'pointer' : undefined,
                }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: '4px 8px' }}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export function DenseTable<T>(props: DenseTableProps<T>) {
  const { virtualScroll, ...rest } = props;
  if (virtualScroll) {
    return <VirtualTable {...rest} />;
  }
  return <PlainTable {...rest} />;
}
