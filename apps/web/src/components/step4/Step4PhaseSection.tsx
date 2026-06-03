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
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#eff4ff] text-[#002fa7] text-sm font-bold shrink-0">
          {phase.number}
        </span>
        <h3 className="text-base font-semibold text-[#111827]">{phase.title}</h3>
      </div>

      {/* weekRange + goal */}
      <p className="text-xs text-[#6b7280]">
        <span aria-hidden="true">🕐</span> {phase.weekRange} · 目标：{phase.goal}
      </p>

      {/* 📋 每日任务 */}
      <SubCard className="bg-white border-[#e5e7eb]">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">📋</span> 每日任务</p>
          <div className="space-y-4">
            {phase.dailyTasks.map((task, i) => (
              <div key={i} className="grid grid-cols-[140px_1fr] gap-4">
                <p className="text-xs text-[#002fa7] font-mono">{task.day}</p>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#111827]">{task.title}</p>
                  <p className="text-xs text-[#6b7280] leading-relaxed">{task.desc}</p>
                  <p className="text-[11px] text-[#9ca3af]"><span aria-hidden="true">🕐</span> {task.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 🎯 每周里程碑 */}
      <SubCard className="bg-white border-[#e5e7eb]">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">🎯</span> 每周里程碑</p>
          <div className="space-y-4">
            {phase.milestones.map((milestone, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr] gap-4">
                <p className="text-xs text-[#002fa7] font-semibold">{milestone.week}</p>
                <div className="space-y-1">
                  <p className="text-sm text-[#111827]">{milestone.goal}</p>
                  {milestone.criteria && (
                    <p className="text-xs text-[#6b7280]">检查标准：{milestone.criteria}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 📝 内容计划 */}
      <SubCard className="bg-white border-[#e5e7eb]">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">📝</span> 内容计划</p>
          <p className="text-sm text-[#111827]">
            每周发布: <span className="text-[#002fa7] font-semibold">{phase.contentPlan.frequency}</span>
          </p>
          <div className="space-y-2">
            {phase.contentPlan.categories.map((cat, i) => (
              <div
                key={i}
                className="bg-[#eff4ff] border border-[#c7d2fe] rounded-lg p-3"
              >
                <span className="text-sm font-semibold text-[#111827]">{cat.name}</span>
                <span className="text-sm text-[#6b7280]"> - {cat.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6b7280]">最佳发布时间：{phase.contentPlan.bestTime}</p>
        </div>
      </SubCard>

      {/* 📊 KPI指标 */}
      <SubCard className="bg-white border-[#e5e7eb]">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#1f2937]"><span aria-hidden="true">📊</span> KPI指标</p>
          <div className="grid grid-cols-2 gap-4">
            {phase.kpis.map((kpi, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-xs text-[#6b7280]">{kpi.name}</p>
                <p className="text-2xl text-[#002fa7] font-bold">{kpi.target}</p>
                <p className="text-xs text-[#9ca3af]">当前基准：{kpi.baseline}</p>
              </div>
            ))}
          </div>
        </div>
      </SubCard>
    </div>
  );
}
