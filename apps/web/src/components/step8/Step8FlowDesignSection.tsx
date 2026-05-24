// PRD-29.12 · Step8 7 stage 横向 timeline
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';
import { type Step8Plan } from './Step8PlanTabs';

interface Step8FlowDesignSectionProps {
  stages: Step8Plan['flowStages'];
  className?: string;
}

export function Step8FlowDesignSection({ stages, className }: Step8FlowDesignSectionProps) {
  return (
    <SubCard className={cn('space-y-4', className)}>
      {/* H3 row */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
          ⚡ 直播流程设计
        </h3>
        <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
          完整流程
        </span>
      </div>

      {/* stage chips + arrows */}
      <div className="flex items-center gap-2 flex-wrap">
        {stages.map((stage, i) => (
          <span key={stage.index} className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 border border-primary/30 rounded px-3 py-1 text-on-surface">
              <span className="text-primary font-semibold">{stage.index}</span>
              {stage.name}
            </span>
            {i < stages.length - 1 && (
              <span className="text-primary/60 text-xs">→</span>
            )}
          </span>
        ))}
      </div>
    </SubCard>
  );
}
