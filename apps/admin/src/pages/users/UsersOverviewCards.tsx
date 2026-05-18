// PRD-11 US-007 · Top 4 stat cards [总用户/活跃7d/付费/风险用户]

import { adminTrpc } from '../../lib/admin-client';

interface StatCard {
  label: string;
  value: number | string;
  loading: boolean;
  color?: string;
}

function OverviewCard({ label, value, loading, color }: StatCard) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '14px 16px',
      }}
    >
      <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? 'var(--gold)', lineHeight: 1 }}>
        {loading ? '—' : value}
      </div>
    </div>
  );
}

export function UsersOverviewCards() {
  const { data: total, isLoading: l1 } = adminTrpc.users.list.useQuery(
    { page: 1, pageSize: 1 },
    { staleTime: 60_000 },
  );
  const { data: pro, isLoading: l2 } = adminTrpc.users.list.useQuery(
    { page: 1, pageSize: 1, planFilter: 'pro' },
    { staleTime: 60_000 },
  );
  const { data: enterprise, isLoading: l3 } = adminTrpc.users.list.useQuery(
    { page: 1, pageSize: 1, planFilter: 'enterprise' },
    { staleTime: 60_000 },
  );

  const totalCount = total?.count ?? 0;
  const paidCount = (pro?.count ?? 0) + (enterprise?.count ?? 0);
  const isLoading = l1 || l2 || l3;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      <OverviewCard label="总用户" value={totalCount} loading={l1} />
      <OverviewCard label="活跃 7d" value="—" loading={false} color="var(--text-muted)" />
      <OverviewCard label="付费用户" value={paidCount} loading={isLoading} color="var(--accent-blue)" />
      <OverviewCard label="风险用户" value="—" loading={false} color="var(--status-warn)" />
    </div>
  );
}
