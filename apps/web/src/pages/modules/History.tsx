/**
 * History.tsx — /history 操作历史 · PRD-15 US-008
 * 1:1 实现 ui/_12+_15 设计(2 view: timeline + dashboard)
 * AC-1: 200+ 行完整实现
 * AC-2: View 1 timeline 默认 · 按天分组 · 工具 icon+名+input摘要+output摘要+时间+操作
 * AC-3: View 2 dashboard · 4 KPI + 4 chart
 * AC-4: URL state ?view=timeline|dashboard
 * AC-5: 多工具筛选 ?tools=copywriting,videoAnalysis
 * AC-6: 时间范围 今日/本周/本月/全部
 * AC-7: trpc.history.list.useQuery({tools,dateRange,page}) + trpc.history.stats.useQuery
 * AC-8: 恢复并重跑 → 跳对应工具页 ?topic=xxx&restored=historyId
 */

import {
  BarChart2,
  BookOpen,
  Brain,
  DollarSign,
  Eye,
  Film,
  LayoutDashboard,
  List,
  Loader2,
  Mic,
  PenLine,
  PenTool,
  Play,
  RefreshCw,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Users,
  Wand2,
  Zap,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { trpc } from '@/lib/trpc';

import type { HistoryListRow } from '@quanan/clients/router-types';

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'timeline' | 'dashboard';
type DateRange = 'today' | 'week' | 'month' | 'custom';

// ── Tool definitions (14 tools) ───────────────────────────────────────────────

const TOOL_DEFS = [
  { slug: 'copywriting', label: '文案创作', icon: PenTool, agentIds: ['CopywritingAgent'] },
  { slug: 'trending', label: '爆款情报', icon: TrendingUp, agentIds: ['TrendingAgent'] },
  { slug: 'boomGenerate', label: 'Boom 生成', icon: Zap, agentIds: ['CopywritingAgent'] },
  { slug: 'generate', label: '自由生成', icon: PenLine, agentIds: ['CopywritingAgent'] },
  { slug: 'presentStyles', label: '呈现风格', icon: LayoutDashboard, agentIds: ['PresentStylesAgent'] },
  { slug: 'monetization', label: '变现方向', icon: DollarSign, agentIds: ['MonetizationAgent'] },
  { slug: 'privateDomain', label: '私域路径', icon: Users, agentIds: ['PrivateDomainAgent'] },
  { slug: 'analysis', label: '结构分析', icon: BarChart2, agentIds: ['AnalysisAgent'] },
  { slug: 'videoAnalysis', label: '视频分析', icon: Play, agentIds: ['VideoAnalysisAgent'] },
  { slug: 'videoProduction', label: '视频制作', icon: Film, agentIds: ['VideoProductionAgent', 'VideoAgent'] },
  { slug: 'acquisitionVideo', label: '获客视频', icon: Target, agentIds: ['VideoAgent'] },
  { slug: 'aiVideo', label: 'AI 视频', icon: Wand2, agentIds: ['VideoAgent'] },
  { slug: 'voiceChat', label: '语音聊天', icon: Mic, agentIds: ['VoiceChatAgent'] },
  { slug: 'deepLearning', label: '深度学习', icon: Brain, agentIds: ['DeepLearningAgent'] },
  { slug: 'knowledge', label: '知识库', icon: BookOpen, agentIds: ['KnowledgeAgent'] },
] as const;

type ToolSlug = (typeof TOOL_DEFS)[number]['slug'];

const PIE_COLORS = ['#6366f1', '#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#f43f5e', '#64748b'];

// ── URL state helpers ─────────────────────────────────────────────────────────

function readViewFromUrl(params: URLSearchParams): ViewMode {
  const v = params.get('view');
  return v === 'dashboard' ? 'dashboard' : 'timeline';
}

function readToolsFromUrl(params: URLSearchParams): ToolSlug[] {
  const t = params.get('tools');
  if (!t) return [];
  const valid = new Set(TOOL_DEFS.map((d) => d.slug as string));
  return t.split(',').filter((s) => valid.has(s)) as ToolSlug[];
}

function readDateRangeFromUrl(params: URLSearchParams): DateRange {
  const d = params.get('dateRange');
  return (['today', 'week', 'month', 'custom'] as DateRange[]).includes(d as DateRange)
    ? (d as DateRange)
    : 'month';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400_000);
  if (date.toDateString() === today.toDateString()) return '今天';
  if (date.toDateString() === yesterday.toDateString()) return '昨天';
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(date);
}

function dayKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().split('T')[0]!;
}

function groupByDay(rows: HistoryListRow[]): Array<{ day: string; label: string; rows: HistoryListRow[] }> {
  const map = new Map<string, HistoryListRow[]>();
  for (const r of rows) {
    const k = dayKey(r.createdAt);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, rows]) => ({ day, label: formatDate(new Date(day + 'T12:00:00')), rows }));
}

function getToolInfo(row: HistoryListRow) {
  const mode = row.agentMode ?? '';
  const agentId = row.agentId;

  if (mode === 'boom') return TOOL_DEFS.find((d) => d.slug === 'boomGenerate')!;
  if (mode === 'free' || (agentId === 'CopywritingAgent' && !mode))
    return TOOL_DEFS.find((d) => d.slug === 'copywriting')!;
  if (mode === 'structural') return TOOL_DEFS.find((d) => d.slug === 'analysis')!;
  if (mode === 'viral') return TOOL_DEFS.find((d) => d.slug === 'videoAnalysis')!;
  if (mode === 'production') return TOOL_DEFS.find((d) => d.slug === 'videoProduction')!;
  if (mode === 'storyboard') return TOOL_DEFS.find((d) => d.slug === 'aiVideo')!;
  if (mode === 'acquisition' && agentId === 'VideoAgent')
    return TOOL_DEFS.find((d) => d.slug === 'acquisitionVideo')!;
  if (mode === 'acquisition') return TOOL_DEFS.find((d) => d.slug === 'copywriting')!;

  const byAgentId = TOOL_DEFS.find((d) => d.agentIds.includes(agentId as never));
  return byAgentId ?? TOOL_DEFS[0]!;
}

function getToolRestoreUrl(row: HistoryListRow): string | null {
  const mode = row.agentMode ?? '';
  const topic = encodeURIComponent(row.inputSummary.substring(0, 200));
  const id = row.id;

  if (mode === 'free') return `/generate?topic=${topic}&restored=${id}`;
  if (mode === 'boom') return `/boom-generate?topic=${topic}&restored=${id}`;
  if (mode === 'structural') return `/analysis?topic=${topic}&restored=${id}`;
  if (mode === 'viral') return `/video-analysis?topic=${topic}&restored=${id}`;
  if (mode === 'production') return `/video-production?topic=${topic}&restored=${id}`;
  if (mode === 'storyboard') return `/ai-video?topic=${topic}&restored=${id}`;
  if (mode === 'acquisition' && row.agentId === 'VideoAgent')
    return `/acquisition-video?topic=${topic}&restored=${id}`;
  if (mode === 'acquisition') return `/generate?mode=acquisition&topic=${topic}&restored=${id}`;
  if (row.agentId === 'TrendingAgent') return `/trending?topic=${topic}&restored=${id}`;
  if (row.agentId === 'PresentStylesAgent') return `/present-styles?topic=${topic}&restored=${id}`;
  if (row.agentId === 'MonetizationAgent') return `/monetization?topic=${topic}&restored=${id}`;
  if (row.agentId === 'PrivateDomainAgent') return `/private-domain?topic=${topic}&restored=${id}`;
  if (row.agentId === 'VoiceChatAgent') return `/voice-chat?topic=${topic}&restored=${id}`;
  if (row.agentId === 'DeepLearningAgent') return `/deep-learning?topic=${topic}&restored=${id}`;
  if (row.agentId === 'KnowledgeAgent') return `/knowledge?topic=${topic}&restored=${id}`;
  return null;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义日期' },
];

// ── HistoryDetailDrawer ───────────────────────────────────────────────────────

interface DrawerProps {
  row: HistoryListRow | null;
  onClose: () => void;
}

function HistoryDetailDrawer({ row, onClose }: DrawerProps) {
  if (!row) return null;
  const toolInfo = getToolInfo(row);
  const ToolIcon = toolInfo.icon;

  return (
    <Sheet open={!!row} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:w-[560px] overflow-y-auto"
        data-testid="history-detail-drawer"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ToolIcon className="h-5 w-5 text-primary" />
            {toolInfo.label} · 详情
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-label-sm font-label text-muted-foreground uppercase tracking-wide mb-1">输入</p>
            <p className="text-body-sm text-on-surface whitespace-pre-wrap rounded-md bg-surface-variant p-3">
              {row.inputSummary}
            </p>
          </div>
          <div>
            <p className="text-label-sm font-label text-muted-foreground uppercase tracking-wide mb-1">输出</p>
            <pre className="text-body-sm text-on-surface whitespace-pre-wrap rounded-md bg-surface-variant p-3 overflow-auto max-h-[60vh]">
              {row.content}
            </pre>
          </div>
          <div className="flex items-center gap-4 text-body-sm text-muted-foreground">
            <span>Agent: {row.agentId}</span>
            <span>创建: {new Date(row.createdAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── HistoryTimeline ───────────────────────────────────────────────────────────

interface TimelineProps {
  rows: HistoryListRow[];
  isLoading: boolean;
  error: unknown;
  onViewDetail: (row: HistoryListRow) => void;
  onRestore: (row: HistoryListRow) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
}

function HistoryTimeline({
  rows,
  isLoading,
  error,
  onViewDetail,
  onRestore,
  onDelete,
  deletingId,
}: TimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12" data-testid="history-loading">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>加载中…</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive py-12" data-testid="history-error">加载失败，请刷新重试</p>;
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg border border-border py-16 text-center text-body-md text-muted-foreground" data-testid="history-empty">
        暂无历史记录
      </div>
    );
  }

  const groups = groupByDay(rows);

  return (
    <div className="space-y-6" data-testid="history-timeline">
      {groups.map(({ day, label, rows: dayRows }) => (
        <div key={day}>
          <p
            className="text-label-sm font-label text-muted-foreground uppercase tracking-wide mb-3"
            data-testid={`timeline-day-${day}`}
          >
            {label}
          </p>
          <div className="space-y-2">
            {dayRows.map((row) => {
              const toolInfo = getToolInfo(row);
              const ToolIcon = toolInfo.icon;
              const restoreUrl = getToolRestoreUrl(row);

              return (
                <div
                  key={row.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-surface-variant/30 transition-colors"
                  data-testid={`timeline-row-${row.id}`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <ToolIcon className="h-4 w-4 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-label-sm font-label text-primary">{toolInfo.label}</span>
                      <span className="text-body-sm text-muted-foreground">{formatTime(row.createdAt)}</span>
                    </div>
                    <p className="text-body-sm text-on-surface truncate">
                      <span className="text-muted-foreground">输入：</span>
                      {row.inputSummary.substring(0, 60)}
                    </p>
                    <p className="text-body-sm text-muted-foreground truncate mt-0.5">
                      <span>输出：</span>
                      {row.content.substring(0, 60)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => onViewDetail(row)}
                      data-testid={`history-view-btn-${row.id}`}
                      aria-label="查看完整"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {restoreUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-500"
                        onClick={() => onRestore(row)}
                        data-testid={`history-restore-btn-${row.id}`}
                        aria-label="恢复并重跑"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(row.id)}
                      disabled={deletingId === row.id}
                      data-testid={`history-delete-btn-${row.id}`}
                      aria-label="删除"
                    >
                      {deletingId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-sm font-label text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-on-surface">{value}</p>
            {sub && <p className="mt-0.5 text-body-sm text-muted-foreground">{sub}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── HistoryDashboard ──────────────────────────────────────────────────────────

interface DashboardProps {
  dateRange: DateRange;
  tools: ToolSlug[];
  dateFrom?: string;
  dateTo?: string;
}

function HistoryDashboard({ dateRange, tools, dateFrom, dateTo }: DashboardProps) {
  const { data: stats, isLoading } = trpc.history.stats.useQuery({
    dateRange,
    tools: tools.length ? tools : undefined,
    dateFrom: dateRange === 'custom' ? dateFrom : undefined,
    dateTo: dateRange === 'custom' ? dateTo : undefined,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>加载统计中…</span>
      </div>
    );
  }

  const s = stats ?? {
    totalCalls: 0,
    failureRate: 0,
    avgDurationMs: 0,
    topTools: [],
    dailyTrend: [],
    durationHistogram: [],
    modelDistribution: [],
  };

  const topTool = s.topTools[0]?.agentId ?? '—';
  const failPct = `${(s.failureRate * 100).toFixed(1)}%`;
  const avgSec =
    s.avgDurationMs > 0 ? `${(s.avgDurationMs / 1000).toFixed(1)}s` : '—';

  const trendData = [...s.dailyTrend].reverse();

  return (
    <div className="space-y-6" data-testid="history-dashboard">
      {/* 4 KPI 卡片 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="history-kpi-cards">
        <KpiCard label="总调用数" value={String(s.totalCalls)} icon={BarChart2} />
        <KpiCard label="最常用工具" value={topTool} icon={TrendingUp} />
        <KpiCard label="平均耗时" value={avgSec} icon={Timer} />
        <KpiCard label="失败率" value={failPct} icon={XCircle} />
      </div>

      {/* 4 Charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 每日调用趋势 */}
        <Card>
          <CardHeader>
            <span className="text-label-sm font-label text-muted-foreground uppercase tracking-wide">
              每日调用趋势
            </span>
          </CardHeader>
          <CardContent data-testid="history-chart-daily-trend">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 4, right: 16, left: -24, bottom: 4 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 工具分布 pie */}
        <Card>
          <CardHeader>
            <span className="text-label-sm font-label text-muted-foreground uppercase tracking-wide">
              工具分布
            </span>
          </CardHeader>
          <CardContent data-testid="history-chart-tool-distribution">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={s.topTools}
                  dataKey="count"
                  nameKey="agentId"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${String(name ?? '').replace('Agent', '')}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {s.topTools.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 耗时分布 histogram */}
        <Card>
          <CardHeader>
            <span className="text-label-sm font-label text-muted-foreground uppercase tracking-wide">
              耗时分布
            </span>
          </CardHeader>
          <CardContent data-testid="history-chart-duration-histogram">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={s.durationHistogram}
                margin={{ top: 4, right: 16, left: -24, bottom: 4 }}
              >
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 模型分布 bar */}
        <Card>
          <CardHeader>
            <span className="text-label-sm font-label text-muted-foreground uppercase tracking-wide">
              模型分布
            </span>
          </CardHeader>
          <CardContent data-testid="history-chart-model-distribution">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={s.modelDistribution}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 16, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="model"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#a78bfa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 table */}
      {s.topTools.length > 0 && (
        <Card>
          <CardHeader>
            <span className="text-label-sm font-label text-muted-foreground uppercase tracking-wide">
              最常用工具 Top 5
            </span>
          </CardHeader>
          <CardContent data-testid="history-top-tools-table">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium text-muted-foreground">Agent</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">调用次数</th>
                </tr>
              </thead>
              <tbody>
                {s.topTools.map((t) => (
                  <tr key={t.agentId} className="border-b border-border last:border-0">
                    <td className="py-2 text-on-surface">{t.agentId.replace('Agent', '')}</td>
                    <td className="py-2 text-right text-on-surface">{t.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function History() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = readViewFromUrl(searchParams);
  const selectedTools = readToolsFromUrl(searchParams);
  const dateRange = readDateRangeFromUrl(searchParams);
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [drawerRow, setDrawerRow] = useState<HistoryListRow | null>(null);
  const [showToolFilter, setShowToolFilter] = useState(false);

  const utils = trpc.useUtils();

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next);
  }

  function setView(v: ViewMode) {
    updateParams({ view: v });
  }

  function toggleTool(slug: ToolSlug) {
    const next = selectedTools.includes(slug)
      ? selectedTools.filter((s) => s !== slug)
      : [...selectedTools, slug];
    updateParams({ tools: next.length ? next.join(',') : null });
  }

  function setDateRange(d: DateRange) {
    const updates: Record<string, string | null> = { dateRange: d };
    if (d !== 'custom') {
      updates.dateFrom = null;
      updates.dateTo = null;
    }
    updateParams(updates);
  }

  const { data: rows, isLoading, error } = trpc.history.list.useQuery({
    tools: selectedTools.length ? selectedTools : undefined,
    dateRange,
    dateFrom: dateRange === 'custom' ? dateFrom || undefined : undefined,
    dateTo: dateRange === 'custom' ? dateTo || undefined : undefined,
    limit: 100,
    offset: 0,
  });

  const deleteMutation = trpc.history.delete.useMutation({
    onSuccess: () => {
      void utils.history.list.invalidate();
    },
  });

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync({ id });
    } finally {
      setDeletingId(null);
    }
  }

  function handleRestore(row: HistoryListRow) {
    const url = getToolRestoreUrl(row);
    if (url) navigate(url);
  }

  return (
    <main className="flex-1 container py-8 space-y-6" data-testid="history-page">
      {/* Header */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">工具历史</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">操作历史</h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          查看所有 AI 工具调用记录 · 一键恢复输入重跑
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div
          className="flex rounded-lg border border-border overflow-hidden"
          data-testid="view-toggle"
        >
          <Button
            variant={view === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none h-8 gap-1.5"
            onClick={() => setView('timeline')}
            data-testid="view-timeline-btn"
          >
            <List className="h-4 w-4" />
            时间线
          </Button>
          <Button
            variant={view === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none h-8 gap-1.5"
            onClick={() => setView('dashboard')}
            data-testid="view-dashboard-btn"
          >
            <LayoutDashboard className="h-4 w-4" />
            统计
          </Button>
        </div>

        {/* Date range */}
        <div className="flex rounded-lg border border-border overflow-hidden" data-testid="date-range-select">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={dateRange === opt.value ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none h-8"
              onClick={() => setDateRange(opt.value)}
              data-testid={`date-range-btn-${opt.value}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Custom date inputs */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2" data-testid="date-range-custom-inputs">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => updateParams({ dateFrom: e.target.value || null })}
              className="h-8 rounded-md border border-border bg-card px-2 text-body-sm text-on-surface"
              data-testid="date-range-from"
            />
            <span className="text-muted-foreground text-body-sm">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => updateParams({ dateTo: e.target.value || null })}
              className="h-8 rounded-md border border-border bg-card px-2 text-body-sm text-on-surface"
              data-testid="date-range-to"
            />
          </div>
        )}

        {/* Tool filter toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setShowToolFilter(!showToolFilter)}
          data-testid="tool-filter-toggle"
        >
          工具筛选
          {selectedTools.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
              {selectedTools.length}
            </span>
          )}
        </Button>
      </div>

      {/* Tool multi-select panel */}
      {showToolFilter && (
        <div
          className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface-variant/20 p-4"
          data-testid="tool-filter-multiselect"
        >
          {TOOL_DEFS.map((tool) => {
            const selected = selectedTools.includes(tool.slug);
            const Icon = tool.icon;
            return (
              <button
                key={tool.slug}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm font-label border transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary'
                }`}
                onClick={() => toggleTool(tool.slug)}
                data-testid={`tool-filter-chip-${tool.slug}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tool.label}
              </button>
            );
          })}
          {selectedTools.length > 0 && (
            <button
              className="text-label-sm font-label text-muted-foreground hover:text-destructive underline"
              onClick={() => updateParams({ tools: null })}
              data-testid="tool-filter-clear"
            >
              清空筛选
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {view === 'timeline' ? (
        <HistoryTimeline
          rows={rows ?? []}
          isLoading={isLoading}
          error={error}
          onViewDetail={setDrawerRow}
          onRestore={handleRestore}
          onDelete={(id) => void handleDelete(id)}
          deletingId={deletingId}
        />
      ) : (
        <HistoryDashboard
          dateRange={dateRange}
          tools={selectedTools}
          dateFrom={dateFrom || undefined}
          dateTo={dateTo || undefined}
        />
      )}

      {/* Detail Drawer */}
      <HistoryDetailDrawer row={drawerRow} onClose={() => setDrawerRow(null)} />
    </main>
  );
}
