/**
 * /daily-tasks · 今日行动清单 · 先锋白·工业精密版
 * 阶段2: 接真 trpc.dailyTasks.* · 三态(loading/error/null空态) · 乐观完成
 * PioneerLayout · 内联软卡 · 品牌三主色
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import {
  DAILY_TASKS_FOOTER_BTN_1,
  DAILY_TASKS_FOOTER_BTN_1_HREF,
  DAILY_TASKS_FOOTER_BTN_2,
  DAILY_TASKS_FOOTER_BTN_2_HREF,
  DAILY_TASKS_H1,
  DAILY_TASKS_MOCK,
  DAILY_TASKS_PROGRESS_COMPLETED,
  DAILY_TASKS_PROGRESS_TOTAL,
  DAILY_TASKS_STATS,
  DAILY_TASKS_SUBTITLE,
  PRIORITY_LABELS,
} from '@/lib/constants/daily-tasks';
import type { TaskCategory, TaskMockItem, TaskPriority } from '@/lib/constants/daily-tasks';
import { trpc } from '@/lib/trpc';

// ── Backend task shape ────────────────────────────────────────────────────────
interface BackendTask {
  id: string;
  type: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;
  ctaText?: string;
  ctaUrl?: string;
  completed: boolean;
  expectedOutcome?: string;
}

// ── Runtime guard: safely cast a raw value to BackendTask ────────────────────
function toBackendTask(raw: unknown): BackendTask {
  const t = (raw ?? {}) as Record<string, unknown>;
  const difficulty = t['difficulty'];
  return {
    id: typeof t['id'] === 'string' ? t['id'] : '',
    type: typeof t['type'] === 'string' ? t['type'] : 'knowledge',
    title: typeof t['title'] === 'string' ? t['title'] : '(无标题)',
    description: typeof t['description'] === 'string' ? t['description'] : undefined,
    difficulty:
      difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard'
        ? difficulty
        : 'medium',
    estimatedMinutes:
      typeof t['estimatedMinutes'] === 'number' ? t['estimatedMinutes'] : undefined,
    ctaText: typeof t['ctaText'] === 'string' ? t['ctaText'] : undefined,
    ctaUrl: typeof t['ctaUrl'] === 'string' ? t['ctaUrl'] : undefined,
    completed: typeof t['completed'] === 'boolean' ? t['completed'] : false,
    expectedOutcome:
      typeof t['expectedOutcome'] === 'string' ? t['expectedOutcome'] : undefined,
  };
}

// ── Type→Category map ─────────────────────────────────────────────────────────
const TYPE_TO_CATEGORY: Record<string, TaskCategory> = {
  copywriting: '内容创作',
  analysis: '账号优化',
  diagnosis: '账号优化',
  trending: '学习研究',
  knowledge: '学习研究',
};

function typeToCategory(type: string): TaskCategory {
  return TYPE_TO_CATEGORY[type] ?? '学习研究';
}

function difficultyToPriority(difficulty: 'easy' | 'medium' | 'hard'): TaskPriority {
  if (difficulty === 'hard') return 'high';
  if (difficulty === 'medium') return 'medium';
  return 'low';
}

// ── Unified date-key extractor (both sides must use the same function) ────────
// Always use UTC date part so client TZ never shifts which day we're on.
// Both today and history taskDate go through this → no TZ skew.
function toDateKey(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().slice(0, 10); // "YYYY-MM-DD" in UTC
}

// ── Icon metadata · order locked: streak / total-days / total-tasks ──────────
const STAT_ICON_META: Array<{
  icon: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  badge: string;
  badgeText: string;
}> = [
  // streak · 暖黄火焰
  {
    icon: 'local_fire_department',
    iconBg: 'bg-[#F6D300]/20',
    iconColor: 'text-[#8A6A00]',
    valueColor: 'text-[#8A6A00]',
    badge: 'bg-[#F6D300]/20',
    badgeText: 'text-[#8A6A00]',
  },
  // total-days · 蓝奖杯
  {
    icon: 'emoji_events',
    iconBg: 'bg-[#002fa7]/10',
    iconColor: 'text-[#002fa7]',
    valueColor: 'text-[#002fa7]',
    badge: 'bg-[#002fa7]/10',
    badgeText: 'text-[#002fa7]',
  },
  // total-tasks · 绿完成
  {
    icon: 'task_alt',
    iconBg: 'bg-[#10b981]/10',
    iconColor: 'text-[#10b981]',
    valueColor: 'text-[#10b981]',
    badge: 'bg-[#10b981]/10',
    badgeText: 'text-[#10b981]',
  },
];

// ── Priority styles · 先锋白品牌色 ──────────────────────────────────────────
const PRIORITY_STYLE: Record<TaskPriority, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-[#781621]/10', text: 'text-[#781621]', dot: 'bg-[#781621]' },
  medium: { bg: 'bg-[#002fa7]/10', text: 'text-[#002fa7]', dot: 'bg-[#002fa7]' },
  low: { bg: 'bg-[#f1f3f9]', text: 'text-[#6b7280]', dot: 'bg-[#6b7280]' },
};

// ── Category icon · Material Symbols ─────────────────────────────────────────
const CATEGORY_ICON: Record<TaskCategory, string> = {
  学习研究: 'menu_book',
  内容创作: 'edit_note',
  账号优化: 'manage_accounts',
};

const CATEGORY_STYLE: Record<TaskCategory, { bg: string; text: string }> = {
  学习研究: { bg: 'bg-[#002fa7]/10', text: 'text-[#002fa7]' },
  内容创作: { bg: 'bg-[#781621]/10', text: 'text-[#781621]' },
  账号优化: { bg: 'bg-[#F6D300]/20', text: 'text-[#8A6A00]' },
};

// ── Inline pioneer-white soft components ─────────────────────────────────────

function ChipHeader() {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
        智能引擎
      </span>
      <span
        data-testid="daily-tasks-chip"
        className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]"
      >
        每日任务
      </span>
    </div>
  );
}


function ProgressRing({ pct }: { pct: number }) {
  const dash = ((pct / 100) * 100).toFixed(1);
  return (
    <svg
      viewBox="0 0 36 36"
      className="-rotate-90 h-12 w-12 shrink-0"
      role="img"
      aria-label={`今日完成率 ${pct}%`}
    >
      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
      <circle
        cx="18"
        cy="18"
        r="15.915"
        fill="none"
        stroke="#002fa7"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} 100`}
      />
    </svg>
  );
}

function TodayProgressSection({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  // P5: clamp to 100 to prevent SVG overflow on inconsistent data
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  return (
    <div
      data-testid="today-progress-card"
      className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-6 pw-shadow-soft"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002fa7]/10 text-[#002fa7]">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">today</span>
          </span>
          <div>
            <h3 className="text-[16px] font-bold text-[#111827]">今日进度</h3>
            <p className="text-[12px] text-[#9ca3af]">完成 {completed} / {total} 项任务</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[28px] font-bold text-[#002fa7]">{pct}%</span>
          <ProgressRing pct={pct} />
        </div>
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#eef2ff]">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-[#002fa7] to-[#3654c8] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// P10: removed unused dailyTaskId prop
interface TaskRowProps {
  task: BackendTask;
  onComplete: (taskId: string) => void;
  // P8: markingIds is a Set to track multiple concurrent pending tasks
  markingIds: Set<string>;
}

function TaskRow({ task, onComplete, markingIds }: TaskRowProps) {
  const priority = difficultyToPriority(task.difficulty);
  const category = typeToCategory(task.type);
  const pri = PRIORITY_STYLE[priority];
  const cat = CATEGORY_STYLE[category];
  const catIcon = CATEGORY_ICON[category];
  const isCompleted = task.completed;
  // P8: check per-task pending state from the Set
  const isMarking = markingIds.has(task.id);

  return (
    <div
      data-testid={`task-card-${task.id}`}
      className={`rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md${isCompleted ? ' opacity-70' : ''}`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          disabled={isCompleted || isMarking}
          onClick={() => { if (!isCompleted && !isMarking) onComplete(task.id); }}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={isCompleted ? '已完成' : '标记完成'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isCompleted ? 'check_circle' : isMarking ? 'hourglass_empty' : 'radio_button_unchecked'}
          </span>
        </button>
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className={`text-[16px] font-bold leading-snug${isCompleted ? ' line-through text-[#9ca3af]' : ' text-[#111827]'}`}>{task.title}</h3>
            {/* Priority chip */}
            <span
              data-testid="task-priority-tag"
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${pri.bg} ${pri.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${pri.dot}`} />
              {PRIORITY_LABELS[priority]}优先
            </span>
            {/* Category chip */}
            <span
              data-testid="task-category-tag"
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.bg} ${cat.text}`}
            >
              <span className="material-symbols-outlined text-[12px]" aria-hidden="true">{catIcon}</span>
              {category}
            </span>
            {/* estimatedMinutes badge */}
            {task.estimatedMinutes !== null && task.estimatedMinutes !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f9] px-2 py-0.5 text-[11px] text-[#6b7280]">
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">schedule</span>
                {task.estimatedMinutes} 分钟
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-[14px] leading-relaxed text-[#444653]">{task.description}</p>
          )}
          {task.ctaUrl && !isCompleted && (
            <a
              href={task.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#002fa7] hover:underline"
            >
              {task.ctaText ?? '去完成'}
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">open_in_new</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock-derived TaskRow for fallback/empty display (keeps structure identical)
function MockTaskRow({ task }: { task: TaskMockItem }) {
  const pri = PRIORITY_STYLE[task.priority];
  const cat = CATEGORY_STYLE[task.category];
  const catIcon = CATEGORY_ICON[task.category];
  return (
    <div
      data-testid={`task-card-${task.id}`}
      className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[18px]">radio_button_unchecked</span>
        </span>
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-bold text-[#111827] leading-snug">{task.title}</h3>
            {/* Priority chip */}
            <span
              data-testid="task-priority-tag"
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${pri.bg} ${pri.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${pri.dot}`} />
              {PRIORITY_LABELS[task.priority]}优先
            </span>
            {/* Category chip */}
            <span
              data-testid="task-category-tag"
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.bg} ${cat.text}`}
            >
              <span className="material-symbols-outlined text-[12px]" aria-hidden="true">{catIcon}</span>
              {task.category}
            </span>
          </div>
          <p className="text-[14px] leading-relaxed text-[#444653]">{task.desc}</p>
        </div>
      </div>
    </div>
  );
}

function FooterButtons({
  onIPDiagnosis,
  onContinue,
}: {
  onIPDiagnosis: () => void;
  onContinue: () => void;
}) {
  return (
    <div
      data-testid="daily-tasks-footer"
      className="flex flex-wrap items-center justify-center gap-4 py-4"
    >
      <button
        type="button"
        onClick={onIPDiagnosis}
        data-testid="footer-btn-diagnosis"
        className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-6 py-3 text-[13px] font-bold text-[#1b1b1b] transition-all hover:border-[#002fa7] hover:bg-[#f3f6ff]"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">stethoscope</span>
        {DAILY_TASKS_FOOTER_BTN_1}
      </button>
      <button
        type="button"
        onClick={onContinue}
        data-testid="footer-btn-continue"
        className="inline-flex items-center gap-2 rounded-xl bg-[#002fa7] px-6 py-3 text-[13px] font-bold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        {DAILY_TASKS_FOOTER_BTN_2}
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
      </button>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="h-24 animate-pulse rounded-xl border border-[#e5e7eb] bg-[#f3f6ff]" />
  );
}

// ── Stats calculator from history ────────────────────────────────────────────
interface HistoryRow {
  taskDate: Date | string;
  completedCount: number;
  totalCount: number;
}

function calcStats(history: HistoryRow[]): { streak: number; totalDays: number; totalTasks: number } {
  // P7: totalDays = days with at least one completed task (not just any record)
  const totalDays = history.filter((r) => r.completedCount > 0).length;
  const totalTasks = history.reduce((s, r) => s + r.completedCount, 0);

  // P6: streak — use toDateKey() (UTC-based) for both today and history entries
  //     so that local TZ never shifts the day boundary.
  const sorted = [...history].sort((a, b) => {
    const da = new Date(a.taskDate).getTime();
    const db = new Date(b.taskDate).getTime();
    return db - da; // desc (newest first)
  });

  let streak = 0;
  const now = new Date();
  // Today's UTC date key — both sides use the same extraction
  const todayKey = toDateKey(now);

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i]!;
    const rowKey = toDateKey(row.taskDate);

    // Build expected date key: today - i days (in UTC)
    const expected = new Date(now);
    expected.setUTCDate(expected.getUTCDate() - i);
    const expectedKey = toDateKey(expected);

    if (rowKey === expectedKey || (i === 0 && rowKey === todayKey)) {
      streak++;
    } else {
      break;
    }
  }

  return { streak, totalDays, totalTasks };
}

// ── Main page component ───────────────────────────────────────────────────────

export default function DailyTasks() {
  const navigate = useNavigate();

  // ── optimistic completed set ──────────────────────────────────────────────
  const [optimisticCompleted, setOptimisticCompleted] = useState<Set<string>>(new Set());
  // P8: track multiple concurrent pending task ids with a Set
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  // ── tRPC queries ──────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const { data: todayRecord, isLoading, isError, refetch } = trpc.dailyTasks.getToday.useQuery();
  // P2: destructure isError/isLoading from getHistory
  const { data: history = [], isError: isHistoryError, isLoading: isHistoryLoading } =
    trpc.dailyTasks.getHistory.useQuery({ limit: 30 });

  // ── mark completed mutation ───────────────────────────────────────────────
  const markCompleted = trpc.dailyTasks.markCompleted.useMutation({
    onMutate: ({ taskId }) => {
      // P8: add to Set instead of single value
      setMarkingIds((prev) => new Set([...prev, taskId]));
      // optimistic
      setOptimisticCompleted((prev) => new Set([...prev, taskId]));
    },
    onSuccess: async () => {
      await utils.dailyTasks.getToday.invalidate();
    },
    onSettled: (_data, _err, { taskId }) => {
      // P8: always remove from pending set when done (success or error)
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    },
    onError: (_err, { taskId }) => {
      // rollback optimistic
      setOptimisticCompleted((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      toast.error('标记失败，请重试');
    },
  });

  // ── regenerate mutation ───────────────────────────────────────────────────
  // P9: success toast includes a "刷新" action that re-fetches today's tasks
  const regenerateToday = trpc.dailyTasks.regenerateToday.useMutation({
    onSuccess: () => {
      toast.success('已加入生成队列，稍后刷新查看', {
        action: {
          label: '刷新',
          onClick: () => { void refetch(); },
        },
      });
    },
    onError: () => {
      toast.error('重新生成失败，请稍后再试');
    },
  });

  // ── derived stats from history ────────────────────────────────────────────
  const stats = calcStats(history);
  // P2: show "—" when history failed to load; show skeleton placeholder when loading
  const statValue = (v: number): string | number => {
    if (isHistoryError) return '—';
    if (isHistoryLoading) return '…';
    return v;
  };
  const liveStats = [
    { id: 'streak', value: statValue(stats.streak), label: DAILY_TASKS_STATS[0]!.label },
    { id: 'total-days', value: statValue(stats.totalDays), label: DAILY_TASKS_STATS[1]!.label },
    { id: 'total-tasks', value: statValue(stats.totalTasks), label: DAILY_TASKS_STATS[2]!.label },
  ];

  // ── today progress derived from record ───────────────────────────────────
  // P4: runtime guard — ensure tasks is always a valid array before mapping
  const rawTasks = Array.isArray(todayRecord?.tasks) ? (todayRecord.tasks as unknown[]) : [];
  const tasks: BackendTask[] = rawTasks.map((raw) => {
    const safe = toBackendTask(raw);
    return {
      ...safe,
      completed: safe.completed || optimisticCompleted.has(safe.id),
    };
  });

  const completedCount = todayRecord
    ? tasks.filter((t) => t.completed).length
    : DAILY_TASKS_PROGRESS_COMPLETED;
  const totalCount = todayRecord ? todayRecord.totalCount : DAILY_TASKS_PROGRESS_TOTAL;

  // P5: clamp to 100
  const todayPct = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  // ── trend data for chart ──────────────────────────────────────────────────
  const recent7 = [...history]
    .sort((a, b) => new Date(a.taskDate).getTime() - new Date(b.taskDate).getTime())
    .slice(-7);
  const hasHistoryData = recent7.length > 0;
  const trendData = hasHistoryData
    ? recent7.map((r) => r.completedCount)
    : [2, 3, 4, 2, 3, 4, totalCount]; // fallback decorative

  // P11: x-axis labels derived from actual trendData length
  const xAxisLabels = (() => {
    const all = ['周一', '周二', '周三', '周四', '周五', '周六', '今日'];
    if (trendData.length >= 7) return all;
    // For fewer points, show the last N labels; always end with '今日'
    return all.slice(7 - trendData.length);
  })();

  function handleComplete(taskId: string) {
    if (!todayRecord) return;
    markCompleted.mutate({ dailyTaskId: todayRecord.id, taskId });
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PioneerLayout>
        <header className="mb-12">
          <ChipHeader />
          <h1 data-testid="daily-tasks-loading" className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {DAILY_TASKS_H1}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {DAILY_TASKS_SUBTITLE}
          </p>
        </header>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PioneerLayout>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <PioneerLayout>
        <header className="mb-12">
          <ChipHeader />
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {DAILY_TASKS_H1}
          </h1>
        </header>
        <div data-testid="daily-tasks-error" className="flex flex-col items-center gap-4 rounded-xl border border-[#fecaca] bg-[#fff5f5] p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#ef4444]">error_outline</span>
          <p className="text-[16px] font-semibold text-[#111827]">加载今日任务失败</p>
          <button
            type="button"
            data-testid="daily-tasks-retry"
            onClick={() => void refetch()}
            className="rounded-xl bg-[#002fa7] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#001f7a]"
          >
            重试
          </button>
        </div>
      </PioneerLayout>
    );
  }

  // ── Empty state (getToday null) ───────────────────────────────────────────
  if (!todayRecord) {
    return (
      <PioneerLayout>
        <header className="mb-12">
          <ChipHeader />
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {DAILY_TASKS_H1}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {DAILY_TASKS_SUBTITLE}
          </p>
        </header>
        <div data-testid="daily-tasks-empty" className="flex flex-col items-center gap-4 rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#002fa7]">inbox</span>
          <p className="text-[18px] font-bold text-[#111827]">今日暂无任务</p>
          <p className="text-[14px] text-[#6b7280]">AI 正在为你规划今日行动清单，或点击下方手动生成</p>
          <button
            type="button"
            data-testid="daily-tasks-regenerate"
            disabled={regenerateToday.isPending}
            onClick={() => regenerateToday.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#002fa7] px-7 py-3 text-[14px] font-bold text-white disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
            {regenerateToday.isPending ? '生成中…' : '重新生成'}
          </button>
        </div>
        <FooterButtons
          onIPDiagnosis={() => navigate(DAILY_TASKS_FOOTER_BTN_1_HREF)}
          onContinue={() => navigate(DAILY_TASKS_FOOTER_BTN_2_HREF)}
        />
      </PioneerLayout>
    );
  }

  // ── Normal render (todayRecord present) ──────────────────────────────────
  return (
    <PioneerLayout>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="mb-12">
        <ChipHeader />
        <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
          {DAILY_TASKS_H1}
        </h1>
        <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
          {DAILY_TASKS_SUBTITLE}
        </p>
        {/* isFallback warning */}
        {todayRecord.isFallback && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-4 py-2 text-[13px] text-[#92400e]">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">warning</span>
            当前为降级数据，AI 任务生成中，稍后刷新查看最新内容
          </div>
        )}
      </header>

      {/* ── 数据洞察 band ────────────────────────────────────────────────────── */}
      {/* P1: removed "历史数据综合评估" wording → "参考基准 · 示例"; deleted "模型已就绪" badge */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">执行力数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· 参考基准 · 示例</span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 执行力雷达 · 六维 · 装饰 · P1: label改参考基准示例 · P12: aria-hidden */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">执行力雷达</h3>
                {/* P1: clarified as reference/example, not real personalised data */}
                <p className="text-[11px] text-[#9ca3af]">六维参考示例</p>
              </div>
            </div>
            <div className="text-right">
              {/* P1: clarified as reference score */}
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">78</p>
              <p className="text-[10px] text-[#9ca3af]">参考示例分</p>
            </div>
          </div>
          {(() => {
            const dims = [
              { label: '坚持度', value: 80, color: '#002fa7' },
              { label: '完成率', value: 75, color: '#781621' },
              { label: '效率', value: 82, color: '#F6D300' },
              { label: '专注', value: 70, color: '#002fa7' },
              { label: '连续性', value: 68, color: '#781621' },
              { label: '任务量', value: 90, color: '#10b981' },
            ];
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [
              cx + r * Math.cos(ang(i)),
              cy + r * Math.sin(ang(i)),
            ];
            const poly = (r: number) =>
              dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims
              .map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(','))
              .join(' ');
            return (
              // P12: radar is purely decorative
              <svg viewBox="0 0 260 244" className="w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="radarFillDT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return (
                    <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />
                  );
                })}
                <polygon
                  points={dataPoly}
                  fill="url(#radarFillDT)"
                  stroke="#002fa7"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return (
                    <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />
                  );
                })}
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R + 16);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#6b7280"
                      fontSize="10.5"
                      fontWeight="600"
                    >
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
          <div className="mt-2 grid grid-cols-3 gap-y-2">
            {[
              { label: '坚持度', value: 80, color: '#002fa7' },
              { label: '完成率', value: 75, color: '#781621' },
              { label: '效率', value: 82, color: '#F6D300' },
              { label: '专注', value: 70, color: '#002fa7' },
              { label: '连续性', value: 68, color: '#781621' },
              { label: '任务量', value: 90, color: '#10b981' },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 近 7 日任务完成趋势 · 真数据驱动(若有 history) */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">近 7 日任务完成</h3>
                <p className="text-[11px] text-[#9ca3af]">
                  {hasHistoryData ? '按每日实际完成数量统计' : '暂无历史数据 · 完成任务后自动更新'}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2.5 py-1 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>
              持续进步
            </span>
          </div>
          <div className="mb-2 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none text-[#111827]">
              {totalCount}
            </p>
            <span className="mb-1 text-[13px] text-[#9ca3af]">今日任务总数</span>
          </div>
          {(() => {
            const data = trendData;
            const W = 500;
            const H = 160;
            const padL = 6;
            const padR = 6;
            const padT = 12;
            const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = Math.max(5, ...data);
            const x = (i: number) => padL + (innerW * i) / Math.max(1, data.length - 1);
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data
              .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
              .join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              // P12: trend chart carries real data → role=img + label
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                role="img"
                aria-label="近 7 日每日完成任务数量趋势图"
              >
                <defs>
                  <linearGradient id="trendFillDT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLineDT" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#002fa7" />
                    <stop offset="100%" stopColor="#781621" />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line
                    key={f}
                    x1={padL}
                    x2={W - padR}
                    y1={(padT + innerH * f).toFixed(1)}
                    y2={(padT + innerH * f).toFixed(1)}
                    stroke="#f1f3f9"
                    strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#trendFillDT)" />
                <path
                  d={line}
                  fill="none"
                  stroke="url(#trendLineDT)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" />
                ))}
              </svg>
            );
          })()}
          {/* P11: x-axis labels match actual trendData length */}
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {xAxisLabels.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI 卡一排 (3 stats + 今日完成率) ──────────────────────────────── */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        {liveStats.map((stat, i) => {
          const meta = STAT_ICON_META[i] ?? STAT_ICON_META[0]!;
          return (
            <div
              key={stat.id}
              data-testid="stat-card"
              className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.iconBg} ${meta.iconColor}`}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {meta.icon}
                  </span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.badge} ${meta.badgeText}`}>
                  {stat.label}
                </span>
              </div>
              <div className="mt-4">
                <p className={`text-[28px] font-bold leading-none ${meta.valueColor}`}>{stat.value}</p>
                {/* P2/P3: show loading/error inline; totalDays/totalTasks clarified as 近30天 */}
                <p className="mt-1.5 text-[12px] text-[#6b7280]">
                  {isHistoryError
                    ? <span className="text-[#ef4444]">数据加载失败</span>
                    : stat.label}
                </p>
                {/* P3: 30-day window disclaimer on the two cumulative stats */}
                {(stat.id === 'total-days' || stat.id === 'total-tasks') && !isHistoryError && (
                  <p className="mt-0.5 text-[10px] text-[#b0b8c8]">近 30 天</p>
                )}
              </div>
              {/* P12: mini bar chart is purely decorative */}
              <div className="mt-3 flex h-6 items-end gap-1" aria-hidden="true">
                {[40, 60, 50, 80, 70, 90, typeof stat.value === 'number' && stat.value > 0 ? 100 : 20].map((h, j) => (
                  <div
                    key={j}
                    className="flex-1 rounded-t opacity-70"
                    style={{
                      height: `${h}%`,
                      backgroundColor:
                        i === 0 ? '#F6D300' : i === 1 ? '#002fa7' : '#10b981',
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* 今日完成率 · 第 4 张 · 蓝 + 环形 */}
        <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">donut_large</span>
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[13px]" aria-hidden="true">trending_up</span>
              今日
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none text-[#002fa7]">
                {todayPct}
                <span className="text-[15px] text-[#9ca3af]">%</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">今日完成率</p>
            </div>
            <ProgressRing pct={todayPct} />
          </div>
        </div>
      </div>

      {/* ── 今日进度卡 ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <TodayProgressSection completed={completedCount} total={totalCount} />
      </div>

      {/* ── 任务清单 ─────────────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">checklist</span>
        <h2 className="text-[16px] font-bold text-[#111827]">今日任务清单</h2>
        <span className="ml-2 rounded-full bg-[#002fa7]/10 px-2.5 py-0.5 text-[12px] font-bold text-[#002fa7]">
          {tasks.length > 0 ? tasks.length : DAILY_TASKS_MOCK.length} 项
        </span>
        {/* regenerate button */}
        <button
          type="button"
          data-testid="daily-tasks-regenerate"
          disabled={regenerateToday.isPending}
          onClick={() => regenerateToday.mutate()}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6b7280] transition-all hover:border-[#002fa7] hover:text-[#002fa7] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">refresh</span>
          {regenerateToday.isPending ? '生成中…' : '重新生成'}
        </button>
      </div>
      <div className="mb-8 space-y-4">
        {tasks.length > 0
          ? tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onComplete={handleComplete}
                markingIds={markingIds}
              />
            ))
          : DAILY_TASKS_MOCK.map((task) => (
              <MockTaskRow key={task.id} task={task} />
            ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <FooterButtons
        onIPDiagnosis={() => navigate(DAILY_TASKS_FOOTER_BTN_1_HREF)}
        onContinue={() => navigate(DAILY_TASKS_FOOTER_BTN_2_HREF)}
      />
    </PioneerLayout>
  );
}
