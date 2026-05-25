import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  IP_PLAN_GO_COMPLETE,
  IP_PLAN_STATUS_DONE,
  IP_PLAN_STATUS_TODO,
  IP_PLAN_VIEW_DETAIL,
  type IpPlanStep,
} from '@/lib/constants/ipPlan';

interface IpPlanStepCardProps {
  step: IpPlanStep;
  index: number;
}

export function IpPlanStepCard({ step, index }: IpPlanStepCardProps) {
  const Icon = step.icon;

  return (
    <div
      className="rounded-xl bg-card border p-5"
      data-testid={`ip-plan-step-card-${step.id}`}
    >
      <div className="flex justify-between items-center">
        {/* left group: icon circle + text */}
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
              step.done ? 'bg-primary/10' : 'bg-card/40 border border-border/40'
            }`}
            data-testid={`ip-plan-step-icon-circle-${index}`}
          >
            <Icon
              className={`h-6 w-6 ${step.done ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          <div>
            <h3
              className={`font-cn font-bold ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}
              data-testid={`ip-plan-step-title-${step.id}`}
            >
              {step.title}
            </h3>
            <p
              className="text-sm text-muted-foreground"
              data-testid={`ip-plan-step-status-${step.id}`}
            >
              {step.done ? IP_PLAN_STATUS_DONE : IP_PLAN_STATUS_TODO}
            </p>
          </div>
        </div>

        {/* right group: check icon + action link */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {step.done ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" data-testid={`ip-plan-step-check-${step.id}`} />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" data-testid={`ip-plan-step-circle-${step.id}`} />
          )}
          <Link
            to={step.href}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid={`ip-plan-step-action-${step.id}`}
          >
            {step.done ? IP_PLAN_VIEW_DETAIL : IP_PLAN_GO_COMPLETE}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* completed extra row */}
      {step.done && step.extra && (
        <div
          className="border-t border-border/40 pt-3 mt-3"
          data-testid={`ip-plan-step-extra-${step.id}`}
        >
          <p className="text-xs text-muted-foreground">{step.extra}</p>
        </div>
      )}
    </div>
  );
}
