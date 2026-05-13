// PRD-12 US-005 · ReviewTrendingPage — 列表 + 抽屉 framework · part 1
// AC-1: admin-routes metadata.prd:12 ✓ · placeholder.tsx deleted ✓
// AC-9: useSearchParams filter URL persistence

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminTrpc } from '../../lib/admin-client';
import { OverviewCards } from './OverviewCards';
import { ReviewTrendingFilters } from './ReviewTrendingFilters';
import type { TrendingFilterState } from './ReviewTrendingFilters';
import { ReviewTrendingTable } from './ReviewTrendingTable';
import type { QueueRow } from './ReviewTrendingTable';
import { TrendingReviewDrawer } from './TrendingReviewDrawer';

const PAGE_SIZE = 20;

function parseFilters(params: URLSearchParams): TrendingFilterState {
  return {
    statusFilter: params.get('status') ?? '',
    platformFilter: params.get('platform') ?? '',
    autoVerdictFilter: params.get('verdict') ?? '',
    dateFrom: params.get('from') ?? '',
    dateTo: params.get('to') ?? '',
  };
}

function filtersToParams(f: TrendingFilterState, page: number): Record<string, string> {
  const p: Record<string, string> = { page: String(page) };
  if (f.statusFilter) p['status'] = f.statusFilter;
  if (f.platformFilter) p['platform'] = f.platformFilter;
  if (f.autoVerdictFilter) p['verdict'] = f.autoVerdictFilter;
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

export default function ReviewTrendingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const openQueueId = searchParams.get('queueId') ? parseInt(searchParams.get('queueId')!, 10) : null;
  const filters = parseFilters(searchParams);

  const { data: me } = adminTrpc.auth.me.useQuery();
  const role = me?.role;

  const queryInput = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      statusFilter: filters.statusFilter
        ? (filters.statusFilter as 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'auto_rejected')
        : undefined,
      platformFilter: filters.platformFilter || undefined,
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
    }),
    [page, filters.statusFilter, filters.platformFilter, filters.autoVerdictFilter, filters.dateFrom, filters.dateTo],
  );

  const { data, isLoading, isError, refetch } = adminTrpc.reviewTrending.list.useQuery(queryInput, {
    staleTime: 15_000,
  });

  const rows = useMemo(() => (data?.items ?? []) as unknown as QueueRow[], [data]);
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const setPage = useCallback(
    (p: number) =>
      setSearchParams({ ...Object.fromEntries(searchParams), ...filtersToParams(filters, p) }),
    [searchParams, setSearchParams, filters],
  );

  const handleFiltersChange = useCallback(
    (f: TrendingFilterState) => setSearchParams(filtersToParams(f, 1)),
    [setSearchParams],
  );

  const openDrawer = useCallback(
    (row: QueueRow) =>
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
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: '0.02em',
          }}
        >
          🔥 TrendingItem 内容审核
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          违禁词扫描 / 人工审核队列 · 共 {totalCount.toLocaleString()} 条
        </div>
      </div>

      {/* Overview cards */}
      <OverviewCards />

      {/* Filters */}
      <ReviewTrendingFilters value={filters} onChange={handleFiltersChange} />

      {/* Table */}
      <ReviewTrendingTable
        data={rows}
        loading={isLoading}
        isError={isError}
        onRefetch={() => void refetch()}
        onRowClick={openDrawer}
        selectedId={openQueueId}
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

      {/* Detail drawer */}
      <TrendingReviewDrawer
        queueId={openQueueId}
        onClose={closeDrawer}
        onActionDone={() => void refetch()}
        role={role}
      />
    </div>
  );
}
