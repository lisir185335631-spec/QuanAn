/**
 * CopywritingHistory — 文案历史侧边栏 · PRD-15 US-002 AC-5
 * - 左侧 collapse 展开
 * - 最近 10 条生成记录
 * - 点击恢复 input + output state
 * - 走 trpc.history.list.useQuery({ agentId: 'CopywritingAgent', limit: 10 })
 */

import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

import { trpc } from '@/lib/trpc';
import type { Platform } from './CopywritingForm';
import type { CopywritingFormValues } from './CopywritingForm';

interface HistoryEntry {
  id: number;
  inputSummary?: string | null;
  content?: string | null;
  scriptType?: string | null;
  elements?: string[] | null;
  createdAt: Date | string;
}

interface CopywritingHistoryProps {
  isOpen: boolean;
  onToggle: () => void;
  onRestore: (values: Partial<CopywritingFormValues>, content: string) => void;
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

export function CopywritingHistory({ isOpen, onToggle, onRestore }: CopywritingHistoryProps) {
  const { data: historyItems = [], isLoading } = trpc.history.list.useQuery(
    { agentId: 'CopywritingAgent', limit: 10, offset: 0 },
    { staleTime: 30_000 },
  );

  function handleRestore(item: HistoryEntry) {
    const partial: Partial<CopywritingFormValues> = {
      scriptType: item.scriptType ?? '',
      elements: item.elements ?? [],
      topic: item.inputSummary ?? '',
    };
    onRestore(partial, item.content ?? '');
  }

  return (
    <div
      className={`relative flex flex-col border-r border-border transition-all duration-200 ${
        isOpen ? 'w-60' : 'w-9'
      }`}
      data-testid="copywriting-history"
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-container text-muted-foreground hover:text-on-surface transition-colors"
        aria-label={isOpen ? '折叠历史' : '展开历史'}
        data-testid="history-toggle-btn"
      >
        {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {isOpen && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-3 border-b border-border">
            <Clock size={13} className="text-muted-foreground" />
            <span className="text-body-xs font-medium text-on-surface-variant">历史记录</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <span className="text-body-xs text-muted-foreground">加载中…</span>
              </div>
            )}
            {!isLoading && historyItems.length === 0 && (
              <div className="flex items-center justify-center py-6 px-3">
                <span className="text-body-xs text-muted-foreground text-center">暂无历史记录</span>
              </div>
            )}
            {!isLoading &&
              (historyItems as unknown as HistoryEntry[]).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRestore(item)}
                  className="w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-surface-container transition-colors"
                  data-testid={`history-item-${item.id}`}
                >
                  <p className="text-body-xs text-on-surface line-clamp-2 mb-0.5">
                    {item.inputSummary ?? '（无摘要）'}
                  </p>
                  <p className="text-body-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="flex flex-col items-center pt-10 gap-3">
          <Clock size={14} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export type { Platform };
