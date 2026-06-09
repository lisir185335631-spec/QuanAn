import { C, F } from '@/components/home-next/ikb/system';
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
      className="lg-glass lg-spec rounded-xl p-6 flex flex-col gap-5"
    >
      <h2
        className="text-[24px] font-bold"
        style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
      >
        {REPORT_HEADING_PRIORITY}
      </h2>
      <p
        className="text-[15px]"
        style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}
      >
        {intro}
      </p>
      <div className="flex flex-col gap-5">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-start gap-4">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{
                background: 'linear-gradient(110deg, #2B53E6 0%, #7A3BE0 52%, #EF3E6B 100%)',
                boxShadow: '0 4px 10px rgba(43,83,230,0.30)',
              }}
            >
              {i + 1}
            </span>
            <div className="flex flex-col gap-1 flex-1">
              <h3
                className="font-bold text-[16px]"
                style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
              >
                {step.title}
              </h3>
              <p
                className="text-[15px]"
                style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}
              >
                <span className="font-bold" style={{ color: C.ikb }}>{REPORT_LABEL_EXEC_PREFIX}</span>
                {step.exec}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
