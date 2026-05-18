// PRD-12 US-010 · ReviewDeepLearnPage — 列表 + 抽屉 part 1
// PRD-12 US-011 · Part 2 — Tab 切换 [待审核/已批准/已驳回/用户违规累计]
// AC-8: useSearchParams filter URL 持久化
// AC-9: ErrorBoundary fallback · pnpm typecheck 0 error

import { Component, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminTrpc } from '../../lib/admin-client';
import { OverviewCards } from './OverviewCards';
import { ReviewDeepLearnFilters } from './ReviewDeepLearnFilters';
import type { DeepLearnFilterState } from './ReviewDeepLearnFilters';
import { ReviewDeepLearnTable } from './ReviewDeepLearnTable';
import type { DeepLearnRow } from './ReviewDeepLearnTable';
import { DeepLearnReviewDrawer } from './DeepLearnReviewDrawer';
import { UserViolationsTab } from './UserViolationsTab';

const PAGE_SIZE = 20;

// ── ErrorBoundary ──────────────────────────────────────────────────────────────

interface ErrState { hasError: boolean }

class DeepLearnErrorBoundary extends Component<{ children: ReactNode }, ErrState> {
  override state: ErrState = { hasError: false };
  static getDerivedStateFromError(): ErrState { return { hasError: true }; }
  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--status-err)',
            borderRadius: 6,
            padding: 24,
            color: 'var(--status-err)',
            fontSize: 14,
          }}
        >
          页面渲染出错 · 请刷新重试
        </div>
      );
    }
    return this.props.children;
  }
}

// ── URL ↔ filter helpers ───────────────────────────────────────────────────────

type TabKey = 'pending' | 'approved' | 'rejected' | 'violations' | '';

function getActiveTab(params: URLSearchParams): TabKey {
  if (params.get('tab') === 'violations') return 'violations';
  const s = params.get('status');
  if (s === 'pending' || s === 'approved' || s === 'rejected') return s;
  return '';
}

function parseFilters(params: URLSearchParams): DeepLearnFilterState {
  return {
    statusFilter: params.get('status') ?? '',
    userIdFilter: params.get('userId') ?? '',
    autoVerdictFilter: params.get('verdict') ?? '',
    fileMimeFilter: params.get('mime') ?? '',
    dateFrom: params.get('from') ?? '',
    dateTo: params.get('to') ?? '',
  };
}

function filtersToParams(f: DeepLearnFilterState, page: number): Record<string, string> {
  const p: Record<string, string> = { page: String(page) };
  if (f.statusFilter) p['status'] = f.statusFilter;
  if (f.userIdFilter) p['userId'] = f.userIdFilter;
  if (f.autoVerdictFilter) p['verdict'] = f.autoVerdictFilter;
  if (f.fileMimeFilter) p['mime'] = f.fileMimeFilter;
  if (f.dateFrom) p['from'] = f.dateFrom;
  if (f.dateTo) p['to'] = f.dateTo;
  return p;
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

// ── Tab Bar ────────────────────────────────────────────────────────────────────

const TAB_DEFS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已批准' },
  { key: 'rejected', label: '已驳回' },
  { key: 'violations', label: '用户违规累计' },
];

function TabBar({
  active,
  onSelect,
}: {
  active: TabKey;
  onSelect: (tab: TabKey) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        marginBottom: 16,
      }}
    >
      {TAB_DEFS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
              color: isActive ? 'var(--gold)' : 'var(--text-muted)',
              padding: '8px 18px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isActive ? 700 : 400,
              marginBottom: -1,
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

function ReviewDeepLearnPageInner() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = getActiveTab(searchParams);
  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const openQueueId = searchParams.get('queueId') ? parseInt(searchParams.get('queueId')!, 10) : null;
  const filters = parseFilters(searchParams);

  const { data: me } = adminTrpc.auth.me.useQuery();
  const role = me?.role;

  const handleTabSelect = useCallback(
    (tab: TabKey) => {
      if (tab === 'violations') {
        setSearchParams({ tab: 'violations' });
      } else {
        const p: Record<string, string> = { page: '1' };
        if (tab) p['status'] = tab;
        setSearchParams(p);
      }
    },
    [setSearchParams],
  );

  const queryInput = useMemo(() => ({
    page,
    pageSize: PAGE_SIZE,
    statusFilter: filters.statusFilter
      ? (filters.statusFilter as 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'auto_rejected')
      : undefined,
    userIdFilter: filters.userIdFilter ? parseInt(filters.userIdFilter, 10) : undefined,
    autoVerdictFilter: filters.autoVerdictFilter
      ? (filters.autoVerdictFilter as 'auto_approved' | 'auto_rejected' | 'needs_review')
      : undefined,
    dateRange:
      filters.dateFrom || filters.dateTo
        ? {
            from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
            to: filters.dateTo ? new Date(filters.dateTo) : undefined,
          }
        : undefined,
  }), [page, filters.statusFilter, filters.userIdFilter, filters.autoVerdictFilter, filters.dateFrom, filters.dateTo]);

  const { data, isLoading, isError, refetch } = adminTrpc.reviewDeepLearn.list.useQuery(queryInput, {
    staleTime: 15_000,
    enabled: activeTab !== 'violations',
  });

  const rows = useMemo(() => (data?.items ?? []) as unknown as DeepLearnRow[], [data]);
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const setPage = useCallback(
    (p: number) =>
      setSearchParams({ ...Object.fromEntries(searchParams), ...filtersToParams(filters, p) }),
    [searchParams, setSearchParams, filters],
  );

  const handleFiltersChange = useCallback(
    (f: DeepLearnFilterState) => setSearchParams(filtersToParams(f, 1)),
    [setSearchParams],
  );

  const openDrawer = useCallback(
    (row: DeepLearnRow) =>
      setSearchParams({ ...Object.fromEntries(searchParams), queueId: String(row.id) }),
    [searchParams, setSearchParams],
  );

  const closeDrawer = useCallback(() => {
    const p = new URLSearchParams(searchParams);
    p.delete('queueId');
    setSearchParams(p);
  }, [searchParams, setSearchParams]);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: '0.02em',
          }}
        >
          📚 DeepLearn 内容审核
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          PII 扫描 / 违禁词扫描 / 用户违规累计{activeTab !== 'violations' && ` · 共 ${totalCount.toLocaleString()} 条`}
        </div>
      </div>

      {/* Overview cards */}
      <OverviewCards />

      {/* Tab bar */}
      <TabBar active={activeTab} onSelect={handleTabSelect} />

      {/* Content */}
      {activeTab === 'violations' ? (
        <UserViolationsTab role={role} />
      ) : (
        <>
          {/* Filters */}
          <ReviewDeepLearnFilters value={filters} onChange={handleFiltersChange} />

          {/* Table */}
          <ReviewDeepLearnTable
            data={rows}
            loading={isLoading}
            isError={isError}
            onRefetch={() => void refetch()}
            onRowClick={openDrawer}
            selectedId={openQueueId}
            fileMimeFilter={filters.fileMimeFilter || undefined}
          />

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
      )}

      {/* Detail drawer */}
      <DeepLearnReviewDrawer
        queueId={openQueueId}
        onClose={closeDrawer}
        onActionDone={() => void refetch()}
        role={role}
      />
    </div>
  );
}

export default function ReviewDeepLearnPage() {
  return (
    <DeepLearnErrorBoundary>
      <ReviewDeepLearnPageInner />
    </DeepLearnErrorBoundary>
  );
}
