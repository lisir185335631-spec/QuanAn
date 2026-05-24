// PRD-29.9 · Step4 单个 phase sub-component
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface Step4Phase {
  number: 1 | 2 | 3;
  title: string;
  weekRange: string;
  goal: string;
  dailyTasks: Array<{
    day: string;
    title: string;
    desc: string;
    duration: string;
  }>;
  milestones: Array<{
    week: string;
    goal: string;
    criteria?: string;
  }>;
  contentPlan: {
    frequency: string;
    categories: Array<{
      name: string;
      desc: string;
    }>;
    bestTime: string;
  };
  kpis: Array<{
    name: string;
    target: string;
    baseline: string;
  }>;
}

interface Step4PhaseSectionProps {
  phase: Step4Phase;
  className?: string;
}

export function Step4PhaseSection({ phase, className }: Step4PhaseSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row · number circle + title */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/15 text-primary text-sm font-bold shrink-0">
          {phase.number}
        </span>
        <h3 className="text-base font-semibold text-on-surface">{phase.title}</h3>
      </div>

      {/* weekRange + goal */}
      <p className="text-xs text-muted-foreground">
        🕐 {phase.weekRange} · 目标：{phase.goal}
      </p>

      {/* 📋 每日任务 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">📋 每日任务</p>
          <div className="space-y-4">
            {phase.dailyTasks.map((task, i) => (
              <div key={i} className="grid grid-cols-[140px_1fr] gap-4">
                <p className="text-xs text-primary/85 font-mono">{task.day}</p>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-on-surface">{task.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{task.desc}</p>
                  <p className="text-[11px] text-muted-foreground/70">🕐 {task.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 🎯 每周里程碑 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">🎯 每周里程碑</p>
          <div className="space-y-4">
            {phase.milestones.map((milestone, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr] gap-4">
                <p className="text-xs text-primary font-semibold">{milestone.week}</p>
                <div className="space-y-1">
                  <p className="text-sm text-on-surface">{milestone.goal}</p>
                  {milestone.criteria && (
                    <p className="text-xs text-muted-foreground">检查标准：{milestone.criteria}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 📝 内容计划 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">📝 内容计划</p>
          <p className="text-sm text-on-surface">
            每周发布: <span className="text-primary font-semibold">{phase.contentPlan.frequency}</span>
          </p>
          <div className="space-y-2">
            {phase.contentPlan.categories.map((cat, i) => (
              <div
                key={i}
                className="bg-primary/8 border border-primary/25 rounded-lg p-3"
              >
                <span className="text-sm font-semibold text-on-surface">{cat.name}</span>
                <span className="text-sm text-muted-foreground"> - {cat.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">最佳发布时间：{phase.contentPlan.bestTime}</p>
        </div>
      </SubCard>

      {/* 📊 KPI指标 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">📊 KPI指标</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phase.kpis.map((kpi, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{kpi.name}</p>
                <p className="text-2xl text-primary font-bold">{kpi.target}</p>
                <p className="text-xs text-muted-foreground/70">当前基准：{kpi.baseline}</p>
              </div>
            ))}
          </div>
        </div>
      </SubCard>
    </div>
  );
}
