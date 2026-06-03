// PRD-11 US-013 · CostOverviewCards — 月度总成本 + 同比 + 环比 + Top 10 bar
// Calls aggregate × 3 (current / prev-month / year-ago) for comparison

import { adminTrpc } from '../../lib/admin-client';
import { CostTopUsersChart } from './CostTopUsersChart';

interface Props {
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month';
}

function shiftDateRange(start: Date, end: Date, months: number): { start: Date; end: Date } {
  const s = new Date(start);
  s.setMonth(s.getMonth() + months);
  const e = new Date(end);
  e.setMonth(e.getMonth() + months);
  return { start: s, end: e };
}

function fmtCost(val: string | undefined): string {
  if (!val) return '—';
  return `$ ${parseFloat(val).toFixed(2)}`;
}

function fmtDelta(current: string | undefined, prev: string | undefined): { text: string; color: string } | null {
  if (!current || !prev) return null;
  const c = parseFloat(current);
  const p = parseFloat(prev);
  if (p === 0) return null;
  const pct = ((c - p) / p) * 100;
  const sign = pct >= 0 ? '+' : '';
  const color = pct >= 0 ? 'var(--status-err)' : 'var(--status-ok)';
  return { text: `${sign}${pct.toFixed(1)}%`, color };
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '12px 16px',
  minWidth: 0,
};

export function CostOverviewCards({ startDate, endDate, groupBy }: Props) {
  const { start: prevStart, end: prevEnd } = shiftDateRange(startDate, endDate, -1);
  const { start: yoyStart, end: yoyEnd } = shiftDateRange(startDate, endDate, -12);

  const { data: current, isLoading } = adminTrpc.cost.aggregate.useQuery(
    { startDate, endDate, dimension: 'user', groupBy },
    { staleTime: 60_000 },
  );

  const { data: prevMonth } = adminTrpc.cost.aggregate.useQuery(
    { startDate: prevStart, endDate: prevEnd, dimension: 'user', groupBy },
    { staleTime: 60_000 },
  );

  const { data: yearAgo } = adminTrpc.cost.aggregate.useQuery(
    { startDate: yoyStart, endDate: yoyEnd, dimension: 'user', groupBy },
    { staleTime: 60_000 },
  );

  const { data: top10, isLoading: top10Loading } = adminTrpc.cost.top10.useQuery(undefined, {
    staleTime: 60_000,
  });

  const mom = fmtDelta(current?.summary?.totalCost, prevMonth?.summary?.totalCost);
  const yoy = fmtDelta(current?.summary?.totalCost, yearAgo?.summary?.totalCost);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {/* Total cost */}
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>月度总成本</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.01em' }}>
            {isLoading ? '—' : fmtCost(current?.summary?.totalCost)}
          </div>
        </div>

        {/* MoM (环比) */}
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>环比(上月)</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: mom?.color ?? 'var(--text-muted)' }}>
            {mom ? mom.text : '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            上月: {fmtCost(prevMonth?.summary?.totalCost)}
          </div>
        </div>

        {/* YoY (同比) */}
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>同比(去年同期)</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: yoy?.color ?? 'var(--text-muted)' }}>
            {yoy ? yoy.text : '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            去年: {fmtCost(yearAgo?.summary?.totalCost)}
          </div>
        </div>
      </div>

      {/* Top 10 horizontal bar */}
      <CostTopUsersChart data={top10?.userTop10 ?? []} isLoading={top10Loading} />
    </div>
  );
}
