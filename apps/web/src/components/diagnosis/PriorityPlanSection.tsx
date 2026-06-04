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
      className="rounded-xl p-6 flex flex-col gap-5 pw-shadow-soft ikb-hovercard"
      style={{
        border: '1px solid rgba(22,32,72,0.13)',
        background: 'linear-gradient(135deg, #F3F5FC, #FFFFFF)',
      }}
    >
      <h2 className="text-[24px] font-bold" style={{ color: '#161D33' }}>{REPORT_HEADING_PRIORITY}</h2>
      <p className="text-[15px] text-[#444653]">{intro}</p>
      <div className="flex flex-col gap-5">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-start gap-4">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white shadow-sm"
              style={{
                background: 'linear-gradient(110deg, #2B53E6 0%, #7A3BE0 52%, #EF3E6B 100%)',
                boxShadow: '0 4px 10px rgba(43,83,230,0.20)',
              }}
            >
              {i + 1}
            </span>
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="font-bold text-[16px]" style={{ color: '#161D33' }}>{step.title}</h3>
              <p className="text-[15px] text-[#444653]">
                <span className="font-bold" style={{ color: '#2B53E6' }}>{REPORT_LABEL_EXEC_PREFIX}</span>
                {step.exec}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
