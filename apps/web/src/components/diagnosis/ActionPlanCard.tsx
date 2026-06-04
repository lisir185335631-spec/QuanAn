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
      className="ikb-card flex items-start gap-4 rounded-xl p-5"
      style={{
        border: '1px solid rgba(43,83,230,0.18)',
        background: 'linear-gradient(135deg, #F3F5FC, #FFFFFF)',
      }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-md"
        style={{
          background: 'linear-gradient(110deg, #2B53E6 0%, #7A3BE0 52%, #EF3E6B 100%)',
          boxShadow: '0 4px 12px rgba(43,83,230,0.20)',
        }}
      >
        <span className="text-[13px] font-bold text-white">{plan.num}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <p className="text-[15px] font-medium text-[#161D33]">{plan.title}</p>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1 text-[12px] text-[#6b7280]">
            <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>category</span>
            {REPORT_LABEL_DIMENSION_PREFIX}{plan.dimension}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: '#2B53E6' }}>
            <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>schedule</span>
            {REPORT_LABEL_DEADLINE_PREFIX}{plan.deadline}
          </span>
        </div>
      </div>
    </div>
  );
}
