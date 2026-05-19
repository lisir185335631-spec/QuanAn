// PRD-12 US-010 · ReviewDeepLearnTable
// DenseTable · virtualScroll · columns: queueId/userId/fileName/fileSize/autoVerdict/status/uploadedAt/操作
// SHIELD: useVirtualizer via DenseTable · never data.map(<tr>)

import { useMemo } from 'react';
import { DenseTable } from '@quanan/ui/admin';
import type { DenseTableColumn } from '@quanan/ui/admin';

export type DeepLearnRow = {
  id: number;
  userId: number;
  accountId: number;
  fileName: string;
  fileMime: string;
  fileSize: number;
  autoVerdict: string;
  status: string;
  reviewerAdminId: number | null;
  reviewedAt: Date | null;
  rejectReason: string | null;
  archiveId: number | null;
  uploadedAt: Date;
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

const STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  approved: '已批准',
  rejected: '已驳回',
  auto_approved: '自动批准',
  auto_rejected: '自动驳回',
};

const VERDICT_LABELS: Record<string, string> = {
  auto_approved: '自动批准',
  auto_rejected: '自动驳回',
  needs_review: '需人工',
};

function Badge({ value, color, labels }: { value: string; color: string; labels: Record<string, string> }) {
  return (
    <span
      style={{
        fontSize: 10,
        color,
        border: `1px solid ${color}44`,
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  data: DeepLearnRow[];
  loading: boolean;
  isError: boolean;
  onRefetch: () => void;
  onRowClick: (row: DeepLearnRow) => void;
  selectedId: number | null;
  fileMimeFilter?: string;
}

export function ReviewDeepLearnTable({
  data,
  loading,
  isError,
  onRefetch,
  onRowClick,
  selectedId,
  fileMimeFilter,
}: Props) {
  // client-side fileMime filter (API doesn't support it server-side)
  const filtered = useMemo(
    () =>
      fileMimeFilter
        ? data.filter((r) => r.fileMime === fileMimeFilter)
        : data,
    [data, fileMimeFilter],
  );

  const columns = useMemo((): DenseTableColumn<DeepLearnRow>[] => [
    {
      key: 'id',
      label: 'ID',
      width: '60px',
      render: (row) => <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>#{row.id}</span>,
    },
    {
      key: 'userId',
      label: '用户 ID',
      width: '72px',
      render: (row) => <span style={{ color: 'var(--accent-blue)', fontSize: 12 }}>{row.userId}</span>,
    },
    {
      key: 'fileName',
      label: '文件名',
      render: (row) => (
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            maxWidth: 200,
          }}
          title={row.fileName}
        >
          {row.fileName}
        </span>
      ),
    },
    {
      key: 'fileSize',
      label: '大小',
      width: '72px',
      render: (row) => (
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{formatFileSize(row.fileSize)}</span>
      ),
    },
    {
      key: 'autoVerdict',
      label: '自动判定',
      width: '90px',
      render: (row) => (
        <Badge value={row.autoVerdict} color={verdictColor(row.autoVerdict)} labels={VERDICT_LABELS} />
      ),
    },
    {
      key: 'status',
      label: '状态',
      width: '90px',
      render: (row) => (
        <Badge value={row.status} color={statusColor(row.status)} labels={STATUS_LABELS} />
      ),
    },
    {
      key: 'uploadedAt',
      label: '上传时间',
      width: '110px',
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(String(row.uploadedAt)).toLocaleString('zh-CN', {
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
      width: '64px',
      render: () => (
        <span style={{ fontSize: 11, color: 'var(--gold)', cursor: 'pointer' }}>详情 →</span>
      ),
    },
  ], []);

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
      {!loading && filtered.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          暂无待审核 · 用户上传后会自动入队
        </div>
      ) : (
        <DenseTable
          columns={columns}
          data={filtered}
          loading={loading}
          maxHeight="calc(100vh - 440px)"
          onRowClick={onRowClick}
          selectedKey={selectedId ?? undefined}
          getRowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
