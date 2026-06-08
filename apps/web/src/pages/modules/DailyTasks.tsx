/**
 * /daily-tasks · 今日行动清单 · 液态玻璃 IKB 体系
 * 阶段2: 接真 trpc.dailyTasks.* · 三态(loading/error/null空态) · 乐观完成
 * LiquidShell · inline style + token · testid 全保留
 */
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
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
// 液态玻璃三色: streak=purpleText, total-days=ikb, total-tasks=ikb
const STAT_ICON_META: Array<{
  icon: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  badge: string;
  badgeText: string;
  barColor: string;
}> = [
  // streak · purpleText
  {
    icon: 'local_fire_department',
    iconBg: 'rgba(168,197,224,0.18)',
    iconColor: C.purpleText,
    valueColor: C.purpleText,
    badge: 'rgba(168,197,224,0.18)',
    badgeText: C.purpleText,
    barColor: C.accent3,
  },
  // total-days · ikb 蓝
  {
    icon: 'emoji_events',
    iconBg: 'rgba(168,197,224,0.18)',
    iconColor: C.ikb,
    valueColor: C.ikb,
    badge: 'rgba(168,197,224,0.18)',
    badgeText: C.ikb,
    barColor: C.ikb,
  },
  // total-tasks · ikb 蓝(完成/正向)
  {
    icon: 'task_alt',
    iconBg: 'rgba(168,197,224,0.18)',
    iconColor: C.ikb,
    valueColor: C.ikb,
    badge: 'rgba(168,197,224,0.18)',
    badgeText: C.ikb,
    barColor: C.ikb,
  },
];

// ── Priority styles · 液态玻璃体系 ───────────────────────────────────────────
const PRIORITY_STYLE: Record<TaskPriority, { bg: string; border: string; text: string; dot: string }> = {
  high: {
    bg: 'rgba(255,255,255,0.12)',
    border: 'rgba(255,255,255,0.25)',
    text: C.burgundyText,
    dot: 'rgba(255,160,160,0.85)',
  },
  medium: {
    bg: 'rgba(168,197,224,0.18)',
    border: 'rgba(168,197,224,0.45)',
    text: C.ikb,
    dot: C.ikb,
  },
  low: {
    bg: 'rgba(168,197,224,0.12)',
    border: 'rgba(168,197,224,0.28)',
    text: C.purpleText,
    dot: C.accent3,
  },
};

// ── Category icon · Material Symbols ─────────────────────────────────────────
const CATEGORY_ICON: Record<TaskCategory, string> = {
  学习研究: 'menu_book',
  内容创作: 'edit_note',
  账号优化: 'manage_accounts',
};

// 液态玻璃三主色轮转
const CATEGORY_STYLE: Record<TaskCategory, { bg: string; border: string; text: string }> = {
  学习研究: { bg: 'rgba(168,197,224,0.15)', border: 'rgba(168,197,224,0.4)', text: C.ikb },
  内容创作: { bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.22)', text: C.burgundyText },
  账号优化: { bg: 'rgba(168,197,224,0.12)', border: 'rgba(168,197,224,0.28)', text: C.purpleText },
};

// ── ChipHeader ────────────────────────────────────────────────────────────────

function ChipHeader() {
  return (
    <Reveal style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span
        style={{
          borderRadius: 9999,
          border: `0.5px solid ${C.line}`,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
          padding: '3px 12px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C.ink,
          fontFamily: F.mono,
          textShadow: C.textShadow,
        }}
      >
        智能引擎
      </span>
      <span
        data-testid="daily-tasks-chip"
        style={{
          borderRadius: 9999,
          border: '0.5px solid rgba(168,197,224,0.55)',
          background: 'rgba(168,197,224,0.18)',
          backdropFilter: 'blur(12px)',
          padding: '3px 12px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C.ikb,
          fontFamily: F.mono,
          textShadow: C.textShadow,
        }}
      >
        每日任务
      </span>
    </Reveal>
  );
}

// ── ProgressRing ──────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const dash = ((pct / 100) * 100).toFixed(1);
  return (
    <svg
      viewBox="0 0 36 36"
      style={{ width: 48, height: 48, flexShrink: 0, transform: 'rotate(-90deg)' }}
      role="img"
      aria-label={`今日完成率 ${pct}%`}
    >
      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.22)" strokeWidth="3.5" />
      <circle
        cx="18"
        cy="18"
        r="15.915"
        fill="none"
        stroke={C.ikb}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} 100`}
      />
    </svg>
  );
}

// ── TodayProgressSection ──────────────────────────────────────────────────────

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
    <motion.div
      data-testid="today-progress-card"
      className="lg-glass lg-spec"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{ borderRadius: 18, padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'flex',
              height: 40,
              width: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              background: 'rgba(168,197,224,0.22)',
              color: C.ikb,
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 22 }}>today</span>
          </span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>今日进度</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>完成 {completed} / {total} 项任务</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: C.ikb, fontFamily: F.display, textShadow: C.textShadow }}>{pct}%</span>
          <ProgressRing pct={pct} />
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
          height: 10,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 9999,
          background: 'rgba(168,197,224,0.18)',
        }}
      >
        <div
          style={{
            height: 10,
            borderRadius: 9999,
            background: C.grad,
            width: `${pct}%`,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </motion.div>
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
    <motion.div
      data-testid={`task-card-${task.id}`}
      className="lg-glass lg-spec"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{
        borderRadius: 18,
        padding: 24,
        opacity: isCompleted ? 0.72 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <button
          type="button"
          disabled={isCompleted || isMarking}
          onClick={() => { if (!isCompleted && !isMarking) onComplete(task.id); }}
          style={{
            marginTop: 2,
            display: 'flex',
            height: 32,
            width: 32,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            border: 'none',
            background: 'rgba(168,197,224,0.22)',
            color: C.ikb,
            cursor: isCompleted || isMarking ? 'not-allowed' : 'pointer',
            opacity: isCompleted || isMarking ? 0.6 : 1,
            outline: 'none',
          }}
          onFocus={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = `2px solid ${C.ikb}`; (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px'; }}
          onBlur={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = 'none'; }}
          aria-label={isCompleted ? `已完成` : `标记完成`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {isCompleted ? 'check_circle' : isMarking ? 'hourglass_empty' : 'radio_button_unchecked'}
          </span>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.3,
                fontFamily: F.display,
                color: isCompleted ? 'rgba(255,255,255,0.45)' : C.ink,
                margin: 0,
                textDecoration: isCompleted ? 'line-through' : 'none',
                textShadow: C.textShadow,
              }}
            >
              {task.title}
            </h3>
            {/* Priority chip */}
            <span
              data-testid="task-priority-tag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 9999,
                border: `1px solid ${pri.border}`,
                background: pri.bg,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: pri.text,
                fontFamily: F.mono,
              }}
            >
              <span style={{ height: 6, width: 6, borderRadius: '50%', background: pri.dot, display: 'inline-block' }} />
              {PRIORITY_LABELS[priority]}优先
            </span>
            {/* Category chip */}
            <span
              data-testid="task-category-tag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 9999,
                border: `1px solid ${cat.border}`,
                background: cat.bg,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 500,
                color: cat.text,
                fontFamily: F.cn,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 12 }}>{catIcon}</span>
              {category}
            </span>
            {/* estimatedMinutes badge */}
            {task.estimatedMinutes !== null && task.estimatedMinutes !== undefined && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 9999,
                  border: `1px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '2px 8px',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: F.cn,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 12 }}>schedule</span>
                {task.estimatedMinutes} 分钟
              </span>
            )}
          </div>
          {task.description && (
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: F.cn }}>{task.description}</p>
          )}
          {task.ctaUrl && !isCompleted && (
            <a
              href={task.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                fontWeight: 600,
                color: C.ikb,
                textDecoration: 'none',
                outline: 'none',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
              onFocus={(e) => { (e.currentTarget as HTMLAnchorElement).style.outline = `2px solid ${C.ikb}`; (e.currentTarget as HTMLAnchorElement).style.outlineOffset = '2px'; }}
              onBlur={(e) => { (e.currentTarget as HTMLAnchorElement).style.outline = 'none'; }}
            >
              {task.ctaText ?? '去完成'}
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>open_in_new</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Mock-derived TaskRow for fallback/empty display (keeps structure identical)
function MockTaskRow({ task }: { task: TaskMockItem }) {
  const pri = PRIORITY_STYLE[task.priority];
  const cat = CATEGORY_STYLE[task.category];
  const catIcon = CATEGORY_ICON[task.category];
  return (
    <motion.div
      data-testid={`task-card-${task.id}`}
      className="lg-glass lg-spec"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{ borderRadius: 18, padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <span
          style={{
            marginTop: 2,
            display: 'flex',
            height: 32,
            width: 32,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: 'rgba(168,197,224,0.22)',
            color: C.ikb,
          }}
          aria-hidden={true}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>radio_button_unchecked</span>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, fontFamily: F.display, color: C.ink, margin: 0, textShadow: C.textShadow }}>{task.title}</h3>
            {/* Priority chip */}
            <span
              data-testid="task-priority-tag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 9999,
                border: `1px solid ${pri.border}`,
                background: pri.bg,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: pri.text,
                fontFamily: F.mono,
              }}
            >
              <span style={{ height: 6, width: 6, borderRadius: '50%', background: pri.dot, display: 'inline-block' }} />
              {PRIORITY_LABELS[task.priority]}优先
            </span>
            {/* Category chip */}
            <span
              data-testid="task-category-tag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 9999,
                border: `1px solid ${cat.border}`,
                background: cat.bg,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 500,
                color: cat.text,
                fontFamily: F.cn,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 12 }}>{catIcon}</span>
              {task.category}
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.7)', margin: 0, fontFamily: F.cn }}>{task.desc}</p>
        </div>
      </div>
    </motion.div>
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
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 16, paddingBottom: 16 }}
    >
      <button
        type="button"
        onClick={onIPDiagnosis}
        data-testid="footer-btn-diagnosis"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 12,
          border: `1px solid ${C.line}`,
          background: 'rgba(255,255,255,0.08)',
          padding: '12px 24px',
          fontSize: 13,
          fontWeight: 700,
          color: C.ink,
          fontFamily: F.cn,
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          outline: 'none',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb;
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,197,224,0.18)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = C.line;
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
        }}
        onFocus={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = `2px solid ${C.ikb}`; (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px'; }}
        onBlur={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = 'none'; }}
      >
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>stethoscope</span>
        {DAILY_TASKS_FOOTER_BTN_1}
      </button>
      <button
        type="button"
        onClick={onContinue}
        data-testid="footer-btn-continue"
        className="lg-gradbtn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 12,
          border: 'none',
          padding: '12px 24px',
          fontSize: 13,
          fontWeight: 700,
          color: '#fff',
          fontFamily: F.cn,
          cursor: 'pointer',
        }}
      >
        {DAILY_TASKS_FOOTER_BTN_2}
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>arrow_forward</span>
      </button>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="lg-glass"
      style={{
        height: 96,
        borderRadius: 18,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
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
      <LiquidShell>
        <header style={{ marginBottom: 48 }}>
          <ChipHeader />
          <h1
            data-testid="daily-tasks-loading"
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              fontFamily: F.display,
              margin: 0,
              background: C.grad,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              textShadow: 'none',
            }}
          >
            {DAILY_TASKS_H1}
          </h1>
          <p style={{ marginTop: 8, maxWidth: 820, fontSize: 16, lineHeight: 1.65, color: C.burgundyText, fontFamily: F.cn, textShadow: C.textShadow }}>
            {DAILY_TASKS_SUBTITLE}
          </p>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </LiquidShell>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <LiquidShell>
        <header style={{ marginBottom: 48 }}>
          <ChipHeader />
          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              fontFamily: F.display,
              margin: 0,
              background: C.grad,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              textShadow: 'none',
            }}
          >
            {DAILY_TASKS_H1}
          </h1>
        </header>
        <Reveal>
          <div
            data-testid="daily-tasks-error"
            className="lg-glass"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              borderRadius: 18,
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.burgundyText }}>error_outline</span>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>加载今日任务失败</p>
            <button
              type="button"
              data-testid="daily-tasks-retry"
              onClick={() => void refetch()}
              className="lg-gradbtn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 12,
                border: 'none',
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                fontFamily: F.cn,
                cursor: 'pointer',
              }}
            >
              重试
            </button>
          </div>
        </Reveal>
      </LiquidShell>
    );
  }

  // ── Empty state (getToday null) ───────────────────────────────────────────
  if (!todayRecord) {
    return (
      <LiquidShell>
        <header style={{ marginBottom: 48 }}>
          <ChipHeader />
          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              fontFamily: F.display,
              margin: 0,
              background: C.grad,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              textShadow: 'none',
            }}
          >
            {DAILY_TASKS_H1}
          </h1>
          <p style={{ marginTop: 8, maxWidth: 820, fontSize: 16, lineHeight: 1.65, color: C.burgundyText, fontFamily: F.cn, textShadow: C.textShadow }}>
            {DAILY_TASKS_SUBTITLE}
          </p>
        </header>
        <Reveal>
          <div
            data-testid="daily-tasks-empty"
            className="lg-glass"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              borderRadius: 18,
              padding: '64px 32px',
              textAlign: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.ikb }}>inbox</span>
            <p style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.display, textShadow: C.textShadow }}>今日暂无任务</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: F.cn }}>AI 正在为你规划今日行动清单，或点击下方手动生成</p>
            <button
              type="button"
              data-testid="daily-tasks-regenerate"
              disabled={regenerateToday.isPending}
              onClick={() => regenerateToday.mutate()}
              className="lg-gradbtn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 12,
                border: 'none',
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                fontFamily: F.cn,
                cursor: regenerateToday.isPending ? 'not-allowed' : 'pointer',
                opacity: regenerateToday.isPending ? 0.6 : 1,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>refresh</span>
              {regenerateToday.isPending ? '生成中…' : '重新生成'}
            </button>
          </div>
        </Reveal>
        <FooterButtons
          onIPDiagnosis={() => navigate(DAILY_TASKS_FOOTER_BTN_1_HREF)}
          onContinue={() => navigate(DAILY_TASKS_FOOTER_BTN_2_HREF)}
        />
      </LiquidShell>
    );
  }

  // ── Normal render (todayRecord present) ──────────────────────────────────
  return (
    <LiquidShell>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: 48 }}>
        <ChipHeader />
        <h1
          style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            fontFamily: F.display,
            margin: 0,
            background: C.grad,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            textShadow: 'none',
          }}
        >
          {DAILY_TASKS_H1}
        </h1>
        <p style={{ marginTop: 8, maxWidth: 820, fontSize: 16, lineHeight: 1.65, color: C.burgundyText, fontFamily: F.cn, textShadow: C.textShadow }}>
          {DAILY_TASKS_SUBTITLE}
        </p>
        {/* isFallback warning */}
        {todayRecord.isFallback && (
          <Reveal>
            <div
              style={{
                marginTop: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 8,
                border: `1px solid rgba(168,197,224,0.35)`,
                background: 'rgba(168,197,224,0.12)',
                padding: '8px 16px',
                fontSize: 13,
                color: C.purpleText,
                fontFamily: F.cn,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>warning</span>
              当前为降级数据，AI 任务生成中，稍后刷新查看最新内容
            </div>
          </Reveal>
        )}
      </header>

      {/* ── KPI 卡一排 (3 stats + 今日完成率) ──────────────────────────────── */}
      <RevealGroup style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {liveStats.map((stat, i) => {
          const meta = STAT_ICON_META[i] ?? STAT_ICON_META[0]!;
          return (
            <Item key={stat.id}>
              <motion.div
                data-testid="stat-card"
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: meta.iconBg,
                      color: meta.iconColor,
                    }}
                  >
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>
                      {meta.icon}
                    </span>
                  </span>
                  <span
                    style={{
                      borderRadius: 9999,
                      background: meta.badge,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: meta.badgeText,
                      fontFamily: F.mono,
                    }}
                  >
                    {stat.label}
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: meta.valueColor, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>{stat.value}</p>
                  {/* P2/P3: show loading/error inline; totalDays/totalTasks clarified as 近30天 */}
                  <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '6px 0 0', fontFamily: F.cn }}>
                    {isHistoryError
                      ? <span style={{ color: C.burgundyText }}>数据加载失败</span>
                      : stat.label}
                  </p>
                  {/* P3: 30-day window disclaimer on the two cumulative stats */}
                  {(stat.id === 'total-days' || stat.id === 'total-tasks') && !isHistoryError && (
                    <p style={{ marginTop: 2, fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: F.cn }}>近 30 天</p>
                  )}
                </div>
                {/* P12: mini bar chart is purely decorative */}
                <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }} aria-hidden={true}>
                  {[40, 60, 50, 80, 70, 90, typeof stat.value === 'number' && stat.value > 0 ? 100 : 20].map((h, j) => (
                    <div
                      key={j}
                      style={{
                        flex: 1,
                        borderRadius: '2px 2px 0 0',
                        opacity: 0.55,
                        height: `${h}%`,
                        background: meta.barColor,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </Item>
          );
        })}

        {/* 今日完成率 · 第 4 张 · ikb 蓝 + 环形 */}
        <Item>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>donut_large</span>
              </span>
              {/* 今日 badge — ikb 蓝(正向) */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 9999,
                  background: 'rgba(168,197,224,0.18)',
                  border: '1px solid rgba(168,197,224,0.45)',
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 13 }}>trending_up</span>
                今日
              </span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ikb, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                  {todayPct}
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>%</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn, margin: '6px 0 0' }}>今日完成率</p>
              </div>
              <ProgressRing pct={todayPct} />
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── 今日进度卡 ──────────────────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 32 }}>
        <TodayProgressSection completed={completedCount} total={totalCount} />
      </Reveal>

      {/* ── 任务清单 ─────────────────────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.ikb }}>checklist</span>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>今日任务清单</h2>
        <span
          style={{
            marginLeft: 8,
            borderRadius: 9999,
            background: 'rgba(168,197,224,0.18)',
            border: '1px solid rgba(168,197,224,0.4)',
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 700,
            color: C.ikb,
            fontFamily: F.mono,
          }}
        >
          {tasks.length > 0 ? tasks.length : DAILY_TASKS_MOCK.length} 项
        </span>
        {/* regenerate button */}
        <button
          type="button"
          data-testid="daily-tasks-regenerate"
          disabled={regenerateToday.isPending}
          onClick={() => regenerateToday.mutate()}
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: 'rgba(255,255,255,0.08)',
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.6)',
            fontFamily: F.cn,
            cursor: regenerateToday.isPending ? 'not-allowed' : 'pointer',
            opacity: regenerateToday.isPending ? 0.5 : 1,
            transition: 'border-color 0.15s, color 0.15s',
            outline: 'none',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            if (!regenerateToday.isPending) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb;
              (e.currentTarget as HTMLButtonElement).style.color = C.ikb;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.line;
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
          }}
          onFocus={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = `2px solid ${C.ikb}`; (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px'; }}
          onBlur={(e) => { (e.currentTarget as HTMLButtonElement).style.outline = 'none'; }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 15 }}>refresh</span>
          {regenerateToday.isPending ? '生成中…' : '重新生成'}
        </button>
      </Reveal>
      <RevealGroup style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tasks.length > 0
          ? tasks.map((task) => (
              <Item key={task.id}>
                <TaskRow
                  task={task}
                  onComplete={handleComplete}
                  markingIds={markingIds}
                />
              </Item>
            ))
          : DAILY_TASKS_MOCK.map((task) => (
              <Item key={task.id}>
                <MockTaskRow task={task} />
              </Item>
            ))}
      </RevealGroup>

      {/* ── 数据洞察 band ────────────────────────────────────────────────────── */}
      {/* P1: removed "历史数据综合评估" wording → "参考基准 · 示例"; deleted "模型已就绪" badge */}
      <Reveal style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.ikb }}>insights</span>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>执行力数据洞察</h2>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>· 参考基准 · 示例</span>
      </Reveal>
      <div style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }}>
        {/* 执行力雷达 · 六维 · 装饰 · P1: label改参考基准示例 · P12: aria-hidden */}
        <Reveal>
          <div
            className="lg-glass"
            style={{
              borderRadius: 20,
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: 'rgba(168,197,224,0.22)',
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>执行力雷达</h3>
                  {/* P1: clarified as reference/example, not real personalised data */}
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, fontFamily: F.cn }}>六维参考示例</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {/* P1: clarified as reference score */}
                <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: C.ikb, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>78</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0, fontFamily: F.cn }}>参考示例分</p>
              </div>
            </div>
            {(() => {
              const dims = [
                { label: '坚持度', value: 80, color: C.ikb },
                { label: '完成率', value: 75, color: 'rgba(255,160,160,0.85)' },
                { label: '效率', value: 82, color: C.accent3 },
                { label: '专注', value: 70, color: C.ikb },
                { label: '连续性', value: 68, color: 'rgba(255,160,160,0.85)' },
                { label: '任务量', value: 90, color: C.ikb },
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
                <svg viewBox="0 0 260 244" style={{ width: '100%' }} aria-hidden={true}>
                  <defs>
                    <linearGradient id="dt-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                      <stop offset="100%" stopColor="rgba(255,160,160,0.85)" stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke={C.line} strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return (
                      <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(168,197,224,0.18)" strokeWidth="1" />
                    );
                  })}
                  <polygon
                    points={dataPoly}
                    fill="url(#dt-radarFill)"
                    stroke={C.ikb}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R * (d.value / 100));
                    return (
                      <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />
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
                        fill="rgba(255,255,255,0.65)"
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
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 0' }}>
              {[
                { label: '坚持度', value: 80, color: C.ikb },
                { label: '完成率', value: 75, color: 'rgba(255,160,160,0.85)' },
                { label: '效率', value: 82, color: C.accent3 },
                { label: '专注', value: 70, color: C.ikb },
                { label: '连续性', value: 68, color: 'rgba(255,160,160,0.85)' },
                { label: '任务量', value: 90, color: C.ikb },
              ].map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ height: 8, width: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 近 7 日任务完成趋势 · 真数据驱动(若有 history) */}
        <Reveal>
          <div
            className="lg-glass"
            style={{
              borderRadius: 20,
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.burgundyText,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>近 7 日任务完成</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, fontFamily: F.cn }}>
                    {hasHistoryData ? '按每日实际完成数量统计' : '暂无历史数据 · 完成任务后自动更新'}
                  </p>
                </div>
              </div>
              {/* 持续进步 badge — ikb 蓝(正向/增长) */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 9999,
                  background: 'rgba(168,197,224,0.18)',
                  border: '1px solid rgba(168,197,224,0.4)',
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>trending_up</span>
                持续进步
              </span>
            </div>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                {totalCount}
              </p>
              <span style={{ marginBottom: 4, fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>今日任务总数</span>
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
                  style={{ width: '100%' }}
                  role="img"
                  aria-label="近 7 日每日完成任务数量趋势图"
                >
                  <defs>
                    <linearGradient id="dt-trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.22" />
                      <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="dt-trendLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.ikb} />
                      <stop offset="100%" stopColor="rgba(255,160,160,0.85)" />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((f) => (
                    <line
                      key={f}
                      x1={padL}
                      x2={W - padR}
                      y1={(padT + innerH * f).toFixed(1)}
                      y2={(padT + innerH * f).toFixed(1)}
                      stroke={C.line}
                      strokeWidth="1"
                    />
                  ))}
                  <path d={area} fill="url(#dt-trendFill)" />
                  <path
                    d={line}
                    fill="none"
                    stroke="url(#dt-trendLine)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {data.map((v, i) => (
                    <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" />
                  ))}
                </svg>
              );
            })()}
            {/* P11: x-axis labels match actual trendData length */}
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4, fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>
              {xAxisLabels.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <FooterButtons
        onIPDiagnosis={() => navigate(DAILY_TASKS_FOOTER_BTN_1_HREF)}
        onContinue={() => navigate(DAILY_TASKS_FOOTER_BTN_2_HREF)}
      />
    </LiquidShell>
  );
}
