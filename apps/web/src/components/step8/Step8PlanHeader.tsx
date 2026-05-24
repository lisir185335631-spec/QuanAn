// PRD-29.12 · Step8 plan 头部
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';
import { type Step8Plan } from './Step8PlanTabs';

interface Step8PlanHeaderProps {
  plan: Step8Plan;
  className?: string;
}

export function Step8PlanHeader({ plan, className }: Step8PlanHeaderProps) {
  return (
    <SubCard className={cn('space-y-4', className)}>
      {/* row · title + hookLine chip */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
          🎙 {plan.title}
        </h3>
        <span className="inline-flex items-center rounded border border-primary/30 bg-primary/15 text-primary px-3 py-1 text-xs">
          {plan.hookLine}
        </span>
      </div>

      {/* 4 KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-sm">👥</span>
            <p className="text-xs text-muted-foreground">目标观众</p>
          </div>
          <p className="text-sm text-on-surface font-semibold">{plan.kpis.targetAudience}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-sm">🕐</span>
            <p className="text-xs text-muted-foreground">建议时长</p>
          </div>
          <p className="text-sm text-on-surface font-semibold">{plan.kpis.duration}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-sm">◎</span>
            <p className="text-xs text-muted-foreground">目标在线</p>
          </div>
          <p className="text-sm text-on-surface font-semibold">{plan.kpis.targetOnline}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-sm">$</span>
            <p className="text-xs text-muted-foreground">目标营收</p>
          </div>
          <p className="text-sm text-on-surface font-semibold">{plan.kpis.targetRevenue}</p>
        </div>
      </div>
    </SubCard>
  );
}
