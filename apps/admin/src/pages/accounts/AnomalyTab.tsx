// PRD-11 US-011 · AnomalyTab — anomaly accounts with per-flag rows
// AC-4: DenseTable columns(accountId/anomalyType/severity/detectedAt/操作:resolve/falsePositive)
// AC-7: resolve / falsePositive 调 accounts.unflag
// AC-15: 切 Tab → 列表加载 · 点 [resolve] → 行消失

import { adminTrpc } from '../../lib/admin-client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnomalyFlag {
  id: number;
  accountId: number;
  anomalyType: string;
  severity: string;
  detectedAt: Date | string;
  resolvedAt: Date | string | null;
}

interface AnomalyTabProps {
  role: string | undefined;
  onSelectAccount: (accountId: number) => void;
}

// ── Per-account flag rows ─────────────────────────────────────────────────────

function AnomalyAccountRows({
  accountId,
  accountName,
  role,
  onSelectAccount,
  onRefetchList,
}: {
  accountId: number;
  accountName: string;
  role: string | undefined;
  onSelectAccount: (id: number) => void;
  onRefetchList: () => void;
}) {
  const { data, refetch } = adminTrpc.ipAccounts.detail.useQuery(
    { accountId },
    { staleTime: 30_000 },
  );

  const unflagMutation = adminTrpc.ipAccounts.unflag.useMutation({
    onSuccess: () => {
      void refetch();
      onRefetchList();
    },
    onError: (err) => showToast(`操作失败: ${err.message}`, 'err'),
  });

  const flags = (data?.anomalyFlags ?? []).filter((f) => !f.resolvedAt);
  if (flags.length === 0) return null;

  return (
    <>
      {flags.map((flag) => (
        <FlagRow
          key={flag.id}
          flag={flag as AnomalyFlag}
          accountName={accountName}
          role={role}
          onResolve={() =>
            unflagMutation.mutate({ flagId: flag.id, resolution: 'admin_action' })
          }
          onFalsePositive={() =>
            unflagMutation.mutate({ flagId: flag.id, resolution: 'false_positive' })
          }
          onViewAccount={() => onSelectAccount(accountId)}
          isPending={unflagMutation.isPending}
        />
      ))}
    </>
  );
}

function FlagRow({
  flag,
  accountName,
  role,
  onResolve,
  onFalsePositive,
  onViewAccount,
  isPending,
}: {
  flag: AnomalyFlag;
  accountName: string;
  role: string | undefined;
  onResolve: () => void;
  onFalsePositive: () => void;
  onViewAccount: () => void;
  isPending: boolean;
}) {
  const isReadonly = role === 'readonly_admin';
  const severityColor =
    flag.severity === 'high'
      ? 'var(--status-err)'
      : flag.severity === 'medium'
        ? 'var(--status-warn)'
        : 'var(--text-muted)';

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
      }}
      onClick={onViewAccount}
    >
      <td style={cellStyle}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onViewAccount(); }}
          style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: 12, padding: 0 }}
        >
          #{flag.accountId}
        </button>
        <span style={{ color: 'var(--text-dim)', fontSize: 11, marginLeft: 4 }}>{accountName}</span>
      </td>
      <td style={cellStyle}>
        <span style={{ fontSize: 12, color: 'var(--text)' }}>{flag.anomalyType}</span>
      </td>
      <td style={cellStyle}>
        <span
          style={{
            fontSize: 11,
            color: severityColor,
            padding: '1px 6px',
            border: `1px solid ${severityColor}44`,
            borderRadius: 3,
            fontWeight: 600,
          }}
        >
          {flag.severity}
        </span>
      </td>
      <td style={cellStyle}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(flag.detectedAt).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </td>
      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
        {isReadonly ? (
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>只读</span>
        ) : (
          <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
            <ActionChip label="resolve" color="var(--status-ok)" onClick={onResolve} disabled={isPending} />
            <ActionChip label="误报" color="var(--text-muted)" onClick={onFalsePositive} disabled={isPending} />
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Main AnomalyTab ─────────────────────────────────────────────────────────

export function AnomalyTab({ role, onSelectAccount }: AnomalyTabProps) {
  const { data, isLoading, isError, refetch } = adminTrpc.ipAccounts.list.useQuery(
    { anomalyOnly: true, pageSize: 50, sortBy: 'updatedAt', sortDir: 'desc' },
    { staleTime: 30_000 },
  );

  const accounts = data?.accounts ?? [];

  if (isLoading) {
    return <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>加载中…</div>;
  }

  if (isError) {
    return (
      <div style={{ padding: 16, color: 'var(--status-err)', fontSize: 13 }}>
        加载失败 ·{' '}
        <button
          type="button"
          onClick={() => void refetch()}
          style={{ background: 'none', border: 'none', color: 'var(--gold-text)', cursor: 'pointer', fontSize: 13 }}
        >
          重试
        </button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        暂无异常账号
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
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            <th style={thStyle}>账号 ID</th>
            <th style={thStyle}>异常类型</th>
            <th style={thStyle}>严重度</th>
            <th style={thStyle}>检测时间</th>
            <th style={thStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <AnomalyAccountRows
              key={account.id}
              accountId={account.id}
              accountName={account.name}
              role={role}
              onSelectAccount={onSelectAccount}
              onRefetchList={() => void refetch()}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Primitives ────────────────────────────────────────────────────────────────

const cellStyle: React.CSSProperties = {
  padding: '6px 8px',
  verticalAlign: 'middle',
};

const thStyle: React.CSSProperties = {
  padding: '6px 8px',
  textAlign: 'left',
  color: '#888',
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap',
};

function ActionChip({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none',
        border: `1px solid ${color}44`,
        color: disabled ? 'var(--text-dim)' : color,
        padding: '2px 7px',
        borderRadius: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function showToast(msg: string, type: 'ok' | 'warn' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : type === 'warn' ? '#f59e0b' : '#ef4444';
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
    background: '#111', border: `1px solid ${color}`, color,
    padding: '10px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
