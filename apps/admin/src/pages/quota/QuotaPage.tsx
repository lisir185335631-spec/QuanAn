// PRD-13 US-009 · 配额管理 · /admin/quota
// AC-1: 加入 admin-routes.ts (已有 · requiredRole readonly_admin)
// AC-2: 4 KPI 卡片 · Free/Pro/Enterprise 用户数 + 平均使用率 + 异常用户数 + 趋势箭头
// AC-3: UsageLineChart 24h × 3 plans
// AC-4: DenseTable 异常用户列表 · 筛选 plan + usageThreshold + status · 排序 usagePctDesc
// AC-5: QuotaDetailDrawer · 24h 时间线 + active adjustments + 调整面板
// AC-6: adjustmentType select · delta input · reason textarea · dual approval
// SHIELD: setInterval 30s polling (anti_pattern: WebSocket over-engineer)
import { useCallback, useEffect, useState } from 'react';

import { adminTrpc } from '../../lib/admin-client';
import { DenseTable } from '@quanan/ui/admin';
import type { DenseTableColumn } from '@quanan/ui/admin';
import { UsageLineChart } from './components/UsageLineChart';
import { QuotaDetailDrawer } from './QuotaDetailDrawer';
import type { QuotaUserRow } from './QuotaDetailDrawer';

// ── Types ─────────────────────────────────────────────────────────────────────

type PlanFilter = 'all' | 'free' | 'pro' | 'enterprise';
type StatusFilter = 'all' | 'whitelisted' | 'normal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function usagePctColor(p: number): string {
  if (p >= 90) return '#ef4444';
  if (p >= 80) return '#f59e0b';
  return '#22c55e';
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const dt = new Date(String(d));
  return dt.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { positive: boolean; label: string };
}) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '14px 16px',
        flex: 1,
        minWidth: 150,
      }}
    >
      <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ color: 'var(--gold)', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{sub}</span>}
      </div>
      {trend && (
        <div style={{ marginTop: 5, fontSize: 11, color: trend.positive ? '#ef4444' : '#22c55e' }}>
          {trend.label}
        </div>
      )}
    </div>
  );
}

// ── QuotaPage ─────────────────────────────────────────────────────────────────

export default function QuotaPage() {
  const { data: me } = adminTrpc.auth.me.useQuery();
  const role = me?.role;

  // Filters
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [usageThreshold, setUsageThreshold] = useState(80);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Selected row for drawer
  const [selected, setSelected] = useState<QuotaUserRow | null>(null);

  // KPI data
  const { data: overview, refetch: refetchOverview } = adminTrpc.quota.getQuotaOverview.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const { data: usageStats, refetch: refetchStats } = adminTrpc.quota.getUsageStats.useQuery(
    { anomalyThreshold: usageThreshold },
    { staleTime: 30_000, refetchInterval: 30_000 },
  );

  // Line chart data
  const { data: hourlyTrend, isLoading: trendLoading } = adminTrpc.quota.getHourlyTrend.useQuery(undefined, {
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Anomalous users table
  const [displayItems, setDisplayItems] = useState<QuotaUserRow[]>([]);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const utils = adminTrpc.useUtils();

  const fetchAnomalous = useCallback(
    async (cursor?: number) => {
      setTableLoading(true);
      try {
        const result = await utils.quota.listAnomalousUsers.fetch({
          limit: 20,
          plan: planFilter !== 'all' ? planFilter : undefined,
          usageThreshold,
          status: statusFilter,
          cursor,
        });
        const rows: QuotaUserRow[] = result.items.map((item) => ({
          id: item.id,
          userId: item.userId,
          email: item.email,
          plan: item.plan,
          dailyUsed: item.dailyUsed,
          dailyQuota: item.dailyQuota,
          usagePct: item.usagePct,
          isOnWhitelist: item.isOnWhitelist,
          whitelistExpiresAt: item.whitelistExpiresAt,
          lastCallAt: item.lastCallAt,
          createdAt: item.createdAt,
        }));
        if (cursor) {
          setDisplayItems((prev) => [...prev, ...rows]);
        } else {
          setDisplayItems(rows);
        }
        setNextCursor(result.nextCursor);
        setHasMore(result.nextCursor !== undefined);
      } finally {
        setTableLoading(false);
      }
    },
    [planFilter, usageThreshold, statusFilter, utils],
  );

  useEffect(() => {
    void fetchAnomalous(undefined);
  }, [fetchAnomalous]);

  // 30s polling
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchAnomalous(undefined);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchAnomalous]);

  function handleLoadMore() {
    if (nextCursor) void fetchAnomalous(nextCursor);
  }

  // Build KPI plan stats map
  const planStats = usageStats?.plans ?? [];
  const statFor = (plan: string) => planStats.find((p: { plan: string; count: number; avgUsagePct: number }) => p.plan === plan);
  const freeStats = statFor('free');
  const proStats = statFor('pro');
  const enterpriseStats = statFor('enterprise');
  const anomalousCount = usageStats?.anomalousCount ?? 0;

  // Table columns
  const columns: DenseTableColumn<QuotaUserRow>[] = [
    {
      key: 'userId',
      label: 'User ID',
      width: '80px',
      render: (r) => <span style={{ color: 'var(--text-muted)' }}>{r.userId}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (r) => <span style={{ fontSize: 12 }}>{r.email}</span>,
    },
    {
      key: 'plan',
      label: '套餐',
      width: '80px',
      render: (r) => (
        <span
          style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 3,
            background: r.plan === 'enterprise' ? 'rgba(34,197,94,0.15)' : r.plan === 'pro' ? 'rgba(212,175,55,0.15)' : 'var(--bg-hover)',
            color: r.plan === 'enterprise' ? '#22c55e' : r.plan === 'pro' ? 'var(--gold)' : 'var(--text-muted)',
          }}
        >
          {r.plan}
        </span>
      ),
    },
    {
      key: 'usage',
      label: '日配额',
      width: '140px',
      render: (r) => (
        <span>
          <span style={{ fontWeight: 600, color: usagePctColor(r.usagePct) }}>{r.usagePct}%</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4 }}>
            ({r.dailyUsed}/{r.dailyQuota})
          </span>
        </span>
      ),
    },
    {
      key: 'whitelist',
      label: '白名单',
      width: '80px',
      render: (r) => (
        <span style={{ color: r.isOnWhitelist ? '#22c55e' : 'var(--text-muted)', fontSize: 11 }}>
          {r.isOnWhitelist ? `是 · ${fmtDate(r.whitelistExpiresAt)}` : '否'}
        </span>
      ),
    },
    {
      key: 'lastCallAt',
      label: '最后调用',
      width: '110px',
      render: (r) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{fmtDate(r.lastCallAt)}</span>
      ),
    },
    {
      key: 'action',
      label: '操作',
      width: '60px',
      render: () => (
        <span style={{ color: 'var(--gold)', fontSize: 11, cursor: 'pointer' }}>查看</span>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200 }}>
      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, margin: 0 }}>配额管理</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          用户配额实时监控 · 客服调整 · 临时白名单
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard
          label="Free 套餐"
          value={String(overview?.free ?? freeStats?.count ?? 0)}
          sub={freeStats ? `均 ${freeStats.avgUsagePct}%` : undefined}
        />
        <KpiCard
          label="Pro 套餐"
          value={String(overview?.pro ?? proStats?.count ?? 0)}
          sub={proStats ? `均 ${proStats.avgUsagePct}%` : undefined}
        />
        <KpiCard
          label="Enterprise 套餐"
          value={String(overview?.enterprise ?? enterpriseStats?.count ?? 0)}
          sub={enterpriseStats ? `均 ${enterpriseStats.avgUsagePct}%` : undefined}
        />
        <KpiCard
          label="异常用户"
          value={String(anomalousCount)}
          sub={`≥${usageThreshold}% 配额`}
          trend={anomalousCount > 0 ? { positive: true, label: '需关注' } : { positive: false, label: '正常' }}
        />
      </div>

      {/* Line chart */}
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '14px 16px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
          24h 套餐调用量趋势
        </div>
        <UsageLineChart data={hourlyTrend ?? []} loading={trendLoading} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>异常用户列表</div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
          >
            <option value="all">全部套餐</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
          >
            <option value="all">全部状态</option>
            <option value="whitelisted">白名单</option>
            <option value="normal">普通</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            使用率阈值
            <input
              type="number"
              min={1}
              max={100}
              value={usageThreshold}
              onChange={(e) => setUsageThreshold(Number(e.target.value))}
              style={{
                width: 52, background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', borderRadius: 4, padding: '4px 6px', fontSize: 12, textAlign: 'center',
              }}
            />
            %
          </label>
          <button
            type="button"
            onClick={() => void fetchAnomalous(undefined)}
            disabled={tableLoading}
            style={{
              background: 'var(--bg-hover)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', padding: '4px 12px', borderRadius: 4,
              cursor: tableLoading ? 'not-allowed' : 'pointer', fontSize: 12,
            }}
          >
            {tableLoading ? '刷新中…' : '刷新'}
          </button>
        </div>
      </div>

      {/* Anomalous users table */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6 }}>
        {displayItems.length === 0 && !tableLoading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
            无异常用户（阈值 {usageThreshold}%）
          </div>
        ) : (
          <>
            <DenseTable
              columns={columns}
              data={displayItems}
              loading={tableLoading && displayItems.length === 0}
              maxHeight="calc(100vh - 520px)"
              onRowClick={(row) => setSelected(row)}
              selectedKey={selected?.id ?? undefined}
              getRowKey={(row) => row.id}
            />
            {hasMore && (
              <div style={{ padding: 10, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={tableLoading}
                  style={{
                    background: 'var(--bg-hover)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', padding: '6px 20px', borderRadius: 4,
                    cursor: tableLoading ? 'not-allowed' : 'pointer', fontSize: 12,
                  }}
                >
                  {tableLoading ? '加载中…' : '加载更多'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail drawer */}
      <QuotaDetailDrawer
        selected={selected}
        role={role}
        onClose={() => setSelected(null)}
        onAdjusted={() => {
          void fetchAnomalous(undefined);
          void refetchOverview();
          void refetchStats();
        }}
      />
    </div>
  );
}
