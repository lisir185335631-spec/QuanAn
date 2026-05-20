/**
 * DailyTasks.tsx — PRD-25 US-003
 * /daily-tasks · 今日行动清单 · 接 trpc.dailyTasks 真实 LLM 数据
 * AC-1: getToday.useQuery(refetchInterval: null→3000ms poll)
 * AC-2: data.tasks.map(DailyTaskItem) → TaskCard 字段适配
 * AC-3: regenerateToday.useMutation + BullMQ 异步 → 轮询等待
 * AC-4: markCompleted.useMutation + optimistic UI + error rollback
 * AC-5: 无 active account → EmptyState + 添加账号 CTA
 * AC-6: 无今日任务且未轮询中 → EmptyState + 生成今日任务 button
 * AC-7: LS acc_*_daily_tasks_completed 离线兜底(getLsKey LD-009)
 * AC-8: isFallback=true → 灰色 banner
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
} from '@/lib/constants/daily-tasks';
import { getLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

import type { DailyTaskItem } from '@quanan/clients/router-types';

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onComplete,
  isPending,
}: {
  task: DailyTaskItem;
  onComplete: (taskId: string) => void;
  isPending?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div
      className={`bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-6 space-y-3 transition-opacity ${task.completed ? 'opacity-60' : ''}`}
      data-testid={`task-card-${task.id}`}
    >
      <div className="flex items-start gap-3">
        {task.completed && <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
        <h3 className="text-body-md font-display text-on-surface leading-snug">{task.title}</h3>
      </div>
      {task.description && (
        <p className="text-body-sm text-muted-foreground">{task.description}</p>
      )}
      <div className="flex gap-2 flex-wrap items-center">
        {task.estimatedMinutes > 0 && (
          <span className="text-xs text-muted-foreground/70">~{task.estimatedMinutes}分钟</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={task.completed ? 'outline' : 'default'}
          onClick={() => onComplete(task.id)}
          disabled={task.completed || isPending}
        >
          {task.completed ? '✓ 已打卡' : '完成打卡'}
        </Button>
        {task.ctaUrl && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(task.ctaUrl)}
          >
            {task.ctaText || '前往 →'}
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

  // AC-3: track if user triggered regenerate (waiting for BullMQ 8-30s)
  const [awaitingGeneration, setAwaitingGeneration] = useState(false);

  const utils = trpc.useUtils();

  // AC-1: poll getToday every 3s while data is null (waiting for BullMQ)
  const { data } = trpc.dailyTasks.getToday.useQuery(undefined, {
    enabled: !!accountId,
    refetchInterval: (query) => (query.state.data === null ? 3000 : false),
    refetchIntervalInBackground: false,
  });

  // Stop awaiting when data arrives
  useEffect(() => {
    if (data !== null && data !== undefined) {
      setAwaitingGeneration(false);
    }
  }, [data]);

  // AC-3: regenerate → BullMQ → poll until data arrives
  const regenerateMutation = trpc.dailyTasks.regenerateToday.useMutation({
    onMutate: () => {
      setAwaitingGeneration(true);
    },
    onSuccess: () => {
      void utils.dailyTasks.getToday.invalidate();
    },
    onError: () => {
      setAwaitingGeneration(false);
      toast.error('生成任务失败，请稍后再试');
    },
  });

  // AC-4: markCompleted with optimistic UI
  const markCompletedMutation = trpc.dailyTasks.markCompleted.useMutation({
    onMutate: async ({ taskId }) => {
      await utils.dailyTasks.getToday.cancel();
      const previous = utils.dailyTasks.getToday.getData();
      utils.dailyTasks.getToday.setData(undefined, (old) => {
        if (!old) return old;
        const updatedTasks = old.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: true } : t,
        );
        return { ...old, tasks: updatedTasks };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        utils.dailyTasks.getToday.setData(undefined, context.previous);
      }
      toast.error('打卡失败 · 请稍后再试');
    },
  });

  function handleComplete(task: DailyTaskItem) {
    if (!data || !accountId) return;
    // AC-7: LS 离线兜底(acc_ prefix LD-009)
    const lsKey = getLsKey(accountId, 'daily_tasks_completed');
    try {
      const existing = JSON.parse(localStorage.getItem(lsKey) ?? '[]') as string[];
      if (!existing.includes(task.id)) {
        localStorage.setItem(lsKey, JSON.stringify([...existing, task.id]));
      }
    } catch { /* ignore */ }
    markCompletedMutation.mutate({ dailyTaskId: data.id, taskId: task.id });
  }

  // data===undefined → initial fetch; data===null → no record today
  const isWaiting = data === undefined || (data === null && awaitingGeneration);
  const tasks = data !== null && data !== undefined ? (data.tasks as unknown as DailyTaskItem[]) : [];

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-2xl">
      {/* AC-1: header — always visible */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">智能</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">今日行动清单</h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          AI 根据你的账号状态每日生成 3-5 个行动建议，完成打卡积累进化经验
        </p>
      </div>

      {/* AC-5: no account */}
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
      ) : isWaiting ? (
        /* loading / waiting for BullMQ */
        <div className="flex flex-col items-center gap-4 py-16 text-center" data-testid="loading-state">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-body-md text-muted-foreground">{DAILY_TASKS_LOADING_TEXT}</p>
        </div>
      ) : data === null ? (
        /* AC-6: no tasks, not polling → generate CTA */
        <EmptyState
          title="AI 暂未生成今日任务"
          description="点击「生成」让 AI 为你制定今日行动计划"
          action={
            <Button
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</>
              ) : (
                '生成今日任务'
              )}
            </Button>
          }
        />
      ) : (
        /* AC-2: task cards */
        <>
          {/* AC-8: isFallback banner */}
          {data.isFallback && (
            <div
              className="text-sm text-muted-foreground bg-muted/50 rounded-md px-4 py-2 border border-border/30"
              data-testid="fallback-banner"
            >
              AI 暂未生成 · 显示规则建议
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-label-sm font-label text-on-surface-variant uppercase tracking-wide">
              今日任务 · {tasks.length} 项
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                data-testid="regenerate-button"
              >
                {regenerateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
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
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => handleComplete(task)}
                isPending={markCompletedMutation.isPending}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
