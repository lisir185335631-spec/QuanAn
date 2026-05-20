/**
 * Evolution.tsx — PRD-24 US-002
 * /evolution · 智能体进化中心 · 5 级进化 badge + 4 指标仪表盘 + 5 H3 模块 + 进化方向 radio
 * AC-1: H1 '智能体进化中心' + 副标 EVOLUTION_SUBTITLE + '智能' 菜单分类
 * AC-5: stub L2 active · 5 badge 卡 + 4 指标 grid-cols-4 + 5 H3 模块
 * AC-6: localStorage acc_{accountId}_evolution_settings via getLsKey
 * AC-7: DOM button ≥ 9
 * PRD-25+: 接 LLM 时替换 stub 数据为 trpc.evolution.getProfile.useQuery()
 */
import { BookOpen, Brain, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import {
  EVOLUTION_DIRECTIONS_4,
  EVOLUTION_LEVELS_5,
  EVOLUTION_METRICS_STUB,
  EVOLUTION_MODULES_5,
  EVOLUTION_SUBTITLE,
} from '@/lib/constants/evolution';
import { getLsKey } from '@/lib/ls-namespace';

// ── LevelBadge row ────────────────────────────────────────────────────────────

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

// ── module card helpers ───────────────────────────────────────────────────────

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

// ── main page ─────────────────────────────────────────────────────────────────

export default function Evolution() {
  const { account } = useActiveAccount();
  const navigate = useNavigate();
  const accountId = account?.id ?? null;

  // AC-6: load evolution direction from localStorage
  const [direction, setDirection] = useState<string>(EVOLUTION_DIRECTIONS_4[0]!);

  useEffect(() => {
    if (!accountId) return;
    const key = getLsKey(accountId, 'evolution_settings');
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as { direction?: string };
        if (parsed.direction && EVOLUTION_DIRECTIONS_4.includes(parsed.direction as string)) {
          setDirection(parsed.direction);
        }
      }
    } catch { /* ignore malformed */ }
  }, [accountId]);

  function handleDirectionChange(val: string) {
    setDirection(val);
    if (!accountId) return;
    const key = getLsKey(accountId, 'evolution_settings');
    localStorage.setItem(key, JSON.stringify({ direction: val }));
  }

  const stubLevel = 'L2';

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-3xl">
      {/* AC-1: header */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">智能</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">智能体进化中心</h1>
        <p className="mt-2 text-body-md text-muted-foreground">{EVOLUTION_SUBTITLE}</p>
      </div>

      {/* AC-5: 5 级 badge 卡 — stub L2 active */}
      <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-5 space-y-3">
        <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wide">
          当前进化等级
        </p>
        <LevelBadgeRow activeId={stubLevel} />
      </div>

      {/* AC-5: 4 指标仪表盘 grid-cols-4 stub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="好评数" value={EVOLUTION_METRICS_STUB.goodCount} />
        <MetricCard label="待改进" value={EVOLUTION_METRICS_STUB.needsImprovement} />
        <MetricCard label="学习档案" value={EVOLUTION_METRICS_STUB.learningArchive} unit=" 条" />
        <MetricCard label="满意率" value={EVOLUTION_METRICS_STUB.satisfactionRate} unit="%" />
      </div>

      {/* AC-5: 5 H3 模块 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: 进化等级 */}
        <ModuleCard title={EVOLUTION_MODULES_5[0]!} icon={<TrendingUp className="w-4 h-4" />}>
          <p className="text-body-sm text-muted-foreground">
            当前等级 L2 · 还需 13 条好评反馈升至 L3
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info('触发进化 PRD-25+')}
          >
            触发进化
          </Button>
        </ModuleCard>

        {/* Module 2: 进化洞察 */}
        <ModuleCard title={EVOLUTION_MODULES_5[1]!} icon={<Brain className="w-4 h-4" />}>
          <p className="text-body-sm text-muted-foreground">
            累计 5+ 条反馈后自动生成偏好画像洞察
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info('生成洞察 PRD-25+')}
          >
            生成洞察
          </Button>
        </ModuleCard>

        {/* Module 3: 最近反馈 */}
        <ModuleCard title={EVOLUTION_MODULES_5[2]!} icon={<Zap className="w-4 h-4" />}>
          <p className="text-body-sm text-muted-foreground">
            共 {EVOLUTION_METRICS_STUB.goodCount} 条好评 · {EVOLUTION_METRICS_STUB.needsImprovement} 条待改进
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
            已归档 {EVOLUTION_METRICS_STUB.learningArchive} 条学习记录
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info('新增学习 PRD-25+')}
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
        <DirectionRadio selected={direction} onChange={handleDirectionChange} />
        <div className="pt-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => toast.success('设置已保存')}
          >
            保存设置
          </Button>
        </div>
      </ModuleCard>
    </main>
  );
}
