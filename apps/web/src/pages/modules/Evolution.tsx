/**
 * Evolution.tsx — PRD-25 US-004
 * /evolution · 智能体进化中心 · 接 trpc.evolution 全套
 * AC-1: getProfile.useQuery() · loading spinner · error toast · null → EmptyState
 * AC-2: LevelBadgeRow activeId = profile?.level ?? 'L1' (D-237 字面锁继承)
 * AC-3: 4 指标真数据从 profile
 * AC-4: 触发进化 → evolve.useMutation(rateableType:'manual_trigger')
 * AC-5: 生成洞察 → disabled < 5 反馈 · evolve(rateableType:'insight_trigger')
 * AC-6: 进化洞察模块 latestInsight 真数据 (D-237 module 2 字面锁)
 * AC-7: 新增学习 → toast.info + profile.deepLearningCount 真数据
 * AC-8: 进化方向 radio · server-source-of-truth · updateConfig 持久化 · LS 离线兜底
 */
import { BookOpen, Brain, Loader2, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { EmptyState } from '@/components/states/EmptyState';
import { Button } from '@/components/ui/button';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  EVOLUTION_DIRECTIONS_4,
  EVOLUTION_LEVELS_5,
  EVOLUTION_MODULES_5,
  EVOLUTION_SUBTITLE,
} from '@/lib/constants/evolution';
import { getLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

// ── LevelBadgeRow ─────────────────────────────────────────────────────────────

function LevelBadgeRow({ activeId }: { activeId: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {EVOLUTION_LEVELS_5.map((lvl) => {
        const isActive = lvl.id === activeId;
        return (
          <div
            key={lvl.id}
            data-testid={`badge-${lvl.id}`}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-body-sm border transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary font-semibold'
                : 'bg-surface-variant/40 text-muted-foreground border-border/40 opacity-50'
            }`}
          >
            <span>{lvl.emoji}</span>
            <span>{lvl.id}</span>
            <span>{lvl.label}</span>
            <span className="text-xs opacity-70">{lvl.range}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  unit = '',
}: {
  label: string;
  value: number;
  unit?: string;
}) {
  return (
    <div
      data-testid={`metric-${label}`}
      className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-4 text-center space-y-1"
    >
      <p className="text-2xl font-display font-bold text-on-surface">
        {value}
        {unit}
      </p>
      <p className="text-label-sm font-label text-muted-foreground">{label}</p>
    </div>
  );
}

// ── DirectionRadio ────────────────────────────────────────────────────────────

function DirectionRadio({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2" aria-label="进化方向">
      {EVOLUTION_DIRECTIONS_4.map((dir) => (
        <button
          key={dir}
          type="button"
          aria-pressed={selected === dir}
          data-testid={`direction-${dir}`}
          onClick={() => onChange(dir)}
          className={`w-full text-left px-4 py-3 rounded-lg border text-body-sm transition-all ${
            selected === dir
              ? 'bg-primary/10 border-primary text-on-surface font-medium'
              : 'bg-surface-variant/30 border-border/40 text-muted-foreground hover:border-border'
          }`}
        >
          {dir}
        </button>
      ))}
    </div>
  );
}

// ── ModuleCard ────────────────────────────────────────────────────────────────

function ModuleCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-body-md font-display text-on-surface">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── insight text extractor ────────────────────────────────────────────────────

type InsightObj = { insights?: { summary?: string }; summary?: string };

function extractInsightText(insight: unknown): string {
  if (!insight) return '';
  const obj = insight as InsightObj;
  const text = obj.insights?.summary ?? obj.summary;
  if (text) return text;
  return JSON.stringify(insight);
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Evolution() {
  const { account } = useActiveAccount();
  const navigate = useNavigate();
  const accountId = account?.id ?? null;
  const utils = trpc.useUtils();

  // AC-8: direction state — loaded from server then LS fallback
  const [direction, setDirection] = useState<string>(EVOLUTION_DIRECTIONS_4[0]!);

  // AC-1: getProfile.useQuery()
  const {
    data: profile,
    isLoading,
    isError,
  } = trpc.evolution.getProfile.useQuery(undefined, {
    enabled: !!accountId,
  });

  // AC-4: 触发进化 mutation
  const evolveMutation = trpc.evolution.evolve.useMutation({
    onSuccess: () => {
      void utils.evolution.getProfile.invalidate();
      toast.success('进化触发成功 · 5+ 反馈后自动生成洞察');
    },
    onError: (err) => {
      toast.error(`进化触发失败: ${err.message}`);
    },
  });

  // AC-5: 生成洞察 mutation (separate instance for rateableType='insight_trigger')
  const insightMutation = trpc.evolution.evolve.useMutation({
    onSuccess: () => {
      void utils.evolution.getProfile.invalidate();
      toast.success('洞察生成中 · 5+ 反馈后自动生成偏好画像洞察');
    },
    onError: (err) => {
      toast.error(`洞察生成失败: ${err.message}`);
    },
  });

  // AC-8: updateConfig mutation
  const updateConfigMutation = trpc.evolution.updateConfig.useMutation({
    onError: (err) => {
      toast.error(`设置保存失败: ${err.message}`);
    },
  });

  // AC-1: show error toast when query fails
  useEffect(() => {
    if (isError) {
      toast.error('加载进化数据失败 · 请刷新重试');
    }
  }, [isError]);

  // AC-8: server-source-of-truth — load profile.currentDirection, fallback to LS
  useEffect(() => {
    if (profile?.currentDirection) {
      if (EVOLUTION_DIRECTIONS_4.includes(profile.currentDirection)) {
        setDirection(profile.currentDirection);
        return;
      }
    }
    // LS offline fallback
    if (!accountId) return;
    const key = getLsKey(accountId, 'evolution_settings');
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as { direction?: string };
        if (parsed.direction && EVOLUTION_DIRECTIONS_4.includes(parsed.direction)) {
          setDirection(parsed.direction);
        }
      }
    } catch { /* ignore malformed */ }
  }, [profile, accountId]);

  // AC-8: on direction change — persist to server + LS offline fallback
  function handleDirectionChange(val: string) {
    setDirection(val);
    updateConfigMutation.mutate({ currentDirection: val }, {
      onError: () => { /* error toast handled in mutation config */ },
    });
    if (!accountId) return;
    const key = getLsKey(accountId, 'evolution_settings');
    localStorage.setItem(key, JSON.stringify({ direction: val }));
  }

  // AC-4: 触发进化 handler
  function handleEvolve() {
    evolveMutation.mutate({
      rating: 'good',
      agentId: 'EvolutionAgent',
      rateableType: 'manual_trigger',
      rateableId: 0,
    });
  }

  // AC-5: 生成洞察 handler
  function handleInsightTrigger() {
    insightMutation.mutate({
      rating: 'good',
      agentId: 'EvolutionAgent',
      rateableType: 'insight_trigger',
      rateableId: 0,
    });
  }

  // AC-7: 新增学习 handler
  function handleAddLearning() {
    toast.info('新增学习功能 · 跑任意 specialist 后自动加入档案');
  }

  // AC-1: loading state
  if (isLoading) {
    return (
      <main className="flex-1 container py-8 flex items-center justify-center" data-testid="evolution-loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  // Derived metric values
  const level = profile?.level ?? 'L1';
  const feedbackCountGood = profile?.feedbackCountGood ?? 0;
  const feedbackCountTotal = profile?.feedbackCountTotal ?? 0;
  const needsImprovement = feedbackCountTotal - feedbackCountGood;
  const deepLearningCount = profile?.deepLearningCount ?? 0;
  const satisfactionRate = Math.round((profile?.satisfactionRate ?? 0) * 100) / 100;

  // AC-6: latestInsight display
  const rawInsight = profile?.latestInsight;
  const insightText = rawInsight ? extractInsightText(rawInsight) : null;
  const insightDisplay = insightText
    ? insightText.length > 200
      ? insightText.slice(0, 200) + '…'
      : insightText
    : null;

  // AC-5: disable '生成洞察' when feedbackCountTotal < 5
  const isInsightDisabled = feedbackCountTotal < 5;

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-3xl">
      {/* AC-1: header */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">智能</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">智能体进化中心</h1>
        <p className="mt-2 text-body-md text-muted-foreground">{EVOLUTION_SUBTITLE}</p>
      </div>

      {/* AC-1: null profile → EmptyState */}
      {!profile ? (
        <EmptyState
          data-testid="evolution-empty"
          title="新用户 · 暂无进化数据"
          description="跑任意 specialist 后生成"
        />
      ) : (
        <>
          {/* AC-2: LevelBadgeRow with real profile level (D-237 字面锁继承) */}
          <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-5 space-y-3">
            <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wide">
              当前进化等级
            </p>
            <LevelBadgeRow activeId={level} />
          </div>

          {/* AC-3: 4 指标真数据 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="好评数" value={feedbackCountGood} />
            <MetricCard label="待改进" value={needsImprovement} />
            <MetricCard label="学习档案" value={deepLearningCount} unit=" 条" />
            <MetricCard label="满意率" value={satisfactionRate} unit="%" />
          </div>

          {/* AC-5: 5 H3 模块 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Module 1: 进化等级 */}
            <ModuleCard title={EVOLUTION_MODULES_5[0]!} icon={<TrendingUp className="w-4 h-4" />}>
              <p className="text-body-sm text-muted-foreground">
                当前等级 {level} · 持续反馈以升级
              </p>
              {/* AC-4: 触发进化 button */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleEvolve}
                disabled={evolveMutation.isPending}
              >
                {evolveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                触发进化
              </Button>
            </ModuleCard>

            {/* Module 2: 进化洞察 (D-237 字面锁继承) */}
            <ModuleCard title={EVOLUTION_MODULES_5[1]!} icon={<Brain className="w-4 h-4" />}>
              {/* AC-6: latestInsight 显示 */}
              <p className="text-body-sm text-muted-foreground" data-testid="insight-text">
                {insightDisplay ?? '暂无洞察 · 累计 5+ 反馈后自动生成偏好画像洞察'}
              </p>
              {insightDisplay && insightText && insightText.length > 200 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-primary"
                  onClick={() => navigate('/evolution/insights')}
                >
                  查看完整
                </Button>
              )}
              {/* AC-5: 生成洞察 button with disabled state */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleInsightTrigger}
                disabled={isInsightDisabled || insightMutation.isPending}
                title={isInsightDisabled ? '需 ≥ 5 反馈' : undefined}
                data-testid="insight-trigger-button"
              >
                {insightMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                生成洞察
              </Button>
            </ModuleCard>

            {/* Module 3: 最近反馈 */}
            <ModuleCard title={EVOLUTION_MODULES_5[2]!} icon={<Zap className="w-4 h-4" />}>
              <p className="text-body-sm text-muted-foreground">
                共 {feedbackCountGood} 条好评 · {needsImprovement} 条待改进
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/daily-tasks')}
              >
                查看全部
              </Button>
            </ModuleCard>

            {/* Module 4: 深度学习档案 */}
            <ModuleCard title={EVOLUTION_MODULES_5[3]!} icon={<BookOpen className="w-4 h-4" />}>
              <p className="text-body-sm text-muted-foreground">
                已归档 {deepLearningCount} 条学习记录
              </p>
              {/* AC-7: 新增学习 button */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddLearning}
              >
                新增学习
              </Button>
            </ModuleCard>
          </div>

          {/* Module 5: 进化设置 (full width) */}
          <ModuleCard title={EVOLUTION_MODULES_5[4]!} icon={<Sparkles className="w-4 h-4" />}>
            <p className="text-body-sm text-muted-foreground mb-3">
              选择进化方向 · 影响 AI 智能体学习偏好
            </p>
            {/* AC-8: direction radio with server-source-of-truth */}
            <DirectionRadio selected={direction} onChange={handleDirectionChange} />
          </ModuleCard>
        </>
      )}
    </main>
  );
}
