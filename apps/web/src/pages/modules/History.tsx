/**
 * History.tsx — /history 模块页 · PRD-5 US-011 · PRD-6 US-013
 * 真表格: list query(agentMode filter + dateRange filter) + Table + 点行跳转工具页 ?historyId=N
 * 操作列: delete mutation → 刷新 list
 * agentMode → toolPath: free→generate / boom→boom-generate / structural→analysis / viral→video-analysis
 * US-013: production→video-production / acquisition(VideoAgent)→acquisition-video /
 *         storyboard→ai-video / acquisition(CopywritingAgent)→generate?mode=acquisition
 */

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

import type { HistoryListRow } from '@quanqn/clients/router-types';

// ── Constants ─────────────────────────────────────────────────────────────────

// US-013: added production / acquisition / storyboard
type AgentModeFilter = 'all' | 'free' | 'boom' | 'structural' | 'viral' | 'production' | 'acquisition' | 'storyboard';
type DateRangeFilter = 'all' | 'last_7d' | 'last_30d';

const MODE_OPTIONS: { value: AgentModeFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'free', label: 'Generate' },
  { value: 'boom', label: 'Boom' },
  { value: 'structural', label: 'Analysis' },
  { value: 'viral', label: 'VideoAnalysis' },
  { value: 'production', label: '视频制作' },
  { value: 'acquisition', label: '获客' },
  { value: 'storyboard', label: 'AI 视频' },
];

const DATE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: '全部时间' },
  { value: 'last_7d', label: '最近 7 天' },
  { value: 'last_30d', label: '最近 30 天' },
];

// 'acquisition' handled separately in handleRowClick (agentId disambiguates video vs copy)
const TOOL_PATH = {
  free: 'generate',
  boom: 'boom-generate',
  structural: 'analysis',
  viral: 'video-analysis',
  production: 'video-production',
  storyboard: 'ai-video',
} as const satisfies Record<string, string>;

const MODE_LABEL = {
  free: 'Generate',
  boom: 'Boom',
  structural: 'Analysis',
  viral: 'VideoAnalysis',
  production: '视频制作',
  storyboard: 'AI 视频',
} as const satisfies Record<string, string>;

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// ── ModeBadge ─────────────────────────────────────────────────────────────────

function ModeBadge({ agentId, agentMode }: { agentId: string; agentMode: string | null }) {
  // US-013: 'acquisition' agentMode is shared between VideoAgent and CopywritingAgent
  const modeText =
    agentMode === 'acquisition'
      ? agentId === 'VideoAgent' ? '获客视频' : '获客文案'
      : agentMode && agentMode in MODE_LABEL
        ? MODE_LABEL[agentMode as keyof typeof MODE_LABEL]
        : (agentMode ?? agentId);

  const colorClass =
    agentMode === 'production'
      ? 'bg-blue-500/10 text-blue-600'
      : agentMode === 'acquisition' && agentId === 'VideoAgent'
        ? 'bg-red-500/10 text-red-600'
        : agentMode === 'storyboard'
          ? 'bg-violet-500/10 text-violet-600'
          : agentMode === 'acquisition'
            ? 'bg-green-500/10 text-green-600' // CopywritingAgent acquisition
            : agentMode === 'free'
              ? 'bg-primary/10 text-primary'
              : agentMode === 'boom'
                ? 'bg-amber-500/10 text-amber-600'
                : agentMode === 'structural'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : agentMode === 'viral'
                    ? 'bg-purple-500/10 text-purple-600'
                    : 'bg-muted text-muted-foreground';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
      data-testid={`history-mode-badge-${agentMode ?? 'unknown'}`}
    >
      {modeText}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function History() {
  const navigate = useNavigate();
  const [modeFilter, setModeFilter] = useState<AgentModeFilter>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const listInput = {
    ...(modeFilter !== 'all' ? { agentMode: modeFilter } : {}),
    dateRange: dateRange as 'last_7d' | 'last_30d' | 'all',
    limit: 50,
    offset: 0,
  };

  const { data: rows, isLoading, error } = trpc.history.list.useQuery(listInput);

  const deleteMutation = trpc.history.delete.useMutation({
    onSuccess: () => {
      void utils.history.list.invalidate();
    },
  });

  function handleRowClick(row: HistoryListRow) {
    const mode = row.agentMode ?? '';

    // US-013 AC-5: acquisition needs agentId disambiguation
    if (mode === 'acquisition') {
      if (row.agentId === 'VideoAgent') {
        navigate(`/acquisition-video?historyId=${row.id}`);
      } else {
        navigate(`/generate?historyId=${row.id}&mode=acquisition`);
      }
      return;
    }

    if (!(mode in TOOL_PATH)) return;
    const toolPath = TOOL_PATH[mode as keyof typeof TOOL_PATH];
    navigate(`/${toolPath}?historyId=${row.id}`);
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync({ id });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="flex-1 container py-8 space-y-6" data-testid="history-page">
      {/* Header */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">工具记录</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">历史记录</h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          查看所有 AI 工具生成记录，点击行跳转预填
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3" data-testid="history-filters">
        <Select
          value={modeFilter}
          onValueChange={(v) => setModeFilter(v as AgentModeFilter)}
        >
          <SelectTrigger className="w-40" data-testid="history-filter-mode">
            <SelectValue placeholder="工具类型" />
          </SelectTrigger>
          <SelectContent>
            {MODE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={dateRange}
          onValueChange={(v) => setDateRange(v as DateRangeFilter)}
        >
          <SelectTrigger className="w-40" data-testid="history-filter-date">
            <SelectValue placeholder="时间范围" />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-body-md text-muted-foreground">加载中…</p>
      ) : error ? (
        <p className="text-body-md text-destructive">加载失败，请刷新重试</p>
      ) : !rows || rows.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-body-md text-muted-foreground">
          暂无历史记录
        </div>
      ) : (
        <div
          className="rounded-lg border border-border overflow-hidden"
          data-testid="history-table"
        >
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-28">时间</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">Agent</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">输入摘要</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">内容预览</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleRowClick(row)}
                  data-testid={`history-row-${row.id}`}
                >
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ModeBadge agentId={row.agentId} agentMode={row.agentMode} />
                  </td>
                  <td className="px-4 py-3 text-on-surface max-w-xs truncate">
                    {row.inputSummary}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {row.content.substring(0, 80)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => void handleDelete(e, row.id)}
                      disabled={deletingId === row.id}
                      data-testid={`history-delete-${row.id}`}
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
