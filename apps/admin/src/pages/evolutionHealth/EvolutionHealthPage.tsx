// PRD-13 US-006 · 进化档案监控 · /admin/evolution-health
// AC-2: 标准布局继承 admin Layout
// AC-3: 4 KPI 卡 + L分布饼图 + HealthGauge
// AC-4-5: DenseTable 异常账号列表 + 筛选 + cursor-based 分页
// AC-7: 空/加载/错误 + 移动端响应式
// SHIELD: forceRebuild 仅 super_admin 可见

import { useMemo, useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';
import { DenseTable } from '@quanan/ui/admin';
import type { DenseTableColumn } from '@quanan/ui/admin';
import { LDistributionPie } from './components/LDistributionPie';
import { HealthGauge } from './components/HealthGauge';
import { EvolutionHealthDrawer } from './EvolutionHealthDrawer';
import type { AnomalyRow } from './EvolutionHealthDrawer';

// ── Types ─────────────────────────────────────────────────────────────────────

type AnomalyTypeEnum =
  | 'conflicting_insights'
  | 'frequent_style_flip'
  | 'avoidlist_overflow'
  | 'flywheel_stalled'
  | 'negative_feedback_dominant';

// ── Constants ─────────────────────────────────────────────────────────────────

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  conflicting_insights: '洞察冲突',
  frequent_style_flip: '风格翻转',
  avoidlist_overflow: '屏蔽词溢出',
  flywheel_stalled: '飞轮停滞',
  negative_feedback_dominant: '负反馈主导',
};

const ANOMALY_TYPES: AnomalyTypeEnum[] = [
  'conflicting_insights',
  'frequent_style_flip',
  'avoidlist_overflow',
  'flywheel_stalled',
  'negative_feedback_dominant',
];

function severityColor(s: string): string {
  if (s === 'high') return '#ef4444';
  if (s === 'medium') return '#f59e0b';
  return 'var(--text-muted)';
}

function relativeTime(date: Date | string): string {
  const d = new Date(String(date));
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
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
  trend?: { delta: number; label: string };
}) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
          {value}
        </span>
        {sub && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{sub}</span>}
      </div>
      {trend && (
        <div
          style={{
            marginTop: 5,
            fontSize: 11,
            color: trend.delta >= 0 ? '#ef4444' : '#22c55e',
          }}
        >
          {trend.delta >= 0 ? `+${trend.delta}` : trend.delta} {trend.label}
        </div>
      )}
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

interface FilterState {
  anomalyType: string;
  severity: string;
  resolved: 'all' | 'resolved' | 'unresolved';
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '5px 8px',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      <select
        value={filters.anomalyType}
        onChange={(e) => onChange({ ...filters, anomalyType: e.target.value })}
        style={selectStyle}
        aria-label="异常类型筛选"
      >
        <option value="">全部类型</option>
        {ANOMALY_TYPES.map((t) => (
          <option key={t} value={t}>
            {ANOMALY_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      <select
        value={filters.severity}
        onChange={(e) => onChange({ ...filters, severity: e.target.value })}
        style={selectStyle}
        aria-label="严重程度筛选"
      >
        <option value="">全部严重程度</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
      <select
        value={filters.resolved}
        onChange={(e) => onChange({ ...filters, resolved: e.target.value as FilterState['resolved'] })}
        style={selectStyle}
        aria-label="解决状态筛选"
      >
        <option value="unresolved">未解决</option>
        <option value="resolved">已解决</option>
        <option value="all">全部</option>
      </select>
    </div>
  );
}

// ── EvolutionHealthPage ────────────────────────────────────────────────────��──

export default function EvolutionHealthPage() {
  const { data: me } = adminTrpc.auth.me.useQuery();
  const role = me?.role;

  const { data: lDist, isLoading: lLoading } =
    adminTrpc.evolution.getLDistribution.useQuery(undefined, { staleTime: 60_000 });

  const { data: flywheelHealth, isLoading: fhLoading } =
    adminTrpc.evolution.getFlywheelHealth.useQuery(undefined, { staleTime: 60_000 });

  const { data: anomalyStats } =
    adminTrpc.evolution.getAnomalyStats.useQuery(undefined, { staleTime: 60_000 });

  // ── List state ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    anomalyType: '',
    severity: '',
    resolved: 'unresolved',
  });

  // cursor-based pagination: prevItems holds items from pages 1..(N-1)
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [prevItems, setPrevItems] = useState<AnomalyRow[]>([]);

  const resolvedParam =
    filters.resolved === 'all' ? undefined : filters.resolved === 'resolved';

  const queryInput = useMemo(
    () => ({
      cursor,
      limit: 20,
      anomalyType: (filters.anomalyType as AnomalyTypeEnum) || undefined,
      resolved: resolvedParam,
    }),
    [cursor, filters.anomalyType, resolvedParam],
  );

  const {
    data: listData,
    isFetching: listFetching,
    isError: listError,
    refetch,
  } = adminTrpc.evolution.listAnomalies.useQuery(queryInput, { staleTime: 30_000 });

  // Synchronous accumulation: prevItems (older pages) + currentItems (latest page)
  const currentItems = (listData?.items ?? []) as AnomalyRow[];
  const allItems = cursor === undefined ? currentItems : [...prevItems, ...currentItems];
  const hasMore = listData?.nextCursor !== undefined;

  const handleFiltersChange = (f: FilterState) => {
    setFilters(f);
    setCursor(undefined);
    setPrevItems([]);
  };

  const handleLoadMore = () => {
    const nextCursor = listData?.nextCursor;
    if (nextCursor !== undefined) {
      setPrevItems(allItems);
      setCursor(nextCursor);
    }
  };

  // Client-side severity filter applied after accumulation
  const displayItems = useMemo(
    () =>
      filters.severity
        ? allItems.filter((r) => r.severity === filters.severity)
        : allItems,
    [allItems, filters.severity],
  );

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [selectedFlag, setSelectedFlag] = useState<AnomalyRow | null>(null);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(
    (): DenseTableColumn<AnomalyRow>[] => [
      {
        key: 'accountId',
        label: 'Account ID',
        width: '100px',
        render: (row) => (
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>#{row.accountId}</span>
        ),
      },
      {
        key: 'anomalyType',
        label: '异常类型',
        render: (row) => (
          <span style={{ fontSize: 11, color: 'var(--text)' }}>
            {ANOMALY_TYPE_LABELS[row.anomalyType] ?? row.anomalyType}
          </span>
        ),
      },
      {
        key: 'severity',
        label: '严重程度',
        width: '80px',
        render: (row) => (
          <span
            style={{
              fontSize: 10,
              color: severityColor(row.severity),
              border: `1px solid ${severityColor(row.severity)}44`,
              padding: '1px 5px',
              borderRadius: 3,
              fontWeight: 600,
            }}
          >
            {row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低'}
          </span>
        ),
      },
      {
        key: 'detectedAt',
        label: '检测时间',
        width: '100px',
        sortable: true,
        render: (row) => (
          <span
            style={{ fontSize: 11, color: 'var(--text-muted)' }}
            title={new Date(String(row.detectedAt)).toLocaleString('zh-CN')}
          >
            {relativeTime(row.detectedAt)}
          </span>
        ),
      },
      {
        key: 'resolution',
        label: '状态',
        width: '120px',
        render: (row) => {
          if (!row.resolvedAt) {
            return (
              <span style={{ fontSize: 11, color: '#ef4444' }}>未解决</span>
            );
          }
          return (
            <span style={{ fontSize: 11, color: '#22c55e' }}>
              已解决: {row.resolution ?? '—'}
            </span>
          );
        },
      },
      {
        key: 'actions',
        label: '操作',
        width: '80px',
        render: (row) => (
          <div style={{ display: 'flex', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--gold)', cursor: 'pointer' }}>
              详情 →
            </span>
            {!row.resolvedAt && (
              <span
                style={{ fontSize: 11, color: 'var(--text-dim)', cursor: 'pointer', marginLeft: 4 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFlag(row);
                }}
              >
                · fp
              </span>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalAnomalyCount =
    (anomalyStats?.bySeverity['high'] ?? 0) +
    (anomalyStats?.bySeverity['medium'] ?? 0) +
    (anomalyStats?.bySeverity['low'] ?? 0);

  const lDistData = lDist ?? { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 };

  // ── Render ─────────────────────────────────────────────────────────────────
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
          🧬 进化档案监控
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          EvolutionAgent 运行状态 · L 等级分布 · 异常账号 · 强制重跑
        </div>
      </div>

      {/* KPI + Charts section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Anomaly count */}
        <KpiCard
          label="未解决异常账号数"
          value={String(totalAnomalyCount)}
          trend={
            anomalyStats
              ? { delta: anomalyStats.last24h, label: '今日新增' }
              : undefined
          }
        />

        {/* Flywheel health gauge */}
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {fhLoading ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>加载中…</div>
          ) : (
            <HealthGauge
              status={flywheelHealth?.status ?? 'green'}
              stalledCount={flywheelHealth?.stalledCount ?? 0}
              conflictCount={flywheelHealth?.conflictCount ?? 0}
              healthyCount={flywheelHealth?.healthyCount ?? 0}
            />
          )}
        </div>

        {/* L distribution pie */}
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '14px 16px',
          }}
        >
          {lLoading ? (
            <div style={{ height: 200, background: 'var(--bg-hover)', borderRadius: 4 }} />
          ) : (
            <LDistributionPie data={lDistData} />
          )}
        </div>

        {/* Avg upgrade cycle — no server data yet */}
        <KpiCard label="平均升级周期" value="—" sub="暂无数据" />
      </div>

      {/* List section */}
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 12,
          }}
        >
          异常账号列表
        </div>

        <FilterBar filters={filters} onChange={handleFiltersChange} />

        {listError ? (
          <div
            style={{
              padding: '16px 0',
              color: '#ef4444',
              fontSize: 13,
            }}
          >
            数据加载失败 ·{' '}
            <button
              type="button"
              onClick={() => void refetch()}
              style={{
                background: 'none', border: 'none',
                color: 'var(--gold-text)', cursor: 'pointer',
                textDecoration: 'underline', fontSize: 13, padding: 0,
              }}
            >
              重试
            </button>
          </div>
        ) : displayItems.length === 0 && !listFetching ? (
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
            所有账号档案健康 · 0 异常
          </div>
        ) : (
          <>
            {/* Skeleton shimmer rows while loading first page */}
            {listFetching && displayItems.length === 0 ? (
              <div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 32,
                      borderRadius: 3,
                      marginBottom: 4,
                      background:
                        'linear-gradient(90deg, var(--bg-hover) 25%, var(--border) 50%, var(--bg-hover) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.4s ease infinite',
                    }}
                  />
                ))}
                <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
              </div>
            ) : (
              <DenseTable
                columns={columns}
                data={displayItems}
                loading={listFetching && displayItems.length === 0}
                maxHeight="calc(100vh - 520px)"
                onRowClick={(row) => setSelectedFlag(row)}
                selectedKey={selectedFlag?.id ?? undefined}
                getRowKey={(row) => row.id}
              />
            )}

            {hasMore && (
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={listFetching}
                  style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    padding: '6px 20px',
                    borderRadius: 4,
                    cursor: listFetching ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                  }}
                >
                  {listFetching ? '加载中…' : '加载更多'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail drawer */}
      <EvolutionHealthDrawer
        selectedFlag={selectedFlag}
        role={role}
        onClose={() => setSelectedFlag(null)}
        onFlagResolved={() => void refetch()}
      />
    </div>
  );
}
