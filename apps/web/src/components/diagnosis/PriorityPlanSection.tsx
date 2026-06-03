import type { PriorityStepData } from '@/lib/constants/diagnosis';
import {
  REPORT_HEADING_PRIORITY,
  REPORT_LABEL_EXEC_PREFIX,
} from '@/lib/constants/diagnosis';

interface PriorityPlanSectionProps {
  intro: string;
  steps: ReadonlyArray<PriorityStepData>;
}

export function PriorityPlanSection({ intro, steps }: PriorityPlanSectionProps) {
  return (
    <div
      data-testid="priority-plan-section"
      className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-5 pw-shadow-soft"
    >
      <h2 className="text-[24px] font-bold text-[#111827]">{REPORT_HEADING_PRIORITY}</h2>
      <p className="text-[15px] text-[#444653]">{intro}</p>
      <div className="flex flex-col gap-5">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-start gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#002fa7] text-[13px] font-bold text-white shadow-sm shadow-[#002fa7]/20">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="font-bold text-[#111827] text-[16px]">{step.title}</h3>
              <p className="text-[15px] text-[#444653]">
                <span className="font-bold text-[#002fa7]">{REPORT_LABEL_EXEC_PREFIX}</span>
                {step.exec}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
