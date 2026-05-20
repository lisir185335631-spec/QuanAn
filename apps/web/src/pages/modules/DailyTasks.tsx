/**
 * DailyTasks.tsx — PRD-24 US-001
 * /daily-tasks · 今日行动清单 · stub 3 任务卡 + loading + EmptyState
 * AC-1: H1 '今日行动清单' + 副标 + '智能' 菜单分类标识
 * AC-3: 3 H3 任务卡 (glass-card) + 完成打卡 button + 前往 button
 * AC-4: useActiveAccount → null → EmptyState + 添加账号 CTA
 * AC-5: stub 800ms loading → Loader2 spinner + DAILY_TASKS_LOADING_TEXT
 * AC-6: getLsKey(accountId, 'daily_tasks_completed') → localStorage
 * PRD-25+: 接 LLM 时替换 isLoading stub 为 trpc.dailyTasks.list.useQuery()
 */
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { EmptyState } from '@/components/states/EmptyState';
import { Button } from '@/components/ui/button';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  DAILY_TASKS_EMPTY_CTA,
  DAILY_TASKS_EMPTY_DESC,
  DAILY_TASKS_EMPTY_TITLE,
  DAILY_TASKS_LOADING_TEXT,
  DAILY_TASKS_STUB,
} from '@/lib/constants/daily-tasks';
import { getLsKey } from '@/lib/ls-namespace';

import type { DailyTask } from '@/lib/constants/daily-tasks';

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  isCompleted,
  onComplete,
}: {
  task: DailyTask;
  isCompleted: boolean;
  onComplete: (id: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      className={`bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-6 space-y-3 transition-opacity ${isCompleted ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        {isCompleted && <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
        <h3 className="text-body-md font-display text-on-surface leading-snug">{task.title}</h3>
      </div>
      <p className="text-body-sm text-muted-foreground">{task.hint}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={isCompleted ? 'outline' : 'default'}
          onClick={() => onComplete(task.id)}
          disabled={isCompleted}
        >
          {isCompleted ? '✓ 已打卡' : '完成打卡'}
        </Button>
        {task.link && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(task.link!)}
          >
            前往 →
          </Button>
        )}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function DailyTasks() {
  const { account } = useActiveAccount();
  const navigate = useNavigate();
  const accountId = account?.id ?? null;

  // PRD-25+: replace with trpc.dailyTasks.list.useQuery()
  const [isLoading, setIsLoading] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (accountId === null) {
      setIsLoading(false);
      return;
    }
    const key = getLsKey(accountId, 'daily_tasks_completed');
    try {
      setCompleted(JSON.parse(localStorage.getItem(key) ?? '[]') as string[]);
    } catch { /* ignore malformed JSON */ }
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleComplete(taskId: string) {
    if (!accountId) return;
    const next = [...completed, taskId];
    setCompleted(next);
    localStorage.setItem(getLsKey(accountId, 'daily_tasks_completed'), JSON.stringify(next));
    toast.success('打卡功能 PRD-25+');
  }

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-2xl">
      {/* AC-1: header */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">智能</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">今日行动清单</h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          AI 根据你的账号状态每日生成 3-5 个行动建议，完成打卡积累进化经验
        </p>
      </div>

      {/* AC-4: no account → EmptyState */}
      {!account ? (
        <EmptyState
          title={DAILY_TASKS_EMPTY_TITLE}
          description={DAILY_TASKS_EMPTY_DESC}
          action={
            <Button onClick={() => navigate('/accounts')}>
              {DAILY_TASKS_EMPTY_CTA}
            </Button>
          }
        />
      ) : isLoading ? (
        /* AC-5: loading state */
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-body-md text-muted-foreground">{DAILY_TASKS_LOADING_TEXT}</p>
        </div>
      ) : (
        /* AC-3: task cards */
        <>
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-label text-on-surface-variant uppercase tracking-wide">
              今日任务 · {DAILY_TASKS_STUB.length} 项
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 800);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                重新生成
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => navigate('/evolution')}
              >
                查看进化
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {DAILY_TASKS_STUB.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isCompleted={completed.includes(task.id)}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
