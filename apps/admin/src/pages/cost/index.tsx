// PRD-11 US-013 · 成本仪表盘 UI
// AC-1: 主页面 + 5 sub-component
// AC-7: 时间范围 dropdown 本月/上月/本季度/本年/自定义
// AC-8: 多维切换 dropdown 用户/Specialist/模型/Provider · React Query cache 不重发请求
// AC-10: readonly_admin 财务模式可看全部(route requiredRole=admin 已控制)

import { useState, useMemo } from 'react';
import { DenseTable } from '@quanqn/ui/admin';
import type { DenseTableColumn } from '@quanqn/ui/admin';
import { adminTrpc } from '../../lib/admin-client';
import { CostOverviewCards } from './CostOverviewCards';
import { CostBreakdownChart } from './CostBreakdownChart';
import { CostAlertsPanel } from './CostAlertsPanel';

// ── Types ─────────────────────────────────────────────────────────────────────

type TimeRange = 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom';
type Dimension = 'user' | 'specialist' | 'model' | 'provider';
type GroupBy = 'day' | 'week' | 'month';

interface AggRow {
  timeBucket: Date | string;
  dimensionValue: string | null;
  totalCost: string;
  callCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDateRange(range: TimeRange): { startDate: Date; endDate: Date; groupBy: GroupBy } {
  const now = new Date();
  switch (range) {
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: now, groupBy: 'day' };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { startDate: start, endDate: end, groupBy: 'day' };
    }
    case 'thisQuarter': {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      return { startDate: start, endDate: now, groupBy: 'week' };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start, endDate: now, groupBy: 'month' };
    }
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: now, groupBy: 'day' };
    }
  }
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  thisMonth: '本月',
  lastMonth: '上月',
  thisQuarter: '本季度',
  thisYear: '本年',
  custom: '自定义',
};

const DIMENSION_LABELS: Record<Dimension, string> = {
  user: '用户',
  specialist: 'Specialist',
  model: '模型',
  provider: 'Provider',
};

function formatDate(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

// ── UI primitives ─────────────────────────────────────────────────────────────

const dropdownStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '5px 12px',
  borderRadius: 4,
  fontSize: 13,
  cursor: 'pointer',
  outline: 'none',
};

function showToast(msg: string, type: 'ok' | 'warn' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : type === 'warn' ? '#f59e0b' : '#ef4444';
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
    background: '#111', border: `1px solid ${color}`, color,
    padding: '10px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildTableColumns(dimension: Dimension): DenseTableColumn<AggRow>[] {
  return [
    {
      key: 'timeBucket',
      label: '时间',
      width: '120px',
      render: (row) => formatDate(row.timeBucket),
    },
    {
      key: 'dimensionValue',
      label: DIMENSION_LABELS[dimension],
      render: (row) => row.dimensionValue ?? '—',
    },
    {
      key: 'totalCost',
      label: '总成本 (USD)',
      width: '140px',
      render: (row) => (
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
          $ {parseFloat(row.totalCost).toFixed(4)}
        </span>
      ),
    },
    {
      key: 'callCount',
      label: '调用次数',
      width: '100px',
      render: (row) => row.callCount.toLocaleString(),
    },
  ];
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CostPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
  const [dimension, setDimension] = useState<Dimension>('user');
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const { startDate, endDate, groupBy } = useMemo(() => getDateRange(timeRange), [timeRange]);

  const { data: aggData, isLoading: aggLoading } = adminTrpc.cost.aggregate.useQuery(
    { startDate, endDate, dimension, groupBy },
    { staleTime: 60_000 },
  );

  const { refetch: fetchCsv } = adminTrpc.cost.exportCsv.useQuery(
    { startDate, endDate },
    { enabled: false },
  );

  const exportPdfMutation = adminTrpc.cost.exportMonthlyPdf.useMutation();

  function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async function handleExportPdf() {
    setIsPdfExporting(true);
    try {
      const month = getCurrentMonth();
      const result = await exportPdfMutation.mutateAsync({ month });
      const bytes = Uint8Array.from(atob(result.data), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`PDF 导出完成 · ${(result.size / 1024).toFixed(1)} KB`, 'ok');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`PDF 导出失败: ${msg}`, 'err');
    } finally {
      setIsPdfExporting(false);
    }
  }

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const result = await fetchCsv();
      const csv = result.data?.csv;
      if (!csv) {
        showToast('导出失败: 无数据', 'err');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`导出完成 · ${result.data?.rowCount ?? 0} 行`, 'ok');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`导出失败: ${msg}`, 'err');
    } finally {
      setIsExporting(false);
    }
  }

  const tableRows = aggData?.aggregations ?? [];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.02em' }}>
            💰 成本仪表盘
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            LLM 调用费用 · 多维分析 · 告警 · 导出
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Time range */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            style={dropdownStyle}
          >
            {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((r) => (
              <option key={r} value={r}>{TIME_RANGE_LABELS[r]}</option>
            ))}
          </select>

          {/* Dimension */}
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as Dimension)}
            style={dropdownStyle}
          >
            {(Object.keys(DIMENSION_LABELS) as Dimension[]).map((d) => (
              <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
            ))}
          </select>

          {/* PDF Export */}
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={isPdfExporting}
            style={{
              background: 'none',
              border: '1px solid var(--accent-3)',
              color: 'var(--accent-3)',
              padding: '5px 14px',
              borderRadius: 4,
              fontSize: 13,
              cursor: isPdfExporting ? 'not-allowed' : 'pointer',
              opacity: isPdfExporting ? 0.6 : 1,
              fontWeight: 500,
            }}
          >
            {isPdfExporting ? '生成中…' : '月度账单 PDF'}
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={() => void handleExportCsv()}
            disabled={isExporting}
            style={{
              background: 'none',
              border: '1px solid var(--gold)',
              color: 'var(--gold)',
              padding: '5px 14px',
              borderRadius: 4,
              fontSize: 13,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.6 : 1,
              fontWeight: 500,
            }}
          >
            {isExporting ? '导出中…' : 'CSV 导出'}
          </button>
        </div>
      </div>

      {/* Main grid: left content + right alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        {/* Left column */}
        <div>
          {/* Overview cards + Top 10 bar */}
          <CostOverviewCards startDate={startDate} endDate={endDate} groupBy={groupBy} />

          {/* Breakdown chart: multiline + pie */}
          <CostBreakdownChart startDate={startDate} endDate={endDate} groupBy={groupBy} />

          {/* Detail table */}
          <div
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '12px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                详细数据 · {DIMENSION_LABELS[dimension]} 维度
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {aggLoading ? '加载中…' : `${tableRows.length} 行`}
              </span>
            </div>

            {tableRows.length === 0 && !aggLoading ? (
              <div style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                暂无数据
              </div>
            ) : (
              <DenseTable
                columns={buildTableColumns(dimension)}
                data={tableRows as AggRow[]}
                maxHeight="500px"
              />
            )}
          </div>
        </div>

        {/* Right column: alerts */}
        <CostAlertsPanel />
      </div>
    </div>
  );
}
