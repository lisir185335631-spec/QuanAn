import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';
import { DenseTable } from '@quanan/ui/admin';
import type { DenseTableColumn } from '@quanan/ui/admin';
import { BanUploaderDialog } from './BanUploaderDialog';

type ViolationRow = {
  id: number;
  userId: number;
  violationType: string;
  count: number;
  lastViolationAt: Date;
  lastReviewItemId: number | null;
  warningCount: number;
  suspendedAt: Date | null;
  suspendedByAdminId: number | null;
  suspendedReason: string | null;
};

interface UserViolationsTabProps {
  role: string | undefined;
}

function fmtDate(d: Date): string {
  return new Date(String(d)).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UserViolationsTab({ role }: UserViolationsTabProps) {
  const [banTarget, setBanTarget] = useState<{ userId: number; isSuspended: boolean } | null>(null);
  const isReadonly = role === 'readonly_admin';

  const { data, isLoading, isError, refetch } = adminTrpc.reviewDeepLearn.userViolations.useQuery(
    {},
    { staleTime: 30_000 },
  );

  const rows = ((data?.violations ?? []) as unknown as ViolationRow[]).filter((v) => v.count >= 3);

  const actionCol: DenseTableColumn<ViolationRow> = {
    key: 'action',
    label: '操作',
    width: '90px',
    render: (row) => {
      const suspended = row.suspendedAt !== null;
      return (
        <button
          type="button"
          disabled={suspended}
          onClick={() => setBanTarget({ userId: row.userId, isSuspended: suspended })}
          style={{
            background: suspended ? 'var(--bg-hover)' : 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: suspended ? 'var(--text-dim)' : '#ef4444',
            padding: '3px 10px',
            borderRadius: 4,
            cursor: suspended ? 'not-allowed' : 'pointer',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {suspended ? '已封禁' : '封禁上传'}
        </button>
      );
    },
  };

  const baseColumns: DenseTableColumn<ViolationRow>[] = [
    {
      key: 'userId',
      label: '用户 ID',
      width: '70px',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11 }}>#{row.userId}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      width: '100px',
      render: () => <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>,
    },
    {
      key: 'violationType',
      label: '违规类型',
      width: '120px',
      render: (row) => (
        <span
          style={{
            fontSize: 11,
            color: '#f97316',
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.25)',
            padding: '1px 6px',
            borderRadius: 3,
          }}
        >
          {row.violationType}
        </span>
      ),
    },
    {
      key: 'count',
      label: '次数',
      width: '56px',
      sortable: true,
      render: (row) => (
        <span
          style={{
            fontWeight: 700,
            color: row.count >= 5 ? '#ef4444' : '#f97316',
            fontSize: 13,
          }}
        >
          {row.count}
        </span>
      ),
    },
    {
      key: 'lastViolationAt',
      label: '最后违规',
      width: '100px',
      render: (row) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {fmtDate(row.lastViolationAt)}
        </span>
      ),
    },
    {
      key: 'suspendedAt',
      label: '封禁时间',
      width: '100px',
      render: (row) =>
        row.suspendedAt ? (
          <span style={{ fontSize: 11, color: '#ef4444' }}>{fmtDate(row.suspendedAt)}</span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>—</span>
        ),
    },
  ];

  const columns = isReadonly ? baseColumns : [...baseColumns, actionCol];

  if (isLoading) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>加载中…</div>
    );
  }

  if (isError) {
    return (
      <div style={{ color: 'var(--status-err)', fontSize: 13, padding: '20px 0' }}>
        加载失败 ·{' '}
        <button
          type="button"
          onClick={() => void refetch()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gold-text)',
            cursor: 'pointer',
            fontSize: 13,
            textDecoration: 'underline',
          }}
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        高违规用户（累计 ≥ 3 次）· 共 {rows.length} 人
        {isReadonly && (
          <span
            style={{
              marginLeft: 10,
              fontSize: 11,
              color: 'var(--text-dim)',
              padding: '1px 6px',
              border: '1px solid var(--border)',
              borderRadius: 3,
            }}
          >
            只读模式
          </span>
        )}
      </div>

      <DenseTable<ViolationRow>
        columns={columns}
        data={rows}
        loading={isLoading}
        getRowKey={(row) => row.id}
      />

      {banTarget && (
        <BanUploaderDialog
          userId={banTarget.userId}
          open={true}
          onClose={() => setBanTarget(null)}
          onSuccess={() => {
            setBanTarget(null);
            void refetch();
          }}
          role={role}
          isSuspended={banTarget.isSuspended}
        />
      )}
    </div>
  );
}
