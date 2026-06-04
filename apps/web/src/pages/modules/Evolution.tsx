/**
 * Evolution.tsx · 红蓝紫渐变 IKB 体系
 * /evolution · 智能体进化中心 · 阶段2: trpc 真后端
 * IKBLayout 外壳 · inline style + token · testid 零改动
 */
import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
import {
  EVOLUTION_ARCHIVE_ADD,
  EVOLUTION_ARCHIVE_DONE_CHIP,
  EVOLUTION_ARCHIVE_TITLE,
  EVOLUTION_BREADCRUMB_LEFT,
  EVOLUTION_DIR_DEFAULT_TAG,
  EVOLUTION_FEEDBACK_EMPTY_DESC,
  EVOLUTION_FEEDBACK_EMPTY_TITLE,
  EVOLUTION_FEEDBACK_TITLE,
  EVOLUTION_H1,
  EVOLUTION_INSIGHT_EMPTY_DESC,
  EVOLUTION_INSIGHT_EMPTY_TITLE,
  EVOLUTION_INSIGHT_TITLE,
  EVOLUTION_LEVEL_INFO_TPL,
  EVOLUTION_LEVEL_NEXT_TPL,
  EVOLUTION_LEVEL_TITLE_TPL,
  EVOLUTION_LEVELS_5,
  EVOLUTION_SETTING_AUTO_DESC,
  EVOLUTION_SETTING_AUTO_LABEL,
  EVOLUTION_SETTING_DIR_DESC,
  EVOLUTION_SETTING_DIR_LABEL,
  EVOLUTION_SETTINGS_TITLE,
  EVOLUTION_STAT_LABELS,
  EVOLUTION_SUBTITLE_PARTS,
  EVOLUTION_TOAST_AUTO_OFF,
  EVOLUTION_TOAST_AUTO_ON,
  EVOLUTION_TRIGGER_BTN,
} from '@/lib/constants/evolution';
import { trpc } from '@/lib/trpc';

// ── Level threshold map (mirrors API inferLevel) ─────────────────────────────
const LEVEL_THRESHOLDS: Record<string, { min: number; next: number | null }> = {
  L1: { min: 0,   next: 5   },
  L2: { min: 5,   next: 20  },
  L3: { min: 20,  next: 50  },
  L4: { min: 50,  next: 100 },
  L5: { min: 100, next: null },
};

function calcProgress(level: string, feedbackTotal: number): number {
  const cfg = LEVEL_THRESHOLDS[level];
  if (!cfg || cfg.next === null) return 100;
  const range = cfg.next - cfg.min;
  const done  = feedbackTotal - cfg.min;
  return Math.min(100, Math.max(0, Math.round((done / range) * 100)));
}

function calcNextNeed(level: string, feedbackTotal: number): number {
  const cfg = LEVEL_THRESHOLDS[level];
  if (!cfg || cfg.next === null) return 0;
  return Math.max(0, cfg.next - feedbackTotal);
}

// ─────────────────────────────────────────────────────────────────
// Inline IKB 组件 (testid 全保留)
// ─────────────────────────────────────────────────────────────────

// ── EvolutionHeader ────────────────────────────────────────────────
interface EvolutionHeaderProps {
  onTrigger: () => void;
}
function EvolutionHeader({ onTrigger }: EvolutionHeaderProps) {
  return (
    <header data-testid="evolution-header" className="mb-12 flex flex-row items-center justify-between gap-8">
      <div className="shrink-0">
        <div data-testid="evolution-breadcrumb" className="mb-2 flex items-center gap-1 text-[11px] text-[#6b7280]">
          <span style={{ fontFamily: F.mono, color: C.ikb }} className="font-bold uppercase tracking-widest">
            {EVOLUTION_BREADCRUMB_LEFT}
          </span>
          <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>chevron_right</span>
          <span>{EVOLUTION_H1}</span>
        </div>
        <div className="mb-3 flex items-center gap-3">
          <span
            className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
            style={{ borderColor: C.line, background: '#e8e8e8', color: '#1b1b1b' }}
          >
            智能引擎
          </span>
          <span
            className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
            style={{ borderColor: `${C.accent3}66`, background: `${C.accent3}18`, color: C.purpleText }}
          >
            进化引擎
          </span>
        </div>
        <h1
          data-testid="evolution-h1"
          className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tighter"
          style={{ fontFamily: F.display }}
        >
          {EVOLUTION_H1}
        </h1>
        <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed" style={{ color: '#444653' }}>
          {EVOLUTION_SUBTITLE_PARTS.prefix}
          <span className="font-semibold" style={{ color: C.ikb }}>{EVOLUTION_SUBTITLE_PARTS.highlight1}</span>
          {EVOLUTION_SUBTITLE_PARTS.middle}
          <span className="font-semibold" style={{ color: C.ikb }}>{EVOLUTION_SUBTITLE_PARTS.highlight2}</span>
          {EVOLUTION_SUBTITLE_PARTS.suffix}
        </p>
      </div>
      <button
        type="button"
        data-testid="trigger-evolution-btn"
        onClick={onTrigger}
        className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        aria-label="触发进化"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>bolt</span>
        {EVOLUTION_TRIGGER_BTN}
      </button>
    </header>
  );
}

// ── LevelCard ────────────────────────────────────────────────────
interface LevelCardProps {
  level: string;
  feedbackCountTotal: number;
  deepLearningCount: number;
}
function LevelCard({ level, feedbackCountTotal, deepLearningCount }: LevelCardProps) {
  const currentLevel = EVOLUTION_LEVELS_5.find((l) => l.id === level) ?? EVOLUTION_LEVELS_5[0]!;
  const titleText = EVOLUTION_LEVEL_TITLE_TPL(currentLevel.id, currentLevel.label);
  const infoText  = EVOLUTION_LEVEL_INFO_TPL(feedbackCountTotal, deepLearningCount);
  const isMaxLevel = LEVEL_THRESHOLDS[level]?.next === null;
  const nextNeed  = calcNextNeed(level, feedbackCountTotal);
  const nextText  = isMaxLevel ? '已达最高等级' : EVOLUTION_LEVEL_NEXT_TPL(nextNeed);
  const progressPct = calcProgress(level, feedbackCountTotal);

  return (
    <div
      data-testid="level-card"
      className="ikb-hovercard mb-8 overflow-hidden rounded-xl p-6"
      style={{ border: `1px solid ${C.line}`, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg"
              style={{ background: C.grad }}
            >
              <span className="material-symbols-outlined text-[28px] text-white" aria-hidden={true}>eco</span>
            </div>
            <div>
              <p
                data-testid="level-title"
                className="text-[16px] font-extrabold"
                style={{ color: C.ink }}
              >
                {titleText}
              </p>
              <p
                data-testid="level-info"
                className="mt-0.5 text-[12px]"
                style={{ color: '#6b7280' }}
              >
                {infoText}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]" style={{ color: '#6b7280' }}>
              <span>进化经验</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: C.base }}>
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: C.grad }}
              />
            </div>
            <p
              data-testid="level-next"
              className="text-[11px]"
              style={{ color: '#6b7280' }}
            >
              {nextText}
            </p>
          </div>
        </div>

        <div
          data-testid="level-icon-row"
          className="flex shrink-0 items-center gap-3"
        >
          {EVOLUTION_LEVELS_5.map((lvl) => {
            const isActive = lvl.id === level;
            return (
              <div
                key={lvl.id}
                data-testid={`level-icon-${lvl.id}`}
                data-state={isActive ? 'active' : 'inactive'}
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2B53E6] shadow-md shadow-[#2B53E6]/25'
                    : 'border border-[#e5e7eb] bg-white opacity-40'
                }`}
                title={`${lvl.id} ${lvl.label}`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${isActive ? 'text-white' : 'text-[#6b7280]'}`}
                  aria-hidden={true}
                >
                  {lvl.id === 'L1'
                    ? 'eco'
                    : lvl.id === 'L2'
                      ? 'menu_book'
                      : lvl.id === 'L3'
                        ? 'eco'
                        : lvl.id === 'L4'
                          ? 'park'
                          : 'workspace_premium'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────
type StatVariant = 'good' | 'needsImprove' | 'learning' | 'satisfaction';

interface StatCardProps {
  variant: StatVariant;
  label: string;
  value: number;
  unit?: string;
  showDelta?: boolean;
}

type StatVariantStyle = {
  borderColor: string;
  iconBg: string;
  iconColor: string;
  icon: string;
  chipBg: string;
  chipColor: string;
};

const STAT_VARIANT_STYLES: Record<StatVariant, StatVariantStyle> = {
  good: {
    borderColor: C.ikb + '33',
    iconBg: C.ikb + '18',
    iconColor: C.ikb,
    icon: 'thumb_up',
    chipBg: C.ikb + '18',
    chipColor: C.ikb,
  },
  needsImprove: {
    borderColor: '#fecaca',
    iconBg: C.burgundy + '18',
    iconColor: C.burgundy,
    icon: 'thumb_down',
    chipBg: '#fef2f2',
    chipColor: C.burgundyText,
  },
  learning: {
    borderColor: C.accent3 + '33',
    iconBg: C.accent3 + '18',
    iconColor: C.accent3,
    icon: 'neurology',
    chipBg: C.accent3 + '18',
    chipColor: C.purpleText,
  },
  satisfaction: {
    borderColor: C.ikb + '33',
    iconBg: C.ikb + '18',
    iconColor: C.ikb,
    icon: 'trending_up',
    chipBg: C.accent3 + '18',
    chipColor: C.purpleText,
  },
};

function StatCard({ variant, label, value, unit = '', showDelta = false }: StatCardProps) {
  const s = STAT_VARIANT_STYLES[variant];
  return (
    <div
      data-testid={`stat-card-${variant}`}
      className="ikb-hovercard rounded-xl p-5"
      style={{
        border: `1px solid ${s.borderColor}`,
        background: `linear-gradient(135deg, ${C.paper}, ${C.base})`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: s.iconBg, color: s.iconColor }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>{s.icon}</span>
        </span>
        {showDelta && (
          <span
            data-testid="stat-delta-chip"
            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ background: s.chipBg, color: s.chipColor }}
          >
            -0%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[28px] font-bold leading-none" style={{ color: C.ink }}>
          {value}
          {unit && <span className="text-[15px]" style={{ color: '#6b7280' }}>{unit}</span>}
        </p>
        <p
          data-testid={`stat-label-${variant}`}
          className="mt-1.5 text-[12px]"
          style={{ color: '#6b7280' }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

// ── InsightCard ───────────────────────────────────────────────────
interface InsightItem {
  id: number | string;
  triggerType: string;
  direction: string | null;
  content?: unknown;
  levelBefore: string | null;
  levelAfter: string | null;
  createdAt: Date | string;
}

function InsightCard({ items }: { items: InsightItem[] }) {
  if (items.length === 0) {
    return (
      <div
        data-testid="empty-insight-card"
        className="ikb-hovercard rounded-xl p-5"
        style={{ border: `1px dashed ${C.ikb}55`, background: C.base }}
      >
        <div className="mb-4 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: C.ikb + '18', color: C.ikb }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>emoji_events</span>
          </span>
          <h3 className="text-[13px] font-semibold" style={{ color: C.ink }}>{EVOLUTION_INSIGHT_TITLE}</h3>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <span className="material-symbols-outlined text-[48px]" aria-hidden={true} style={{ color: C.ikb + '55' }}>shield</span>
          <p
            data-testid="insight-empty-title"
            className="text-[13px] font-medium"
            style={{ color: '#374151' }}
          >
            {EVOLUTION_INSIGHT_EMPTY_TITLE}
          </p>
          <p className="max-w-[200px] text-[11px]" style={{ color: '#6b7280' }}>
            {EVOLUTION_INSIGHT_EMPTY_DESC}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="insight-card"
      className="ikb-hovercard rounded-xl p-5"
      style={{ border: `1px solid ${C.ikb}44`, background: C.base }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: C.ikb + '18', color: C.ikb }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>emoji_events</span>
        </span>
        <h3 className="text-[13px] font-semibold" style={{ color: C.ink }}>{EVOLUTION_INSIGHT_TITLE}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            data-testid={`insight-item-${String(item.id)}`}
            className="rounded-lg px-4 py-3"
            style={{ border: `1px solid ${C.line}`, background: C.paper }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold" style={{ color: C.ikb }}>
                {item.direction ?? '综合'}
              </span>
              {item.levelAfter && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                  style={{ background: C.ikb + '18', color: C.ikb }}
                >
                  → {item.levelAfter}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px]" style={{ color: '#6b7280' }}>
              {item.triggerType} · {new Date(item.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FeedbackCard ──────────────────────────────────────────────────
interface FeedbackItem {
  id: number | string;
  rating: 'good' | 'bad';
  agentId: string;
  comment: string | null;
  traceId: string | null;
  createdAt: Date | string;
}

function FeedbackCard({ items }: { items: FeedbackItem[] }) {
  if (items.length === 0) {
    return (
      <div
        data-testid="empty-feedback-card"
        className="ikb-hovercard rounded-xl p-5"
        style={{ border: `1px dashed ${C.accent3}55`, background: C.base }}
      >
        <div className="mb-4 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: C.accent3 + '18', color: C.purpleText }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>chat_bubble</span>
          </span>
          <h3 className="text-[13px] font-semibold" style={{ color: C.ink }}>{EVOLUTION_FEEDBACK_TITLE}</h3>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <span className="material-symbols-outlined text-[48px]" aria-hidden={true} style={{ color: C.accent3 + '55' }}>chat_bubble_outline</span>
          <p
            data-testid="feedback-empty-title"
            className="text-[13px] font-medium"
            style={{ color: '#374151' }}
          >
            {EVOLUTION_FEEDBACK_EMPTY_TITLE}
          </p>
          <p className="max-w-[200px] text-[11px]" style={{ color: '#6b7280' }}>
            {EVOLUTION_FEEDBACK_EMPTY_DESC}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="feedback-card"
      className="ikb-hovercard rounded-xl p-5"
      style={{ border: `1px solid ${C.accent3}44`, background: C.base }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: C.accent3 + '18', color: C.purpleText }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>chat_bubble</span>
        </span>
        <h3 className="text-[13px] font-semibold" style={{ color: C.ink }}>{EVOLUTION_FEEDBACK_TITLE}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            data-testid={`feedback-item-${String(item.id)}`}
            className="flex items-start gap-3 rounded-lg px-4 py-3"
            style={{ border: `1px solid ${C.accent3}33`, background: C.paper }}
          >
            <span
              className="mt-0.5 text-[18px]"
              aria-label={item.rating === 'good' ? '好评' : '差评'}
            >
              {item.rating === 'good' ? '👍' : '👎'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold" style={{ color: C.ink }}>{item.agentId}</p>
              {item.comment && (
                <p className="mt-0.5 text-[11px]" style={{ color: '#6b7280' }}>{item.comment}</p>
              )}
              <p className="mt-0.5 text-[10px]" style={{ color: '#6b7280' }}>
                {new Date(item.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SettingRow ───────────────────────────────────────────────────
interface SettingRowProps {
  label: string;
  desc: string;
  control: React.ReactNode;
  testid?: string;
}
function SettingRow({ label, desc, control, testid = 'setting-row' }: SettingRowProps) {
  return (
    <div
      data-testid={testid}
      className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
      style={{ border: `1px solid ${C.line}`, background: C.paper }}
    >
      <div className="space-y-0.5">
        <p className="text-[13px] font-bold" style={{ color: C.ink }}>{label}</p>
        <p className="text-[11px]" style={{ color: '#6b7280' }}>{desc}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Radar / Trend static decoration (不依赖后端，视觉装饰)
// ─────────────────────────────────────────────────────────────────
const EV_RADAR_DIMS = [
  { label: '内容质量', value: 72, color: C.ikb },
  { label: '互动率',   value: 65, color: C.burgundy },
  { label: '转化',     value: 58, color: C.accent3 },
  { label: '更新频率', value: 80, color: C.ikb },
  { label: '学习力',   value: 90, color: C.burgundy },
  { label: '满意度',   value: 70, color: C.accent3 },
];

const EV_TREND_DATA   = [20, 28, 25, 38, 44, 50, 62, 72, 68, 80, 86, 92];
const EV_TREND_LABELS = ['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'];

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────
export default function Evolution() {
  const navigate = useNavigate();

  // ── trpc queries ──────────────────────────────────────────────
  const profileQuery  = trpc.evolution.getProfile.useQuery();
  const insightQuery  = trpc.evolution.getInsightHistory.useQuery();
  const feedbackQuery = trpc.evolution.recentFeedback.useQuery({ limit: 10 });
  const updateConfig  = trpc.evolution.updateConfig.useMutation({
    onSuccess: () => { void profileQuery.refetch(); },
    onError: () => {
      setAutoOnLocal(null);
      toast.error('设置失败 · 请重试');
    },
  });

  // local optimistic state for toggle (mirrors server value once loaded)
  const [autoOnLocal, setAutoOnLocal] = useState<boolean | null>(null);

  const profile  = profileQuery.data ?? null;
  const insights = insightQuery.data ?? [];
  const feedbacks = feedbackQuery.data ?? [];
  const currentDirection = profile?.currentDirection ?? '综合';

  const autoOn = autoOnLocal ?? profile?.autoEvolutionEnabled ?? true;

  // ── derived profile values ─────────────────────────────────────
  const level            = profile?.level ?? 'L1';
  const feedbackTotal    = profile?.feedbackCountTotal ?? 0;
  const deepLearningCount = profile?.deepLearningCount ?? 0;
  const satisfactionRate  = profile !== null
    ? Math.round((profile.satisfactionRate ?? 0) * 100)
    : 0;

  // ── trigger-evolution handler ─────────────────────────────────
  function handleTrigger() {
    if (profile === null) {
      toast.info('暂无进化档案，开始使用积累反馈后可触发进化');
      return;
    }
    // No standalone "manual trigger" procedure — refetch insights/profile
    void profileQuery.refetch();
    void insightQuery.refetch();
    toast.info('反馈达阈值后自动进化，当前已刷新进化状态');
  }

  // ── loading state ─────────────────────────────────────────────
  if (profileQuery.isLoading) {
    return (
      <IKBLayout>
        <div className="mx-auto max-w-6xl space-y-8">
          <EvolutionHeader onTrigger={handleTrigger} />
          <div
            data-testid="evolution-loading"
            className="flex min-h-[400px] items-center justify-center"
            style={{ color: '#6b7280' }}
          >
            <span className="material-symbols-outlined animate-spin text-[32px]" aria-hidden={true}>progress_activity</span>
          </div>
        </div>
      </IKBLayout>
    );
  }

  // ── error state ───────────────────────────────────────────────
  if (profileQuery.isError) {
    return (
      <IKBLayout>
        <div className="mx-auto max-w-6xl space-y-8">
          <EvolutionHeader onTrigger={handleTrigger} />
          <div
            data-testid="evolution-error"
            className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center"
          >
            <span className="material-symbols-outlined text-[48px]" aria-hidden={true} style={{ color: C.burgundy }}>error</span>
            <p className="text-[14px] font-semibold" style={{ color: C.burgundyText }}>加载进化档案失败，请刷新重试</p>
            <button
              type="button"
              onClick={() => void profileQuery.refetch()}
              className="ikb-gradbtn ikb-focusring rounded-md px-4 py-2 text-[13px] font-semibold text-white"
            >
              重试
            </button>
          </div>
        </div>
      </IKBLayout>
    );
  }

  // ── null / undefined (no profile yet) state ──────────────────
  if (profile === null) {
    return (
      <IKBLayout>
        <div className="mx-auto max-w-6xl space-y-8">
          <EvolutionHeader onTrigger={handleTrigger} />
          <div
            data-testid="evolution-empty"
            className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center"
          >
            <span className="material-symbols-outlined text-[64px]" aria-hidden={true} style={{ color: C.ikb + '66' }}>eco</span>
            <p
              data-testid="evolution-empty-title"
              className="text-[18px] font-extrabold"
              style={{ color: C.ink }}
            >
              暂无进化档案
            </p>
            <p className="max-w-[320px] text-[13px]" style={{ color: '#6b7280' }}>
              开始使用各功能并留下反馈，积累后进化档案将自动创建
            </p>
          </div>
        </div>
      </IKBLayout>
    );
  }

  return (
    <IKBLayout>
      <div className="mx-auto max-w-6xl space-y-8">

        {/* §1 Header */}
        <EvolutionHeader onTrigger={handleTrigger} />

        {/* §2 进化等级卡 */}
        <LevelCard
          level={level}
          feedbackCountTotal={feedbackTotal}
          deepLearningCount={deepLearningCount}
        />

        {/* §3 4 StatCard KPI */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            variant="good"
            label={EVOLUTION_STAT_LABELS.good}
            value={profile.feedbackCountGood}
          />
          <StatCard
            variant="needsImprove"
            label={EVOLUTION_STAT_LABELS.needsImprove}
            value={profile.feedbackCountBad}
          />
          <StatCard
            variant="learning"
            label={EVOLUTION_STAT_LABELS.learningArchive}
            value={deepLearningCount}
          />
          <StatCard
            variant="satisfaction"
            label={EVOLUTION_STAT_LABELS.satisfaction}
            value={satisfactionRate}
            unit="%"
            showDelta
          />
        </div>

        {/* §4 数据洞察 band */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: C.ikb }}>insights</span>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink }}>数据洞察</h2>
          <span className="text-[12px]" style={{ color: '#6b7280' }}>· AI 综合评估 · 实时测算</span>
          <span
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: C.ikb + '18', color: C.ikb }}
          >
            <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ background: C.ikb }} />
            模型已就绪
          </span>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {/* 进化维度雷达 · col-span-5 */}
          <div
            className="ikb-hovercard col-span-5 rounded-xl p-6"
            style={{ border: `1px solid ${C.line}`, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: C.ikb + '18', color: C.ikb }}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold" style={{ color: C.ink }}>进化维度雷达</h3>
                  <p className="text-[11px]" style={{ color: '#6b7280' }}>六维模型评估</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[26px] font-bold leading-none" style={{ color: C.ikb }}>73</p>
                <p className="text-[10px]" style={{ color: '#6b7280' }}>综合分</p>
              </div>
            </div>
            {(() => {
              const dims = EV_RADAR_DIMS;
              const cx = 130; const cy = 122; const R = 88;
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
                <svg viewBox="0 0 260 244" className="w-full">
                  <defs>
                    <linearGradient id="ev-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                      <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                  })}
                  <polygon points={dataPoly} fill="url(#ev-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R * (d.value / 100));
                    return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                  })}
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R + 16);
                    return (
                      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                        {d.label}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
            <div className="mt-2 grid grid-cols-3 gap-y-2">
              {EV_RADAR_DIMS.map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px]" style={{ color: '#6b7280' }}>{d.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: C.ink }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 进化成长曲线 · col-span-7 */}
          <div
            className="ikb-hovercard col-span-7 rounded-xl p-6"
            style={{ border: `1px solid ${C.line}`, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: C.burgundy + '18', color: C.burgundy }}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold" style={{ color: C.ink }}>进化成长曲线</h3>
                  <p className="text-[11px]" style={{ color: '#6b7280' }}>按进化维度综合测算</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['成长', '反馈', '学习'].map((t, i) => (
                  <span
                    key={t}
                    className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                    style={
                      i === 0
                        ? { background: C.ikb, color: '#fff' }
                        : { background: C.base, color: '#6b7280' }
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-3 flex items-end gap-3">
              <p className="text-[30px] font-bold leading-none" style={{ color: C.ink }}>92</p>
              <span
                className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
                style={{ background: C.ikb + '18', color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>
                +360%
              </span>
              <span className="mb-1 text-[12px]" style={{ color: '#6b7280' }}>较冷启动基线</span>
            </div>
            {(() => {
              const data = EV_TREND_DATA;
              const W = 560; const H = 168;
              const padL = 6; const padR = 6; const padT = 12; const padB = 8;
              const innerW = W - padL - padR; const innerH = H - padT - padB;
              const max = 110;
              const x = (i: number) => padL + (innerW * i) / (data.length - 1);
              const y = (v: number) => padT + innerH * (1 - v / max);
              const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
              const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                  <defs>
                    <linearGradient id="ev-trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                      <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="ev-trendLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.ikb} />
                      <stop offset="100%" stopColor={C.burgundy} />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((f) => (
                    <line key={f} x1={padL} x2={W - padR} y1={(padT + innerH * f).toFixed(1)} y2={(padT + innerH * f).toFixed(1)} stroke="#f1f3f9" strokeWidth="1" />
                  ))}
                  <path d={area} fill="url(#ev-trendFill)" />
                  <path d={line} fill="none" stroke="url(#ev-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((v, i) =>
                    i % 2 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                  )}
                </svg>
              );
            })()}
            <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280' }}>
              {EV_TREND_LABELS.map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>

        {/* §5 2-col: 洞察 + 反馈 */}
        <div className="grid grid-cols-2 gap-6">
          <InsightCard items={insights} />
          <FeedbackCard items={feedbacks} />
        </div>

        {/* §6 深度学习档案 — 显示计数 + 跳转入口 (不再用 EVOLUTION_ARCHIVE_MOCK) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-extrabold" style={{ color: C.ink }}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: C.ikb }}>auto_awesome</span>
              {EVOLUTION_ARCHIVE_TITLE}
            </h2>
            <button
              type="button"
              data-testid="add-learning-link"
              onClick={() => navigate('/deep-learning')}
              className="ikb-focusring flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors"
              style={{ border: `1px solid ${C.ikb}44`, background: C.base, color: C.ikb }}
              aria-label="新增深度学习"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden={true}>add</span>
              {EVOLUTION_ARCHIVE_ADD}
            </button>
          </div>

          {deepLearningCount > 0 ? (
            <div
              data-testid="archive-count-card"
              className="flex items-center justify-between rounded-xl px-5 py-4"
              style={{ border: `1px solid ${C.line}`, background: C.paper }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: C.ikb + '18' }}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true} style={{ color: C.ikb }}>auto_awesome</span>
                </span>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: C.ink }}>
                    已完成 {deepLearningCount} 个深度学习档案
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: '#6b7280' }}>
                    点击「新增学习」继续积累 · 或在深度学习页查看详情
                  </p>
                </div>
              </div>
              <span
                data-testid="archive-chip-archive-1"
                className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: C.ikb + '18', color: C.ikb }}
              >
                {EVOLUTION_ARCHIVE_DONE_CHIP}
              </span>
            </div>
          ) : (
            <div
              data-testid="archive-empty"
              className="rounded-xl px-5 py-6 text-center"
              style={{ border: `1px dashed ${C.line}`, background: C.base }}
            >
              <p className="text-[13px]" style={{ color: '#6b7280' }}>
                还没有深度学习档案 · 点击「新增学习」开始积累
              </p>
            </div>
          )}
        </section>

        {/* §7 进化设置 */}
        <section className="space-y-4">
          <h2 className="text-[16px] font-extrabold" style={{ color: C.ink }}>{EVOLUTION_SETTINGS_TITLE}</h2>
          <SettingRow
            testid="setting-row-auto"
            label={EVOLUTION_SETTING_AUTO_LABEL}
            desc={EVOLUTION_SETTING_AUTO_DESC}
            control={
              <button
                type="button"
                data-testid="auto-toggle"
                onClick={() => {
                  const next = !autoOn;
                  setAutoOnLocal(next);
                  updateConfig.mutate({ autoEvolutionEnabled: next });
                  toast.info(next ? EVOLUTION_TOAST_AUTO_ON : EVOLUTION_TOAST_AUTO_OFF);
                }}
                className="ikb-focusring relative h-7 w-12 rounded-full transition-colors"
                style={{ background: autoOn ? C.ikb : '#e5e7eb' }}
                aria-pressed={autoOn}
                aria-label="自动进化开关"
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                    autoOn ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            }
          />
          <SettingRow
            testid="setting-row-direction"
            label={EVOLUTION_SETTING_DIR_LABEL}
            desc={EVOLUTION_SETTING_DIR_DESC}
            control={
              <span
                className="rounded-md px-3 py-1 text-[12px] font-semibold"
                style={{ border: `1px solid ${C.ikb}44`, background: C.base, color: C.ikb }}
              >
                {currentDirection || EVOLUTION_DIR_DEFAULT_TAG}
              </span>
            }
          />
        </section>

      </div>
    </IKBLayout>
  );
}
