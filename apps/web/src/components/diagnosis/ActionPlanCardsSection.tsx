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
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">trending_up</span>
        <h2 className="text-[24px] font-bold text-[#111827]">{REPORT_HEADING_ACTION_PLAN}</h2>
      </div>
      <div className="flex flex-col gap-4">
        {plans.map((plan) => (
          <ActionPlanCard key={plan.num} plan={plan} />
        ))}
      </div>
    </div>
  );
}
