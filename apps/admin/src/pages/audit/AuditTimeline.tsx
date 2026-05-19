// PRD-11 US-017 · AuditTimeline — virtualScroll + eventCategory 颜色分类
// SHIELD: DenseTable virtualScroll={true} — useVirtualizer({ count, estimateSize:32 })
// SHIELD: payloadHash 必须在时间线条目显示

import { useMemo } from 'react';
import { DenseTable } from '@quanan/ui/admin';
import type { DenseTableColumn } from '@quanan/ui/admin';

export interface TimelineItem {
  id: number;
  eventType: string;
  eventCategory: string;
  createdAt: Date | string;
  payload: Record<string, unknown> | null;
  traceId?: string | null;
  source?: string;
  success?: boolean;
  isHighRisk?: boolean;
}

// eventCategory → color
const CAT_COLORS: Record<string, string> = {
  auth: 'var(--accent-blue, #3b82f6)',
  data_query: 'var(--text-muted, #888)',
  cross_account: 'var(--status-warn, #f59e0b)',
  cross_account_query: 'var(--status-warn, #f59e0b)',
  high_risk_action: 'var(--status-error, #ef4444)',
  security_alert: 'var(--status-error, #ef4444)',
  cost: 'var(--accent-green, #22c55e)',
  feedback: 'var(--accent-purple, #a855f7)',
};

function catColor(cat: string): string {
  return CAT_COLORS[cat] ?? 'var(--text-muted, #888)';
}

function fmtDate(d: Date | string): string {
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return String(d);
  }
}

function extractPayloadHash(payload: Record<string, unknown> | null): string {
  if (!payload) return '—';
  const h =
    (payload['payloadHash'] as string | undefined) ??
    (payload['payload_hash'] as string | undefined) ??
    (payload['hash'] as string | undefined);
  return h ? String(h).slice(0, 16) : '—';
}

interface Props {
  items: TimelineItem[];
  emptyText?: string;
  onSelect: (item: TimelineItem) => void;
  selectedId?: number;
  maxHeight?: string;
}

export function AuditTimeline({ items, onSelect, selectedId, maxHeight }: Props) {
  const columns = useMemo<DenseTableColumn<TimelineItem>[]>(
    () => [
      {
        key: 'time',
        label: '时间',
        width: '160px',
        render: (row) => (
          <span style={{ color: 'var(--text-muted, #888)', fontSize: 12, fontFamily: 'monospace' }}>
            {fmtDate(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'category',
        label: '分类',
        width: '140px',
        render: (row) => (
          <span
            style={{
              color: catColor(row.eventCategory),
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {row.eventCategory}
          </span>
        ),
      },
      {
        key: 'eventType',
        label: '事件',
        width: '200px',
        render: (row) => (
          <span style={{ color: 'var(--text-primary, #e0e0e0)', fontSize: 12 }}>
            {row.eventType}
          </span>
        ),
      },
      {
        key: 'source',
        label: '来源',
        width: '110px',
        render: (row) => (
          <span style={{ color: 'var(--text-muted, #888)', fontSize: 11 }}>
            {row.source ?? '—'}
          </span>
        ),
      },
      {
        key: 'traceId',
        label: 'traceId',
        width: '130px',
        render: (row) => (
          <span style={{ color: 'var(--text-muted, #888)', fontSize: 11, fontFamily: 'monospace' }}>
            {row.traceId ? String(row.traceId).slice(0, 12) + '…' : '—'}
          </span>
        ),
      },
      {
        // SHIELD: payloadHash 必须显示 · 法务取证用
        key: 'payloadHash',
        label: 'payloadHash',
        width: '130px',
        render: (row) => (
          <span style={{ color: 'var(--text-muted, #888)', fontSize: 11, fontFamily: 'monospace' }}>
            {extractPayloadHash(row.payload)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DenseTable<TimelineItem>
      columns={columns}
      data={items}
      onRowClick={onSelect}
      selectedKey={selectedId}
      maxHeight={maxHeight ?? '520px'}
    />
  );
}
