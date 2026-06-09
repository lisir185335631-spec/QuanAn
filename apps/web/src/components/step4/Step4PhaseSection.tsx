// PRD-29.9 · Step4 单个 phase sub-component
import { C, F } from '@/components/home-next/ikb/system';
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
        <span
          className="inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold shrink-0"
          style={{ background: 'rgba(216,232,255,0.18)', color: C.ikb, border: `0.5px solid rgba(216,232,255,0.35)` }}
        >
          {phase.number}
        </span>
        <h3 className="text-base font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{phase.title}</h3>
      </div>

      {/* weekRange + goal */}
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: F.cn, textShadow: C.textShadow }}>
        <span aria-hidden="true">🕐</span> {phase.weekRange} · 目标：{phase.goal}
      </p>

      {/* 📋 每日任务 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">📋</span> 每日任务</p>
          <div className="space-y-4">
            {phase.dailyTasks.map((task, i) => (
              <div key={i} className="grid grid-cols-[140px_1fr] gap-4">
                <p className="text-xs font-mono" style={{ color: C.ikb }}>{task.day}</p>
                <div className="space-y-1">
                  <p className="text-sm font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{task.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{task.desc}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}><span aria-hidden="true">🕐</span> {task.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubCard>

      {/* 🎯 每周里程碑 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">🎯</span> 每周里程碑</p>
          <div className="space-y-4">
            {phase.milestones.map((milestone, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr] gap-4">
                <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn }}>{milestone.week}</p>
                <div className="space-y-1">
                  <p className="text-sm" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{milestone.goal}</p>
                  {milestone.criteria && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>检查标准：{milestone.criteria}</p>
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
          <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">📝</span> 内容计划</p>
          <p className="text-sm" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
            每周发布: <span className="font-semibold" style={{ color: C.ikb }}>{phase.contentPlan.frequency}</span>
          </p>
          <div className="space-y-2">
            {phase.contentPlan.categories.map((cat, i) => (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{ background: 'rgba(216,232,255,0.12)', border: `0.5px solid rgba(216,232,255,0.25)` }}
              >
                <span className="text-sm font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{cat.name}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}> - {cat.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>最佳发布时间：{phase.contentPlan.bestTime}</p>
        </div>
      </SubCard>

      {/* 📊 KPI指标 */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}><span aria-hidden="true">📊</span> KPI指标</p>
          <div className="grid grid-cols-2 gap-4">
            {phase.kpis.map((kpi, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>{kpi.name}</p>
                <p className="text-2xl font-bold" style={{ color: C.ikb, fontFamily: F.display }}>{kpi.target}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}>当前基准：{kpi.baseline}</p>
              </div>
            ))}
          </div>
        </div>
      </SubCard>
    </div>
  );
}
