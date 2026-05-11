/**
 * PRD-8 US-008: /daily-tasks 页面
 * 今日任务 + 完成进度条 + 历史 7/30 天 · markCompleted optimistic update · regenerateToday polling
 */

import { CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

import type { DailyTaskHistoryRow, DailyTaskItem } from '@quanqn/clients/router-types';

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(date);
}

const DIFFICULTY_LABEL: Record<DailyTaskItem['difficulty'], string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const DIFFICULTY_COLOR: Record<DailyTaskItem['difficulty'], string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
};

// ── CompletionBar ─────────────────────────────────────────────────────────────

function CompletionBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-surface-variant overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-label-sm font-label text-on-surface-variant w-14 text-right shrink-0">
        {completed}/{total}
      </span>
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onComplete,
  disabled,
}: {
  task: DailyTaskItem;
  onComplete: (taskId: string) => void;
  disabled?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div
      className={`flex gap-3 p-4 rounded-lg border transition-opacity ${
        task.completed
          ? 'border-outline-variant/40 bg-surface-variant/20 opacity-60'
          : 'border-outline-variant bg-surface-variant/10'
      }`}
    >
      <button
        className="mt-0.5 shrink-0 disabled:cursor-not-allowed"
        onClick={() => !task.completed && onComplete(task.id)}
        disabled={disabled || task.completed}
        aria-label={task.completed ? '已完成' : '标记完成'}
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <Circle className="w-5 h-5 text-on-surface-variant hover:text-primary transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-body-md font-medium text-on-surface ${task.completed ? 'line-through' : ''}`}
          >
            {task.title}
          </span>
          <span className={`text-label-xs font-label shrink-0 ${DIFFICULTY_COLOR[task.difficulty]}`}>
            {DIFFICULTY_LABEL[task.difficulty]}
          </span>
          <span className="text-label-xs font-label text-muted-foreground shrink-0">
            {task.estimatedMinutes}min
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant mb-2">{task.description}</p>
        <button
          className="text-label-sm font-label text-primary hover:underline"
          onClick={() => navigate(task.ctaUrl)}
        >
          {task.ctaText} →
        </button>
      </div>
    </div>
  );
}

// ── TodaySection ──────────────────────────────────────────────────────────────

function TodaySection() {
  const utils = trpc.useUtils();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const regenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: today, refetch: refetchToday } = trpc.dailyTasks.getToday.useQuery(undefined, {
    refetchInterval: isRegenerating ? 3000 : false,
  });

  const markCompleted = trpc.dailyTasks.markCompleted.useMutation({
    onError: (_err, _variables, context) => {
      // rollback optimistic update
      if (context && 'previousToday' in (context as Record<string, unknown>)) {
        const ctx = context as { previousToday: typeof today };
        utils.dailyTasks.getToday.setData(undefined, ctx.previousToday);
      }
      toast.error('标记失败，请稍后再试');
    },
  });

  const regenerate = trpc.dailyTasks.regenerateToday.useMutation({
    onSuccess: () => {
      setIsRegenerating(true);
      regenTimerRef.current = setTimeout(() => setIsRegenerating(false), 30_000);
    },
    onError: () => {
      toast.error('任务重新生成失败，请稍后再试');
    },
  });

  // Stop polling once new tasks arrive
  useEffect(() => {
    if (isRegenerating && today && today.tasks.length > 0) {
      setIsRegenerating(false);
      if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
    }
  }, [isRegenerating, today]);

  useEffect(() => () => { if (regenTimerRef.current) clearTimeout(regenTimerRef.current); }, []);

  async function handleComplete(taskId: string) {
    if (!today) return;

    // Optimistic update
    const previousToday = utils.dailyTasks.getToday.getData();
    utils.dailyTasks.getToday.setData(undefined, {
      ...today,
      tasks: today.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t,
      ),
      completedCount: today.completedCount + 1,
    });

    try {
      await markCompleted.mutateAsync({ dailyTaskId: today.id, taskId });
      void refetchToday();
    } catch {
      // onError handles rollback
      utils.dailyTasks.getToday.setData(undefined, previousToday ?? null);
    }
  }

  if (!today) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6">
          {isRegenerating ? (
            <div className="flex items-center gap-3 py-4">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <p className="text-body-md text-on-surface-variant">正在生成今日任务…</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-body-md text-muted-foreground mb-4">今日任务尚未生成</p>
              <Button
                onClick={() => regenerate.mutate()}
                disabled={regenerate.isPending || isRegenerating}
                variant="outline"
                size="sm"
              >
                {regenerate.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                立即生成
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">
            今日任务 · {formatDate(today.taskDate)}
          </span>
          <Button
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending || isRegenerating}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-on-surface"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CompletionBar completed={today.completedCount} total={today.totalCount} />
      </CardHeader>
      <CardContent className="space-y-3">
        {isRegenerating && (
          <div className="flex items-center gap-2 text-body-sm text-muted-foreground py-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            正在重新生成…
          </div>
        )}
        {today.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={(taskId) => void handleComplete(taskId)}
            disabled={markCompleted.isPending || isRegenerating}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ── HistorySection ────────────────────────────────────────────────────────────

function HistorySection() {
  const [limit, setLimit] = useState<7 | 30>(7);
  const { data: history, isLoading } = trpc.dailyTasks.getHistory.useQuery(
    { limit, offset: 0 },
    { staleTime: 60_000 },
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wide">
          历史记录
        </p>
        <div className="flex gap-2">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setLimit(d)}
              className={`text-label-sm font-label px-2 py-1 rounded transition-colors ${
                limit === d
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-on-surface'
              }`}
            >
              {d} 天
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-body-sm text-muted-foreground py-2">加载中…</p>
      ) : !history || history.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-body-sm text-muted-foreground">暂无历史记录</p>
          </CardContent>
        </Card>
      ) : (
        (history as DailyTaskHistoryRow[]).map((row) => (
          <Card key={row.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-sm font-label text-on-surface-variant">
                  {formatDate(row.taskDate)}
                </span>
                <span className="text-body-sm text-on-surface">
                  {row.completedCount}/{row.totalCount} 完成
                </span>
              </div>
              <CompletionBar completed={row.completedCount} total={row.totalCount} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function DailyTasks() {
  return (
    <main className="flex-1 container py-8 space-y-6 max-w-2xl">
      <h1 className="text-h1 font-display text-on-surface">每日任务</h1>
      <TodaySection />
      <HistorySection />
    </main>
  );
}
