// PRD-12 US-005 · ReviewTrendingTable
// DenseTable from @quanqn/ui/admin · virtualScroll
// Columns: queueId / platform / sourceUrl / autoVerdict / status / fetchedAt / 操作

import { useMemo } from 'react';
import { DenseTable } from '@quanqn/ui/admin';
import type { DenseTableColumn } from '@quanqn/ui/admin';

export type QueueRow = {
  id: number;
  sourcePlatform: string;
  sourceItemId: string;
  sourceUrl: string;
  autoVerdict: string;
  status: string;
  reviewerAdminId: number | null;
  reviewedAt: Date | null;
  rejectReason: string | null;
  trendingItemId: number | null;
  fetchedAt: Date;
};

function statusColor(status: string): string {
  switch (status) {
    case 'pending': return 'var(--status-warn)';
    case 'approved': return 'var(--status-ok)';
    case 'rejected': return 'var(--status-err)';
    case 'auto_approved': return 'var(--accent-green)';
    case 'auto_rejected': return 'var(--accent-purple)';
    default: return 'var(--text-muted)';
  }
}

function verdictColor(verdict: string): string {
  switch (verdict) {
    case 'auto_approved': return 'var(--status-ok)';
    case 'auto_rejected': return 'var(--status-err)';
    case 'needs_review': return 'var(--status-warn)';
    default: return 'var(--text-muted)';
  }
}

function StatusBadge({ value }: { value: string }) {
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已驳回',
    auto_approved: '自动批准',
    auto_rejected: '自动驳回',
  };
  return (
    <span
      style={{
        fontSize: 10,
        color: statusColor(value),
        border: `1px solid ${statusColor(value)}44`,
        padding: '1px 5px',
        borderRadius: 3,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {labels[value] ?? value}
    </span>
  );
}

function VerdictBadge({ value }: { value: string }) {
  const labels: Record<string, string> = {
    auto_approved: '自动批准',
    auto_rejected: '自动驳回',
    needs_review: '需人工',
  };
  return (
    <span
      style={{
        fontSize: 10,
        color: verdictColor(value),
        border: `1px solid ${verdictColor(value)}44`,
        padding: '1px 5px',
        borderRadius: 3,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {labels[value] ?? value}
    </span>
  );
}

interface Props {
  data: QueueRow[];
  loading: boolean;
  isError: boolean;
  onRefetch: () => void;
  onRowClick: (row: QueueRow) => void;
  selectedId: number | null;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
}

export function ReviewTrendingTable({
  data,
  loading,
  isError,
  onRefetch,
  onRowClick,
  selectedId,
  selectedIds,
  onToggleSelect,
}: Props) {
  const showCheckboxes = selectedIds !== undefined && onToggleSelect !== undefined;

  const columns = useMemo((): DenseTableColumn<QueueRow>[] => {
    const checkboxCol: DenseTableColumn<QueueRow> = {
      key: 'select',
      label: '',
      width: '36px',
      render: (row) => (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
        >
          <input
            type="checkbox"
            checked={selectedIds?.has(row.id) ?? false}
            onChange={() => onToggleSelect?.(row.id)}
            style={{ cursor: 'pointer', accentColor: 'var(--gold)', width: 14, height: 14 }}
          />
        </div>
      ),
    };

    const baseCols: DenseTableColumn<QueueRow>[] = [
    {
      key: 'id',
      label: 'ID',
      width: '60px',
      render: (row) => <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>#{row.id}</span>,
    },
    {
      key: 'sourcePlatform',
      label: '平台',
      width: '80px',
      render: (row) => <span style={{ color: 'var(--accent-blue)', fontSize: 12 }}>{row.sourcePlatform}</span>,
    },
    {
      key: 'sourceUrl',
      label: '来源 URL',
      render: (row) => (
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            maxWidth: 240,
          }}
          title={row.sourceUrl}
        >
          {row.sourceUrl}
        </span>
      ),
    },
    {
      key: 'autoVerdict',
      label: '自动判定',
      width: '100px',
      render: (row) => <VerdictBadge value={row.autoVerdict} />,
    },
    {
      key: 'status',
      label: '状态',
      width: '90px',
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: 'fetchedAt',
      label: '抓取时间',
      width: '120px',
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(String(row.fetchedAt)).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      width: '72px',
      render: () => (
        <span style={{ fontSize: 11, color: 'var(--gold)', cursor: 'pointer' }}>详情 →</span>
      ),
    },
  ];

    return showCheckboxes ? [checkboxCol, ...baseCols] : baseCols;
  }, [showCheckboxes, selectedIds, onToggleSelect]);

  if (isError) {
    return (
      <div
        style={{
          padding: 16,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--status-err)',
          fontSize: 13,
        }}
      >
        数据加载失败 ·{' '}
        <button
          type="button"
          onClick={() => void onRefetch()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gold-text)',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: 13,
          }}
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {!loading && data.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          暂无待审核内容 · TrendingScraper 抓回后自动入队
        </div>
      ) : (
        <DenseTable
          columns={columns}
          data={data}
          loading={loading}
          maxHeight="calc(100vh - 420px)"
          onRowClick={onRowClick}
          selectedKey={selectedId ?? undefined}
          getRowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
