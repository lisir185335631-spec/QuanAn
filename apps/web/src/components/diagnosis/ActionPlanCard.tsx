import type { ActionPlanCardData } from '@/lib/constants/diagnosis';
import {
  REPORT_LABEL_DIMENSION_PREFIX,
  REPORT_LABEL_DEADLINE_PREFIX,
} from '@/lib/constants/diagnosis';

interface ActionPlanCardProps {
  plan: ActionPlanCardData;
}

export function ActionPlanCard({ plan }: ActionPlanCardProps) {
  return (
    <div
      data-testid={`action-plan-card-${plan.num}`}
      className="flex items-start gap-4 rounded-xl border border-primary/30 bg-card p-5"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary shrink-0">
        <span className="text-sm font-bold text-on-primary">{plan.num}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <p className="text-base text-on-surface">{plan.title}</p>
        <div className="flex flex-wrap gap-3">
          <span className="text-sm text-muted-foreground">
            {REPORT_LABEL_DIMENSION_PREFIX}{plan.dimension}
          </span>
          <span className="text-sm text-primary">
            {REPORT_LABEL_DEADLINE_PREFIX}{plan.deadline}
          </span>
        </div>
      </div>
    </div>
  );
}
