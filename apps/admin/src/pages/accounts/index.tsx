// PRD-11 US-011 · Accounts management page
// AC-1: 主页面 + DenseTable + Tab 切换(全部/异常) + 抽屉 state
// AC-2: 顶部 4 stat cards + 行业/平台 2 饼图(Recharts)
// AC-3: 中部 DenseTable virtualScroll

import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DenseTable } from '@quanan/ui/admin';
import type { DenseTableColumn } from '@quanan/ui/admin';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { adminTrpc } from '../../lib/admin-client';
import type { AccountFilterState } from './AccountListFilters';
import { AccountListFilters } from './AccountListFilters';
import { AccountDetailDrawer } from './AccountDetailDrawer';
import { AnomalyTab } from './AnomalyTab';
import { ForceFreezeDialog } from './ForceFreezeDialog';

// ── Types ─────────────────────────────────────────────────────────────────────

type AccountRow = {
  id: number;
  name: string;
  industry: string;
  platform: string;
  stage: string;
  frozenAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: { id: number; email: string; name: string | null } | null;
  evolutionProfile: { level: string; feedbackCountTotal: number; satisfactionRate: number | null } | null;
  _count: { anomalyFlags: number };
};

// ── URL param helpers ─────────────────────────────────────────────────────────

function parseFilters(params: URLSearchParams): AccountFilterState {
  return {
    search: params.get('search') ?? '',
    industryFilter: params.get('industry') ?? '',
    platformFilter: params.get('platform') ?? '',
    levelFilter: params.get('level') ?? '',
    stageFilter: params.get('stage') ?? '',
    sortBy: (params.get('sortBy') as AccountFilterState['sortBy']) ?? 'createdAt',
    sortDir: (params.get('sortDir') as 'asc' | 'desc') ?? 'desc',
  };
}

function filtersToParams(f: AccountFilterState, page: number): Record<string, string> {
  const p: Record<string, string> = { page: String(page) };
  if (f.search) p['search'] = f.search;
  if (f.industryFilter) p['industry'] = f.industryFilter;
  if (f.platformFilter) p['platform'] = f.platformFilter;
  if (f.levelFilter) p['level'] = f.levelFilter;
  if (f.stageFilter) p['stage'] = f.stageFilter;
  if (f.sortBy !== 'createdAt') p['sortBy'] = f.sortBy;
  if (f.sortDir !== 'desc') p['sortDir'] = f.sortDir;
  return p;
}

// ── Primitive components ──────────────────────────────────────────────────────

function ActionChip({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string;
  color: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
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

function PageBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        color: disabled ? 'var(--text-dim)' : 'var(--text-muted)',
        padding: '5px 12px',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
      }}
    >
      {label}
    </button>
  );
}

// ── Overview cards ────────────────────────────────────────────────────────────

const PIE_COLORS = [
  'var(--accent-purple)',
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-amber)',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  'var(--text-dim)',
];

interface OverviewCardProps {
  label: string;
  value: string | number;
  loading: boolean;
  color?: string;
}

function OverviewCard({ label, value, loading, color }: OverviewCardProps) {
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
      <div style={{ fontSize: 26, fontWeight: 700, color: color ?? 'var(--gold)', lineHeight: 1 }}>
        {loading ? '—' : value}
      </div>
    </div>
  );
}

function AccountsOverviewCards() {
  const { data: total, isLoading: l1 } = adminTrpc.ipAccounts.list.useQuery(
    { page: 1, pageSize: 1 },
    { staleTime: 60_000 },
  );
  const { data: anomaly, isLoading: l2 } = adminTrpc.ipAccounts.list.useQuery(
    { page: 1, pageSize: 1, anomalyOnly: true },
    { staleTime: 60_000 },
  );
  // Distribution sample for top industry
  const { data: sample } = adminTrpc.ipAccounts.list.useQuery(
    { page: 1, pageSize: 200 },
    { staleTime: 120_000 },
  );

  const topIndustries = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of sample?.accounts ?? []) {
      counts[a.industry] = (counts[a.industry] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [sample]);

  const topLabel = topIndustries.length > 0
    ? topIndustries.map(([k]) => k).join(' / ')
    : '—';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
      <OverviewCard label="总账号" value={total?.count ?? 0} loading={l1} />
      <OverviewCard label="活跃 7d" value="—" loading={false} color="var(--text-muted)" />
      <OverviewCard label="异常账号" value={anomaly?.count ?? 0} loading={l2} color="var(--status-err)" />
      <OverviewCard label="Top 3 行业" value={topLabel} loading={l1} color="var(--accent-blue)" />
    </div>
  );
}

// ── Distribution pie charts ───────────────────────────────────────────────────

interface PieEntry { name: string; value: number }

function DistributionCharts({ accounts }: { accounts: AccountRow[] }) {
  const industryDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of accounts) {
      counts[a.industry] = (counts[a.industry] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value } as PieEntry));
  }, [accounts]);

  const platformDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of accounts) {
      counts[a.platform] = (counts[a.platform] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value } as PieEntry));
  }, [accounts]);

  if (accounts.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        marginBottom: 16,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 16px',
      }}
    >
      <SinglePie title="行业分布" data={industryDist} />
      <SinglePie title="平台分布" data={platformDist} />
    </div>
  );
}

function SinglePie({ title, data }: { title: string; data: PieEntry[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={60} isAnimationActive={false}>
            {data.map((_entry, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11 }}
            formatter={(value, name) => {
              const num = typeof value === 'number' ? value : 0;
              const pct = total > 0 ? ((num / total) * 100).toFixed(1) : '0.0';
              return [`${num} (${pct}%)`, String(name ?? '')];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildColumns(
  onAction: (type: 'forceFreeze', account: AccountRow) => void,
  role: string | undefined,
): DenseTableColumn<AccountRow>[] {
  const isReadonly = role === 'readonly_admin';
  return [
    {
      key: 'id',
      label: 'ID',
      width: '56px',
      render: (row) => <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>#{row.id}</span>,
    },
    {
      key: 'name',
      label: '账号名',
      width: '140px',
      sortable: true,
      render: (row) => (
        <span style={{ color: 'var(--text)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 130 }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'industry',
      label: '行业',
      width: '80px',
      render: (row) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.industry}</span>,
    },
    {
      key: 'platform',
      label: '平台',
      width: '80px',
      render: (row) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.platform}</span>,
    },
    {
      key: 'level',
      label: '等级',
      width: '56px',
      render: (row) => (
        <span style={{ fontSize: 11, color: 'var(--accent-purple)' }}>
          {row.evolutionProfile?.level ?? '—'}
        </span>
      ),
    },
    {
      key: 'stage',
      label: '阶段',
      width: '72px',
      render: (row) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.stage}</span>,
    },
    {
      key: 'updatedAt',
      label: '最近活跃',
      width: '120px',
      sortable: true,
      render: (row) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          {new Date(String(row.updatedAt)).toLocaleString('zh-CN', {
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
      width: '100px',
      render: (row) =>
        isReadonly ? null : (
          <div style={{ display: 'flex', gap: 4 }}>
            <ActionChip
              label="强制冻结"
              color="var(--status-err)"
              onClick={(e) => { e.stopPropagation(); onAction('forceFreeze', row); }}
              disabled={!!row.frozenAt}
            />
          </div>
        ),
    },
  ];
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function AccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeMainTab, setActiveMainTab] = useState<'all' | 'anomaly'>('all');
  const [freezeAccountId, setFreezeAccountId] = useState<number | null>(null);

  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const openAccountId = searchParams.get('accountId')
    ? parseInt(searchParams.get('accountId')!, 10)
    : null;
  const filters = parseFilters(searchParams);

  const { data: me } = adminTrpc.auth.me.useQuery();
  const role = me?.role;

  const queryInput = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: filters.search || undefined,
      industryFilter: filters.industryFilter || undefined,
      platformFilter: filters.platformFilter || undefined,
      levelFilter: filters.levelFilter || undefined,
      stageFilter: filters.stageFilter || undefined,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    }),
    [page, filters.search, filters.industryFilter, filters.platformFilter, filters.levelFilter, filters.stageFilter, filters.sortBy, filters.sortDir],
  );

  const { data, isLoading, isError, refetch } = adminTrpc.ipAccounts.list.useQuery(queryInput, {
    staleTime: 30_000,
  });

  const accounts = useMemo(() => (data?.accounts ?? []) as unknown as AccountRow[], [data]);
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const openAccount = accounts.find((a) => a.id === openAccountId) ?? null;
  const freezeAccount = freezeAccountId != null ? (accounts.find((a) => a.id === freezeAccountId) ?? null) : null;

  const setPage = useCallback(
    (p: number) => setSearchParams({ ...Object.fromEntries(searchParams), ...filtersToParams(filters, p) }),
    [searchParams, setSearchParams, filters],
  );

  const handleFiltersChange = useCallback(
    (f: AccountFilterState) => setSearchParams(filtersToParams(f, 1)),
    [setSearchParams],
  );

  const handleSort = useCallback(
    (key: string, dir: 'asc' | 'desc' | null) => {
      const validKeys: AccountFilterState['sortBy'][] = ['createdAt', 'updatedAt', 'name'];
      const sortBy = validKeys.includes(key as AccountFilterState['sortBy']) ? (key as AccountFilterState['sortBy']) : 'createdAt';
      handleFiltersChange({ ...filters, sortBy, sortDir: dir ?? 'desc' });
    },
    [filters, handleFiltersChange],
  );

  const openDrawer = useCallback(
    (accountId: number) => setSearchParams({ ...Object.fromEntries(searchParams), accountId: String(accountId) }),
    [searchParams, setSearchParams],
  );

  const closeDrawer = useCallback(() => {
    const p = new URLSearchParams(searchParams);
    p.delete('accountId');
    setSearchParams(p);
  }, [searchParams, setSearchParams]);

  const handleAction = useCallback(
    (type: 'forceFreeze', account: AccountRow) => {
      if (type === 'forceFreeze') setFreezeAccountId(account.id);
    },
    [],
  );

  const columns = useMemo(() => buildColumns(handleAction, role), [handleAction, role]);

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.02em' }}>
          🏷️ IP 账号管理
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          创建者信息 / 进化档案 / Specialist 调用统计 / 异常标记 · 共 {totalCount.toLocaleString()} 条
        </div>
      </div>

      {/* Overview cards */}
      <AccountsOverviewCards />

      {/* Distribution pie charts (from current page accounts as sample) */}
      <DistributionCharts accounts={accounts} />

      {/* Main tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
        {(['all', 'anomaly'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveMainTab(tab)}
            style={{
              padding: '8px 18px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: activeMainTab === tab ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: activeMainTab === tab ? '2px solid var(--gold)' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            {tab === 'all' ? '全部账号' : '异常账号'}
          </button>
        ))}
      </div>

      {activeMainTab === 'all' ? (
        <>
          {/* Filters */}
          <AccountListFilters value={filters} onChange={handleFiltersChange} />

          {/* Table */}
          <div
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            {isError ? (
              <div style={{ padding: 16, color: 'var(--status-err)', fontSize: 13 }}>
                数据加载失败 ·{' '}
                <button
                  type="button"
                  onClick={() => void refetch()}
                  style={{ background: 'none', border: 'none', color: 'var(--gold-text)', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}
                >
                  重试
                </button>
              </div>
            ) : isLoading ? (
              <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>加载中…</div>
            ) : (
              <DenseTable
                columns={columns}
                data={accounts}
                maxHeight="calc(100vh - 440px)"
                onRowClick={(row) => openDrawer(row.id)}
                onSort={handleSort}
                selectedKey={openAccountId ?? undefined}
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
              <PageBtn label="← 上页" disabled={page <= 1} onClick={() => setPage(page - 1)} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 8px' }}>
                {page} / {totalPages}
              </span>
              <PageBtn label="下页 →" disabled={page >= totalPages} onClick={() => setPage(page + 1)} />
            </div>
          )}
        </>
      ) : (
        /* Anomaly Tab */
        <AnomalyTab role={role} onSelectAccount={openDrawer} />
      )}

      {/* Detail Drawer */}
      <AccountDetailDrawer
        accountId={openAccountId}
        account={openAccount}
        role={role}
        onClose={closeDrawer}
        onForceFreeze={(id) => setFreezeAccountId(id)}
      />

      {/* Force Freeze Dialog */}
      {freezeAccountId !== null && (
        <ForceFreezeDialog
          accountId={freezeAccountId}
          accountName={freezeAccount?.name}
          role={role}
          onClose={() => setFreezeAccountId(null)}
          onSuccess={() => void refetch()}
        />
      )}
    </div>
  );
}
