// PRD-12 US-010 · OverviewCards — top 3 stat numbers
// [待审核 / 命中 PII / 命中违禁]

import { adminTrpc } from '../../lib/admin-client';

interface CardProps {
  label: string;
  value: number | string;
  loading: boolean;
  color?: string;
}

function StatCard({ label, value, loading, color }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: color ?? 'var(--gold)',
          lineHeight: 1,
        }}
      >
        {loading ? '—' : value}
      </div>
    </div>
  );
}

export function OverviewCards() {
  const { data: pending, isLoading: l1 } = adminTrpc.reviewDeepLearn.list.useQuery(
    { page: 1, pageSize: 1, statusFilter: 'pending' },
    { staleTime: 30_000 },
  );
  const { data: piiHit, isLoading: l2 } = adminTrpc.reviewDeepLearn.list.useQuery(
    { page: 1, pageSize: 1, autoVerdictFilter: 'needs_review' },
    { staleTime: 30_000 },
  );
  const { data: bannedHit, isLoading: l3 } = adminTrpc.reviewDeepLearn.list.useQuery(
    { page: 1, pageSize: 1, autoVerdictFilter: 'auto_rejected' },
    { staleTime: 30_000 },
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <StatCard label="待审核" value={pending?.count ?? 0} loading={l1} color="var(--status-warn)" />
      <StatCard label="命中 PII" value={piiHit?.count ?? 0} loading={l2} color="var(--status-warn)" />
      <StatCard label="命中违禁" value={bannedHit?.count ?? 0} loading={l3} color="var(--status-err)" />
    </div>
  );
}
