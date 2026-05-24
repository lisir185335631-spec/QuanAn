import { TrendingUp } from 'lucide-react';

import type { ActionPlanCardData } from '@/lib/constants/diagnosis';
import { REPORT_HEADING_ACTION_PLAN } from '@/lib/constants/diagnosis';

import { ActionPlanCard } from './ActionPlanCard';

interface ActionPlanCardsSectionProps {
  plans: ReadonlyArray<ActionPlanCardData>;
}

export function ActionPlanCardsSection({ plans }: ActionPlanCardsSectionProps) {
  return (
    <div
      data-testid="action-plan-cards-section"
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold text-on-surface">{REPORT_HEADING_ACTION_PLAN}</h2>
      </div>
      <div className="flex flex-col gap-4">
        {plans.map((plan) => (
          <ActionPlanCard key={plan.num} plan={plan} />
        ))}
      </div>
    </div>
  );
}
