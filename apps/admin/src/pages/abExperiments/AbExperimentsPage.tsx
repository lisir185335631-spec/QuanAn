// PRD-14 US-004 · A/B 实验管理 · /admin/ab-experiments
// AC-2: 顶部 4 KPI + DenseTable 实验列表
// AC-3: 列: experimentKey / name / status badge / variantCount / sampleSize / p-value / 操作
// AC-4: 筛选 status + createdByAdminId + dateRange · startedAt DESC · cursor 20/page
// AC-7: 启动走 abExperiment.start.mutate(dual approval)
// AC-8: 一键停损 super_admin only (in drawer)
// SHIELD: setInterval 30s polling (anti_pattern: WebSocket over-engineer)

import { useCallback, useEffect, useState } from 'react';

import { adminTrpc } from '../../lib/admin-client';
import { DenseTable } from '@quanqn/ui/admin';
import type { DenseTableColumn } from '@quanqn/ui/admin';
import type { ExperimentRow } from './AbExperimentDrawer';
import { AbExperimentDrawer } from './AbExperimentDrawer';
import { CreateExperimentModal } from './components/CreateExperimentModal';

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(String(d)).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; color: string }> = {
    running: { text: '运行中', color: '#22c55e' },
    draft: { text: '草稿', color: '#6b7280' },
    stopped: { text: '已停损', color: '#ef4444' },
    completed: { text: '已完成', color: '#3b82f6' },
  };
  const { text, color } = map[status] ?? { text: status, color: 'var(--text-muted)' };
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        borderRadius: 4,
        padding: '1px 6px',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
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
    </div>
  );
}

// ── AbExperimentsPage ─────────────────────────────────────────────────────

export default function AbExperimentsPage() {
  const { data: me } = adminTrpc.auth.me.useQuery();
  const currentRole = me?.role;

  // Filters
  const [statusFilter, setStatusFilter] = useState<'draft' | 'running' | 'stopped' | 'completed' | ''>('');
  const [adminIdInput, setAdminIdInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<(number | undefined)[]>([]);

  // Selected drawer
  const [selected, setSelected] = useState<ExperimentRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // KPI stats
  const { data: kpiData, refetch: refetchKpi } = adminTrpc.abExperiments.getKpiStats.useQuery();

  // Experiments list
  const parsedAdminId = adminIdInput ? parseInt(adminIdInput, 10) : undefined;

  const {
    data: listData,
    refetch: refetchList,
    isFetching,
  } = adminTrpc.abExperiments.list.useQuery({
    cursor,
    status: statusFilter || undefined,
    createdByAdminId: parsedAdminId && !isNaN(parsedAdminId) ? parsedAdminId : undefined,
    startDateFrom: dateFrom ? new Date(dateFrom) : undefined,
    startDateTo: dateTo ? new Date(dateTo) : undefined,
  });

  const refetchAll = useCallback(() => {
    void refetchKpi();
    void refetchList();
  }, [refetchKpi, refetchList]);

  // 30s polling
  useEffect(() => {
    const id = setInterval(refetchAll, 30_000);
    return () => clearInterval(id);
  }, [refetchAll]);

  // ── Columns ───────────────────────────────────────────────────────────

  const columns: DenseTableColumn<ExperimentRow>[] = [
    {
      key: 'experimentKey',
      label: 'Key',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold)' }}>
          {row.experimentKey}
        </span>
      ),
    },
    {
      key: 'name',
      label: '名称',
      render: (row) => <span style={{ fontSize: 13 }}>{row.name}</span>,
    },
    {
      key: 'status',
      label: '状态',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'variantCount',
      label: 'Variants',
      render: (row) => <span>{row.variantCount}</span>,
    },
    {
      key: 'sampleSize',
      label: 'Sample',
      render: (row) => <span>{row.sampleSize.toLocaleString()}</span>,
    },
    {
      key: 'currentPValue',
      label: 'p-value',
      render: (row) => {
        if (row.currentPValue == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        const sig = row.currentPValue < 0.05;
        return (
          <span style={{ fontSize: 12, color: sig ? '#22c55e' : 'var(--text-muted)', fontWeight: sig ? 700 : 400 }}>
            {row.currentPValue.toFixed(3)}
          </span>
        );
      },
    },
    {
      key: 'startedAt',
      label: '启动时间',
      render: (row) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(row.startedAt)}</span>,
    },
    {
      key: 'id',
      label: '操作',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelected(row); }}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '3px 8px',
            fontSize: 11,
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          详情
        </button>
      ),
    },
  ];

  const items = listData?.items ?? [];
  const nextCursor = listData?.nextCursor;

  function handleNextPage() {
    if (nextCursor) {
      setCursorStack((s) => [...s, cursor]);
      setCursor(nextCursor);
    }
  }

  function handlePrevPage() {
    const prev = cursorStack[cursorStack.length - 1];
    setCursorStack((s) => s.slice(0, -1));
    setCursor(prev);
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700 }}>
          🧪 A/B 实验管理
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            background: 'var(--gold)',
            color: '#000',
            border: 'none',
            borderRadius: 5,
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          + 新建实验
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard
          label="运行中实验"
          value={String(kpiData?.runningCount ?? '—')}
        />
        <KpiCard
          label="7天新启"
          value={String(kpiData?.recentStarted ?? '—')}
        />
        <KpiCard
          label="平均 Sample Size"
          value={kpiData?.avgSampleSize != null ? kpiData.avgSampleSize.toLocaleString() : '—'}
          sub="用户/实验"
        />
        <KpiCard
          label="自动停损率(近30天)"
          value={kpiData?.autoStopRate != null ? `${kpiData.autoStopRate}%` : '—'}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setCursor(undefined);
            setCursorStack([]);
          }}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 5,
            padding: '5px 10px',
            color: 'var(--text-primary)',
            fontSize: 13,
          }}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="running">运行中</option>
          <option value="stopped">已停损</option>
          <option value="completed">已完成</option>
        </select>

        <input
          type="number"
          value={adminIdInput}
          onChange={(e) => {
            setAdminIdInput(e.target.value);
            setCursor(undefined);
            setCursorStack([]);
          }}
          placeholder="管理员 ID"
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 5,
            padding: '5px 10px',
            color: 'var(--text-primary)',
            fontSize: 13,
            width: 110,
          }}
        />

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setCursor(undefined);
            setCursorStack([]);
          }}
          placeholder="开始日期"
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 5,
            padding: '5px 10px',
            color: 'var(--text-primary)',
            fontSize: 13,
          }}
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setCursor(undefined);
            setCursorStack([]);
          }}
          placeholder="结束日期"
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 5,
            padding: '5px 10px',
            color: 'var(--text-primary)',
            fontSize: 13,
          }}
        />

        <button
          onClick={refetchAll}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 5,
            padding: '5px 12px',
            color: 'var(--text-muted)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {isFetching ? '刷新中…' : '刷新'}
        </button>
      </div>

      {/* Table */}
      <DenseTable
        columns={columns}
        data={items}
        getRowKey={(r) => r.id}
        onRowClick={setSelected}
      />
      {items.length === 0 && !isFetching && (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
          暂无实验
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button
          onClick={handlePrevPage}
          disabled={cursorStack.length === 0}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '4px 12px',
            fontSize: 12,
            color: cursorStack.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: cursorStack.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          ← 上一页
        </button>
        <button
          onClick={handleNextPage}
          disabled={!nextCursor}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '4px 12px',
            fontSize: 12,
            color: nextCursor ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: nextCursor ? 'pointer' : 'not-allowed',
          }}
        >
          下一页 →
        </button>
      </div>

      {/* Drawer */}
      <AbExperimentDrawer
        selected={selected}
        currentRole={currentRole}
        onClose={() => setSelected(null)}
        onRefresh={refetchAll}
      />

      {/* Create modal */}
      {showCreate && (
        <CreateExperimentModal
          onClose={() => setShowCreate(false)}
          onCreated={refetchAll}
        />
      )}
    </div>
  );
}
