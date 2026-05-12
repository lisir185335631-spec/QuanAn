// PRD-11 US-007 · Users management page
// AC-1: replaces placeholder · DenseTable list + drawer state
// AC-22: URL params persist page/filters · state restore on refresh

import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DenseTable } from '@quanqn/ui/admin';
import type { DenseTableColumn } from '@quanqn/ui/admin';
import { adminTrpc } from '../../lib/admin-client';
import { PlanBadge } from './PlanBadge';
import { UsersOverviewCards } from './UsersOverviewCards';
import { UserListFilters } from './UserListFilters';
import { UserDetailDrawer } from './UserDetailDrawer';
import { ChangePlanDialog } from './ChangePlanDialog';
import { BanUserDialog } from './BanUserDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import type { FilterState } from './UserListFilters';

// ── Types ────────────────────────────────────────────────────────────────────

// Dates come as ISO strings from tRPC JSON serialization (no superjson transformer)
type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  industry: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  isBanned: boolean;
  bannedAt: string | null;
};

// ── URL param helpers ────────────────────────────────────────────────────────

function parseFilters(params: URLSearchParams): FilterState {
  return {
    search: params.get('search') ?? '',
    roleFilter: params.get('role') ?? '',
    planFilter: params.get('plan') ?? '',
    industryFilter: params.get('industry') ?? '',
    sortBy: (params.get('sortBy') as FilterState['sortBy']) ?? 'createdAt',
    sortDir: (params.get('sortDir') as 'asc' | 'desc') ?? 'desc',
  };
}

function filtersToParams(f: FilterState, page: number): Record<string, string> {
  const p: Record<string, string> = { page: String(page) };
  if (f.search) p['search'] = f.search;
  if (f.roleFilter) p['role'] = f.roleFilter;
  if (f.planFilter) p['plan'] = f.planFilter;
  if (f.industryFilter) p['industry'] = f.industryFilter;
  if (f.sortBy !== 'createdAt') p['sortBy'] = f.sortBy;
  if (f.sortDir !== 'desc') p['sortDir'] = f.sortDir;
  return p;
}

// ── Small sub-components ──────────────────────────────────────────────────────

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

// ── Column definitions ────────────────────────────────────────────────────────

function buildColumns(
  onAction: (type: 'changePlan' | 'ban' | 'resetPwd', user: UserRow) => void,
  role: string | undefined,
): DenseTableColumn<UserRow>[] {
  const isReadonly = role === 'readonly_admin';
  return [
    {
      key: 'id',
      header: 'ID',
      width: '56px',
      render: (row) => <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>#{row.id}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      width: '220px',
      render: (row) => (
        <span style={{ color: 'var(--text)', fontSize: 12 }}>
          {row.email}
          {row.name && (
            <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>{row.name}</span>
          )}
        </span>
      ),
    },
    {
      key: 'plan',
      header: '套餐',
      width: '90px',
      render: (row) => <PlanBadge plan={row.plan} isBanned={row.isBanned} />,
    },
    {
      key: 'industry',
      header: '行业',
      width: '80px',
      render: (row) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.industry ?? '—'}</span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: '最近登录',
      width: '130px',
      render: (row) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          {row.lastLoginAt
            ? new Date(row.lastLoginAt).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      width: '160px',
      render: (row) =>
        isReadonly ? null : (
          <div style={{ display: 'flex', gap: 4 }}>
            <ActionChip
              label="改套餐"
              color="var(--accent-blue)"
              onClick={(e) => { e.stopPropagation(); onAction('changePlan', row); }}
            />
            <ActionChip
              label="封禁"
              color="var(--status-err)"
              onClick={(e) => { e.stopPropagation(); onAction('ban', row); }}
              disabled={row.isBanned}
            />
            <ActionChip
              label="重置"
              color="var(--text-muted)"
              onClick={(e) => { e.stopPropagation(); onAction('resetPwd', row); }}
            />
          </div>
        ),
    },
  ];
}

// ── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const openUserId = searchParams.get('userId')
    ? parseInt(searchParams.get('userId')!, 10)
    : null;
  const filters = parseFilters(searchParams);

  const { data: me } = adminTrpc.auth.me.useQuery();
  const role = me?.role;

  const queryInput = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: filters.search || undefined,
      roleFilter: filters.roleFilter || undefined,
      planFilter: filters.planFilter || undefined,
      industryFilter: filters.industryFilter || undefined,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      page,
      filters.search,
      filters.roleFilter,
      filters.planFilter,
      filters.industryFilter,
      filters.sortBy,
      filters.sortDir,
    ],
  );

  const { data, isLoading, isError, refetch } = adminTrpc.users.list.useQuery(queryInput, {
    staleTime: 30_000,
  });

  const users = useMemo(() => (data?.users ?? []) as unknown as UserRow[], [data]);
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const [changePlanUserId, setChangePlanUserId] = useState<number | null>(null);
  const [banUserId, setBanUserId] = useState<number | null>(null);
  const [resetPwdUserId, setResetPwdUserId] = useState<number | null>(null);

  const openUser = users.find((u) => u.id === openUserId) ?? null;
  const dialogTargetId = changePlanUserId ?? banUserId ?? resetPwdUserId;
  const actionUser = dialogTargetId != null ? (users.find((u) => u.id === dialogTargetId) ?? null) : null;

  const setPage = useCallback(
    (p: number) => {
      setSearchParams({ ...Object.fromEntries(searchParams), ...filtersToParams(filters, p) });
    },
    [searchParams, setSearchParams, filters],
  );

  const handleFiltersChange = useCallback(
    (f: FilterState) => setSearchParams(filtersToParams(f, 1)),
    [setSearchParams],
  );

  const openDrawer = useCallback(
    (userId: number) => {
      setSearchParams({ ...Object.fromEntries(searchParams), userId: String(userId) });
    },
    [searchParams, setSearchParams],
  );

  const closeDrawer = useCallback(() => {
    const p = new URLSearchParams(searchParams);
    p.delete('userId');
    setSearchParams(p);
  }, [searchParams, setSearchParams]);

  const handleAction = useCallback(
    (type: 'changePlan' | 'ban' | 'resetPwd', user: UserRow) => {
      if (type === 'changePlan') setChangePlanUserId(user.id);
      else if (type === 'ban') setBanUserId(user.id);
      else setResetPwdUserId(user.id);
    },
    [],
  );

  const columns = useMemo(() => buildColumns(handleAction, role), [handleAction, role]);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.02em' }}>
          👤 用户管理
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          用户列表 · 搜索 / 状态变更 / 跨账号查询 + 审计 · 共 {totalCount.toLocaleString()} 条
        </div>
      </div>

      {/* Overview cards */}
      <UsersOverviewCards />

      {/* Filters */}
      <UserListFilters value={filters} onChange={handleFiltersChange} />

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
        ) : isLoading ? (
          <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>加载中…</div>
        ) : (
          <DenseTable
            columns={columns}
            rows={users}
            keyField="id"
            emptyText="暂无用户数据"
            virtualScroll
            maxHeight="calc(100vh - 380px)"
            onRowClick={(row) => openDrawer(row.id)}
            selectedKey={openUserId ?? undefined}
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

      {/* Drawer */}
      <UserDetailDrawer
        userId={openUserId}
        user={openUser}
        role={role}
        onClose={closeDrawer}
        onChangePlan={(id) => setChangePlanUserId(id)}
        onBanUser={(id) => setBanUserId(id)}
        onResetPassword={(id) => setResetPwdUserId(id)}
      />

      {/* Dialogs */}
      {changePlanUserId !== null && (
        <ChangePlanDialog
          userId={changePlanUserId}
          currentPlan={actionUser?.plan}
          role={role}
          onClose={() => setChangePlanUserId(null)}
          onSuccess={() => void refetch()}
        />
      )}
      {banUserId !== null && (
        <BanUserDialog
          userId={banUserId}
          userEmail={actionUser?.email}
          onClose={() => setBanUserId(null)}
          onSuccess={() => void refetch()}
        />
      )}
      {resetPwdUserId !== null && (
        <ResetPasswordDialog
          userId={resetPwdUserId}
          userEmail={actionUser?.email}
          onClose={() => setResetPwdUserId(null)}
        />
      )}
    </div>
  );
}
