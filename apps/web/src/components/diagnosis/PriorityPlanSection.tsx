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
      className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5"
    >
      <h2 className="text-2xl font-bold text-on-surface">{REPORT_HEADING_PRIORITY}</h2>
      <p className="text-base text-muted-foreground">{intro}</p>
      <div className="flex flex-col gap-5">
        {steps.map((step) => (
          <div key={step.num} className="flex flex-col gap-1">
            <h3 className="font-bold text-on-surface">{step.title}</h3>
            <p className="text-base text-muted-foreground">
              <span className="font-bold text-on-surface">{REPORT_LABEL_EXEC_PREFIX}</span>
              {step.exec}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
