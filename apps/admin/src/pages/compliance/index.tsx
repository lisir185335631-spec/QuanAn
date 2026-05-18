// PRD-13 US-010 · 行业合规仪表盘 /admin/compliance
// AC-1: requiredRole='readonly_admin' (法务模式) — set in admin-routes.ts
// AC-2: 4 KPI 卡片
// AC-3: 56 行业饼图 (前10 + 其他) + 时间趋势折线 + 日/周/月 + 行业 multi-select
// AC-4/5: DenseTable 合规事件列表 · 3档分组
// AC-6/7: PDF 导出 (react-pdf)
// AC-8: 配置免责模板 Button stub (super_admin only · toast '功能开发中 · P9.4')

import { useCallback, useEffect, useState } from 'react';
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';

import { adminTrpc } from '../../lib/admin-client';
import { DenseTable } from '@quanqn/ui/admin';
import type { DenseTableColumn } from '@quanqn/ui/admin';
import { ComplianceReportPdf } from './components/ComplianceReportPdf';
import type { ComplianceReportData } from './components/ComplianceReportPdf';

// ── Types ─────────────────────────────────────────────────────────────────────

type GroupingMode = 'none' | 'eventType' | 'industry';
type TrendGroupBy = 'day' | 'week' | 'month';
type EventTypeFilter = 'pii_redacted' | 'banned_word_hit' | 'industry_disclaimer_triggered' | 'all';

interface ComplianceEvent {
  id: number;
  eventCategory: string;
  eventType: string;
  userId: string | null;
  targetUserId: number | null;
  industry: string | null;
  createdAt: Date | string;
  payloadSummary: string;
  success: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  '#d4af37', '#e5c860', '#b8972e', '#f0d978', '#a07820',
  '#c9b454', '#8a6318', '#ddc870', '#6e4e10', '#ffe090',
  '#888',
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  pii_redacted: 'PII 脱敏',
  banned_word_hit: '违禁词命中',
  industry_disclaimer_triggered: '行业免责声明',
};

function fmtRelTime(d: Date | string): string {
  const dt = new Date(d as string);
  const diff = Math.floor((Date.now() - dt.getTime()) / 1000);
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d as string).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
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
  trend?: { text: string; up: boolean };
}) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '14px 16px',
        flex: 1,
        minWidth: 160,
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
        <span style={{ color: 'var(--gold)', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
          {value}
        </span>
        {sub && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{sub}</span>}
      </div>
      {trend && (
        <div style={{ marginTop: 5, fontSize: 11, color: trend.up ? '#ef4444' : '#22c55e' }}>
          {trend.text}
        </div>
      )}
    </div>
  );
}

// ── DisclaimerModal (配置免责模板 stub) ────────────────────────────────────────

function DisclaimerModal({ onClose }: { onClose: () => void }) {
  const INDUSTRIES_SAMPLE = ['金融', '医疗', '法律', '教育', '科技', '食品', '房产', '汽车'];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-panel, #111)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 24, width: 560, maxHeight: '70vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: 'var(--gold)', fontSize: 15 }}>配置行业免责模板</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 12,
            color: 'var(--gold)',
          }}
        >
          ⚠️ 功能开发中 · P9.4 — 此功能需 dual approval · 将在 P9.4 版本落地
        </div>

        {INDUSTRIES_SAMPLE.map((ind) => (
          <div key={ind} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              {ind}
            </label>
            <textarea
              disabled
              placeholder={`${ind} 行业免责文案（开发中）`}
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', borderRadius: 4, padding: '6px 8px',
                fontSize: 12, resize: 'vertical', minHeight: 50, boxSizing: 'border-box',
                cursor: 'not-allowed',
              }}
            />
          </div>
        ))}

        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-hover)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', padding: '6px 16px', borderRadius: 4,
              cursor: 'pointer', fontSize: 13,
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CompliancePage ─────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const { data: me } = adminTrpc.auth.me.useQuery();
  const role = me?.role;

  // Filters
  const [trendGroupBy, setTrendGroupBy] = useState<TrendGroupBy>('day');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [grouping, setGrouping] = useState<GroupingMode>('none');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('all');
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Data queries ───────────────────────────────────────────────────────────

  const { data: kpi, isLoading: kpiLoading } = adminTrpc.compliance.getKpiStats.useQuery(
    undefined,
    { staleTime: 60_000, refetchInterval: 60_000 },
  );

  const { data: industryData, isLoading: industryLoading } =
    adminTrpc.compliance.getIndustryBreakdown.useQuery(undefined, { staleTime: 60_000 });

  const { data: trendData, isLoading: trendLoading } = adminTrpc.compliance.getTrend.useQuery(
    {
      groupBy: trendGroupBy,
      industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
    },
    { staleTime: 30_000 },
  );

  // Event list
  const [displayItems, setDisplayItems] = useState<ComplianceEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [groupedMap, setGroupedMap] = useState<Record<string, ComplianceEvent[]> | null>(null);

  const utils = adminTrpc.useUtils();

  const fetchEvents = useCallback(
    async (cursor?: number) => {
      setTableLoading(true);
      try {
        const result = await utils.compliance.listEvents.fetch({
          limit: 50,
          grouping,
          eventTypeFilter: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
          cursor,
        });
        const items = result.items as unknown as ComplianceEvent[];
        if (cursor) {
          setDisplayItems((prev) => [...prev, ...items]);
        } else {
          setDisplayItems(items);
        }
        setNextCursor(result.nextCursor);
        setHasMore(result.nextCursor !== undefined);
        setGroupedMap(result.grouped as Record<string, ComplianceEvent[]> | null ?? null);
      } finally {
        setTableLoading(false);
      }
    },
    [grouping, eventTypeFilter, utils],
  );

  useEffect(() => {
    void fetchEvents(undefined);
  }, [fetchEvents]);

  // ── PDF data assembly ──────────────────────────────────────────────────────

  const pdfData: ComplianceReportData = {
    month: new Date().toISOString().slice(0, 7),
    generatedBy: me?.email ?? 'admin',
    reportId: `QQ-COMP-${Date.now()}`,
    kpi: {
      todayDisclaimerCount: kpi?.todayDisclaimerCount ?? 0,
      bannedWordCount: kpi?.bannedWordCount ?? 0,
      piiHitRate: kpi?.piiHitRate ?? 0,
      topIndustry: kpi?.industryTop5?.[0]?.industry ?? '—',
    },
    industryRows: (industryData?.all ?? []).slice(0, 56).map((r) => {
      const total = (industryData?.all ?? []).reduce((s, x) => s + x.count, 0);
      return { ...r, pct: total > 0 ? (r.count / total) * 100 : 0 };
    }),
    topEvents: displayItems.slice(0, 20).map((ev) => ({
      id: ev.id,
      eventType: ev.eventType,
      industry: ev.industry,
      createdAt: new Date(ev.createdAt).toISOString(),
      payloadSummary: ev.payloadSummary,
    })),
  };

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns: DenseTableColumn<ComplianceEvent>[] = [
    {
      key: 'createdAt',
      label: '时间',
      width: '100px',
      render: (r) => (
        <span
          title={fmtDate(r.createdAt)}
          style={{ color: 'var(--text-muted)', fontSize: 11, cursor: 'help' }}
        >
          {fmtRelTime(r.createdAt)}
        </span>
      ),
    },
    {
      key: 'eventCategory',
      label: '分类',
      width: '90px',
      render: () => (
        <span
          style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 3,
            background: 'rgba(212,175,55,0.12)', color: 'var(--gold)',
          }}
        >
          compliance
        </span>
      ),
    },
    {
      key: 'eventType',
      label: '事件类型',
      width: '160px',
      render: (r) => (
        <span style={{ fontSize: 11 }}>{EVENT_TYPE_LABELS[r.eventType] ?? r.eventType}</span>
      ),
    },
    {
      key: 'industry',
      label: '行业',
      width: '100px',
      render: (r) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.industry ?? '—'}</span>
      ),
    },
    {
      key: 'userId',
      label: '用户',
      width: '90px',
      render: (r) =>
        r.targetUserId ? (
          // Link to users page (redacted text · SHIELD: LD-A-3)
          <a
            href={`/admin/users?userId=${r.targetUserId}`}
            style={{ color: 'var(--text-muted)', fontSize: 11, textDecoration: 'none' }}
          >
            {/* SHIELD: show masked userId, not raw email (LD-A-3 redacted text) */}
            {r.userId}
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
        ),
    },
    {
      key: 'payloadSummary',
      label: '摘要',
      render: (r) => (
        // SHIELD: only payloadSummary (eventType + industry) · never raw payload content
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.payloadSummary}</span>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200 }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', top: 16, right: 16, zIndex: 9999,
            background: 'var(--bg-panel)', border: '1px solid var(--gold)',
            borderRadius: 6, padding: '10px 16px', fontSize: 13, color: 'var(--gold)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Disclaimer modal */}
      {showDisclaimerModal && (
        <DisclaimerModal onClose={() => setShowDisclaimerModal(false)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, margin: 0 }}>
            行业合规仪表盘
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            合规事件监控 · PII 检测 · 违禁词 · 行业免责声明
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* AC-8: 配置免责模板 · super_admin only */}
          {role === 'super_admin' && (
            <button
              type="button"
              onClick={() => {
                setShowDisclaimerModal(true);
                showToast('功能开发中 · P9.4');
              }}
              style={{
                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 4,
                cursor: 'pointer', fontSize: 12,
              }}
            >
              配置免责模板
            </button>
          )}
          {/* AC-7: PDF 导出按钮 */}
          <PDFDownloadLink
            document={<ComplianceReportPdf data={pdfData} />}
            fileName={`compliance-${pdfData.month}.pdf`}
          >
            {({ loading }) => (
              <button
                type="button"
                disabled={loading}
                style={{
                  background: loading ? 'var(--bg-hover)' : 'rgba(212,175,55,0.15)',
                  border: '1px solid var(--gold)', color: loading ? 'var(--text-muted)' : 'var(--gold)',
                  padding: '6px 14px', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                {loading ? '准备 PDF…' : '导出 PDF 月度报告'}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* AC-2: 4 KPI 卡片 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard
          label="今日免责声明触发"
          value={kpiLoading ? '—' : String(kpi?.todayDisclaimerCount ?? 0)}
          sub="次"
        />
        <KpiCard
          label="违禁词命中 (7天)"
          value={kpiLoading ? '—' : String(kpi?.bannedWordCount ?? 0)}
          trend={
            kpi?.bannedWordCount
              ? { text: `当前值 ${kpi.bannedWordCount}`, up: kpi.bannedWordCount > 10 }
              : undefined
          }
        />
        <KpiCard
          label="PII 命中率"
          value={kpiLoading ? '—' : `${kpi?.piiHitRate ?? 0}%`}
          sub={kpi ? `(${kpi.piiCount}/${kpi.totalParsed})` : undefined}
        />
        <KpiCard
          label="行业 Top 1"
          value={kpiLoading ? '—' : (kpi?.industryTop5?.[0]?.industry ?? '—')}
          sub={kpi?.industryTop5?.[0] ? `${kpi.industryTop5[0].count}次` : undefined}
        />
      </div>

      {/* AC-3: Charts row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Pie chart */}
        <div
          style={{
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '14px 16px', flex: 1, minWidth: 280,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
            行业合规事件占比 (前10 + 其他)
          </div>
          {industryLoading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              加载中…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={industryData?.pieData ?? []}
                  dataKey="count"
                  nameKey="industry"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    (percent ?? 0) > 0.05 ? `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {(industryData?.pieData ?? []).map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 4 }}
                  formatter={(v: unknown) => String(v)}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(value) => <span style={{ color: 'var(--text-muted)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line chart */}
        <div
          style={{
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '14px 16px', flex: 2, minWidth: 340,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              合规事件时间趋势
            </div>
            {/* 日/周/月 Tab */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['day', 'week', 'month'] as TrendGroupBy[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setTrendGroupBy(g)}
                  style={{
                    padding: '3px 10px', fontSize: 11, borderRadius: 3, cursor: 'pointer',
                    border: `1px solid ${trendGroupBy === g ? 'var(--gold)' : 'var(--border)'}`,
                    background: trendGroupBy === g ? 'rgba(212,175,55,0.12)' : 'var(--bg-hover)',
                    color: trendGroupBy === g ? 'var(--gold)' : 'var(--text-muted)',
                  }}
                >
                  {g === 'day' ? '日' : g === 'week' ? '周' : '月'}
                </button>
              ))}
            </div>
          </div>

          {/* 行业 multi-select */}
          {(industryData?.all?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
              {(industryData?.all ?? []).slice(0, 8).map((ind) => {
                const active = selectedIndustries.includes(ind.industry);
                return (
                  <button
                    key={ind.industry}
                    type="button"
                    onClick={() => {
                      setSelectedIndustries((prev) =>
                        active ? prev.filter((i) => i !== ind.industry) : [...prev, ind.industry],
                      );
                    }}
                    style={{
                      padding: '2px 8px', fontSize: 10, borderRadius: 10, cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                      background: active ? 'rgba(212,175,55,0.12)' : 'var(--bg-hover)',
                      color: active ? 'var(--gold)' : 'var(--text-muted)',
                    }}
                  >
                    {ind.industry}
                  </button>
                );
              })}
              {selectedIndustries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIndustries([])}
                  style={{ padding: '2px 8px', fontSize: 10, borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                >
                  全部
                </button>
              )}
            </div>
          )}

          {trendLoading ? (
            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              加载中…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={trendData ?? []}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="事件数"
                  stroke="#d4af37"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AC-4/5: 事件列表 + 分组 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          合规事件详情
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* AC-5: 分组选择 */}
          <select
            value={grouping}
            onChange={(e) => setGrouping(e.target.value as GroupingMode)}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
          >
            <option value="none">不分组</option>
            <option value="eventType">按事件类型</option>
            <option value="industry">按行业</option>
          </select>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value as EventTypeFilter)}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
          >
            <option value="all">全部类型</option>
            <option value="pii_redacted">PII 脱敏</option>
            <option value="banned_word_hit">违禁词命中</option>
            <option value="industry_disclaimer_triggered">行业免责声明</option>
          </select>
          <button
            type="button"
            onClick={() => void fetchEvents(undefined)}
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

      {/* Grouped view */}
      {grouping !== 'none' && groupedMap ? (
        <div>
          {Object.entries(groupedMap).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--gold)',
                  padding: '6px 12px', background: 'rgba(212,175,55,0.08)',
                  borderRadius: '4px 4px 0 0', border: '1px solid var(--border)',
                  borderBottom: 'none',
                }}
              >
                {grouping === 'eventType'
                  ? (EVENT_TYPE_LABELS[group] ?? group)
                  : group}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
                  ({items.length} 条)
                </span>
              </div>
              <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '0 0 4px 4px' }}>
                <DenseTable
                  columns={columns}
                  data={items as ComplianceEvent[]}
                  loading={false}
                  maxHeight="320px"
                  getRowKey={(row) => row.id}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat list */
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6 }}>
          {displayItems.length === 0 && !tableLoading ? (
            <div
              style={{
                padding: '32px 0', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: 14,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              无合规事件记录
            </div>
          ) : (
            <>
              <DenseTable
                columns={columns}
                data={displayItems}
                loading={tableLoading && displayItems.length === 0}
                maxHeight="calc(100vh - 620px)"
                getRowKey={(row) => row.id}
              />
              {hasMore && (
                <div style={{ padding: 10, textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => void fetchEvents(nextCursor)}
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
      )}
    </div>
  );
}
