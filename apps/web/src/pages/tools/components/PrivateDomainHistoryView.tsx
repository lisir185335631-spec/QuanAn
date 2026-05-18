/**
 * PrivateDomainHistoryView — ui/_14 设计稿 · 历史回看 · PRD-15 US-005
 * AC-5: DenseTable 列历史记录 · 点击恢复 View 1-3 状态
 */

import { Clock, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

import type { PhaseData } from './PhaseCard';

interface HistoryEntry {
  id: number;
  inputSummary: string | null;
  content: string | null;
  createdAt: Date | string;
}

interface PrivateDomainHistoryViewProps {
  onRestore: (phases: PhaseData[], summary: string, inputSummary: string) => void;
}

function formatDate(d: Date | string): string {
  const now = new Date();
  const diff = now.getTime() - new Date(d).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function parseContent(content: string | null): { phases: PhaseData[]; summary: string } | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as { phases?: PhaseData[]; summary?: string };
    if (parsed.phases && Array.isArray(parsed.phases)) {
      return { phases: parsed.phases, summary: parsed.summary ?? '' };
    }
  } catch {
    // invalid JSON
  }
  return null;
}

export function PrivateDomainHistoryView({ onRestore }: PrivateDomainHistoryViewProps) {
  const { data: historyItems = [], isLoading, refetch } = trpc.history.list.useQuery(
    { agentId: 'PrivateDomainAgent', limit: 20, offset: 0 },
    { staleTime: 30_000 },
  );

  const rows = historyItems as HistoryEntry[];

  function handleRestore(row: HistoryEntry) {
    const parsed = parseContent(row.content);
    if (!parsed) return;
    onRestore(parsed.phases, parsed.summary, row.inputSummary ?? '');
  }

  return (
    <div className="space-y-4" data-testid="private-domain-history-view">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-label-sm text-muted-foreground uppercase tracking-wide">历史记录</p>
          <p className="text-body-sm text-on-surface-variant mt-0.5">点击记录恢复之前的 SOP 方案</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refetch()}
          data-testid="history-refresh-btn"
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          刷新
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-body-sm text-muted-foreground" data-testid="history-loading">
          加载中…
        </div>
      ) : rows.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border p-8 text-center"
          data-testid="history-empty"
        >
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-body-sm text-muted-foreground">暂无历史记录</p>
          <p className="text-body-xs text-muted-foreground mt-1">
            生成第一份私域 SOP 后，记录将出现在这里
          </p>
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">产品描述</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleRestore(row)}
                  data-testid={`history-row-${row.id}`}
                >
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-on-surface max-w-xs truncate">
                    {row.inputSummary ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-primary text-label-sm"
                      onClick={(e) => { e.stopPropagation(); handleRestore(row); }}
                      data-testid={`restore-btn-${row.id}`}
                    >
                      恢复
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
