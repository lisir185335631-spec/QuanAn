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
      className="flex items-start gap-4 rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-[#eff4ff] to-white p-5 pw-shadow-soft"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#002fa7] to-[#3654c8] shrink-0 shadow-md shadow-[#002fa7]/20">
        <span className="text-[13px] font-bold text-white">{plan.num}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <p className="text-[15px] font-medium text-[#111827]">{plan.title}</p>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1 text-[12px] text-[#6b7280]">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">category</span>
            {REPORT_LABEL_DIMENSION_PREFIX}{plan.dimension}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#002fa7]">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">schedule</span>
            {REPORT_LABEL_DEADLINE_PREFIX}{plan.deadline}
          </span>
        </div>
      </div>
    </div>
  );
}
