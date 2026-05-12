// @quanqn/ui/admin · DenseTable stub · PRD-11 填充真实实现
// 密集模式表格 · row 32px + font 13px

import type { ReactNode } from 'react';

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
}

export function DenseTable<T>({ columns, rows, keyField, emptyText = '暂无数据' }: DenseTableProps<T>) {
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
          rows.map((row) => (
            <tr
              key={String(row[keyField])}
              style={{ borderBottom: '1px solid #1a1a1a', height: '32px' }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '4px 8px' }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
