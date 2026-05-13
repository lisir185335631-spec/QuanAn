// PRD-12 US-005/006 · ReviewTrendingPage — 列表 + 抽屉 + 批量 + 规则配置
// US-005 AC-1/9: admin-routes metadata · URL filter persistence
// US-006 AC-4: Tab 切换 [待审核/已批准/已驳回/规则配置]
// US-006 AC-7/8/10: 规则 Tab 仅 super_admin 显示

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminTrpc } from '../../lib/admin-client';
import { OverviewCards } from './OverviewCards';
import { ReviewTrendingFilters } from './ReviewTrendingFilters';
import type { TrendingFilterState } from './ReviewTrendingFilters';
import { ReviewTrendingTable } from './ReviewTrendingTable';
import type { QueueRow } from './ReviewTrendingTable';
import { TrendingReviewDrawer } from './TrendingReviewDrawer';
import { BatchActionBar } from './BatchActionBar';
import { RejectReasonDialog } from './RejectReasonDialog';
import { AutoRuleConfigPanel } from './AutoRuleConfigPanel';

const PAGE_SIZE = 20;

type MainTab = 'pending' | 'approved' | 'rejected' | 'rules';

const TABS: { id: MainTab; label: string }[] = [
  { id: 'pending', label: '待审核' },
  { id: 'approved', label: '已批准' },
  { id: 'rejected', label: '已驳回' },
  { id: 'rules', label: '规则配置' },
];

function parseFilters(params: URLSearchParams): Omit<TrendingFilterState, 'statusFilter'> {
  return {
    platformFilter: params.get('platform') ?? '',
    autoVerdictFilter: params.get('verdict') ?? '',
    dateFrom: params.get('from') ?? '',
    dateTo: params.get('to') ?? '',
  };
}

function filtersToParams(
  f: Omit<TrendingFilterState, 'statusFilter'>,
  page: number,
): Record<string, string> {
  const p: Record<string, string> = { page: String(page) };
  if (f.platformFilter) p['platform'] = f.platformFilter;
  if (f.autoVerdictFilter) p['verdict'] = f.autoVerdictFilter;
  if (f.dateFrom) p['from'] = f.dateFrom;
  if (f.dateTo) p['to'] = f.dateTo;
  return p;
}

function PageBtn({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
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
  const [activeTab, setActiveTab] = useState<MainTab>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [pendingBatchAction, setPendingBatchAction] = useState<'approve' | 'reject' | null>(null);

  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
  const openQueueId = searchParams.get('queueId')
    ? parseInt(searchParams.get('queueId')!, 10)
    : null;
  const filters = parseFilters(searchParams);

  const { data: me } = adminTrpc.auth.me.useQuery();
  const role = me?.role;
  const isSuperAdmin = role === 'super_admin';
  const isReadonlyAdmin = role === 'readonly_admin';

  const queryInput = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      statusFilter:
        activeTab !== 'rules'
          ? (activeTab as 'pending' | 'approved' | 'rejected')
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
    [
      page,
      activeTab,
      filters.platformFilter,
      filters.autoVerdictFilter,
      filters.dateFrom,
      filters.dateTo,
    ],
  );

  const { data, isLoading, isError, refetch } = adminTrpc.reviewTrending.list.useQuery(
    queryInput,
    {
      enabled: activeTab !== 'rules',
      staleTime: 15_000,
    },
  );

  const batchMut = adminTrpc.reviewTrending.batchAction.useMutation({
    onSuccess: (result) => {
      const msg = `批量操作完成 · ${result.succeeded}/${result.total} 成功`;
      showToast(msg, result.succeeded === result.total ? 'ok' : 'warn');
      setSelectedIds(new Set());
      setRejectDialogOpen(false);
      void refetch();
    },
    onError: (err) => {
      showToast(`批量操作失败: ${err.message}`, 'err');
    },
  });

  const rows = useMemo(() => (data?.items ?? []) as unknown as QueueRow[], [data]);
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      setActiveTab(tab);
      setSelectedIds(new Set());
      setSearchParams({ page: '1' });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (p: number) =>
      setSearchParams({ ...Object.fromEntries(searchParams), ...filtersToParams(filters, p) }),
    [searchParams, setSearchParams, filters],
  );

  const handleFiltersChange = useCallback(
    (f: TrendingFilterState) =>
      setSearchParams(filtersToParams({ ...f }, 1)),
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

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(rows.map((r) => r.id)));
  }, [rows]);

  const handleClearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBatchApprove = useCallback(() => {
    if (selectedIds.size === 0) return;
    setPendingBatchAction('approve');
    batchMut.mutate({
      queueIds: Array.from(selectedIds),
      action: 'approve',
    });
  }, [selectedIds, batchMut]);

  const handleBatchRejectClick = useCallback(() => {
    if (selectedIds.size === 0) return;
    setPendingBatchAction('reject');
    setRejectDialogOpen(true);
  }, [selectedIds]);

  const handleBatchRejectConfirm = useCallback(
    (reason: string) => {
      batchMut.mutate({
        queueIds: Array.from(selectedIds),
        action: 'reject',
        reason,
      });
    },
    [selectedIds, batchMut],
  );

  const showBatchBar = activeTab === 'pending' && !isReadonlyAdmin;

  // Tabs the current user can see (non-super_admin hides 'rules')
  const visibleTabs = isSuperAdmin ? TABS : TABS.filter((t) => t.id !== 'rules');

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
        {activeTab !== 'rules' && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            违禁词扫描 / 人工审核队列 · 共 {totalCount.toLocaleString()} 条
          </div>
        )}
      </div>

      {/* Main tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginBottom: 16,
          gap: 0,
        }}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '8px 18px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom:
                activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rules tab content */}
      {activeTab === 'rules' && isSuperAdmin && <AutoRuleConfigPanel />}

      {/* List tabs content */}
      {activeTab !== 'rules' && (
        <>
          {/* Overview cards */}
          <OverviewCards />

          {/* Filters (status controlled by tab — hide status dropdown) */}
          <ReviewTrendingFilters
            value={{
              statusFilter: activeTab,
              platformFilter: filters.platformFilter,
              autoVerdictFilter: filters.autoVerdictFilter,
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo,
            }}
            onChange={handleFiltersChange}
            hideStatus
          />

          {/* Batch action bar (only for pending tab, non-readonly) */}
          {showBatchBar && (
            <BatchActionBar
              selectedCount={selectedIds.size}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
              totalOnPage={rows.length}
              onBatchApprove={handleBatchApprove}
              onBatchReject={handleBatchRejectClick}
              isPending={batchMut.isPending && pendingBatchAction === 'approve'}
            />
          )}

          {/* Table */}
          <ReviewTrendingTable
            data={rows}
            loading={isLoading}
            isError={isError}
            onRefetch={() => void refetch()}
            onRowClick={openDrawer}
            selectedId={openQueueId}
            selectedIds={showBatchBar ? selectedIds : undefined}
            onToggleSelect={showBatchBar ? handleToggleSelect : undefined}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <PageBtn label="← 上页" disabled={page <= 1} onClick={() => setPage(page - 1)} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 8px' }}>
                {page} / {totalPages}
              </span>
              <PageBtn
                label="下页 →"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              />
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      <TrendingReviewDrawer
        queueId={openQueueId}
        onClose={closeDrawer}
        onActionDone={() => void refetch()}
        role={role}
      />

      {/* Batch reject reason dialog */}
      <RejectReasonDialog
        open={rejectDialogOpen}
        title={`批量驳回 · 已选 ${selectedIds.size} 条`}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={handleBatchRejectConfirm}
        isPending={batchMut.isPending && pendingBatchAction === 'reject'}
      />
    </div>
  );
}

function showToast(msg: string, type: 'ok' | 'warn' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : type === 'warn' ? '#f59e0b' : '#ef4444';
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '9999',
    background: '#111',
    border: `1px solid ${color}`,
    color,
    padding: '10px 18px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
