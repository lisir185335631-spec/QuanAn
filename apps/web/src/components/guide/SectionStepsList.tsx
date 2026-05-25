import type { SectionStep } from '@/lib/constants/guide';

interface SectionStepsListProps {
  steps: ReadonlyArray<SectionStep>;
}

export function SectionStepsList({ steps }: SectionStepsListProps) {
  return (
    <ol data-testid="section-steps-list" className="space-y-3">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="font-display text-xs font-black text-black select-none">
              {i + 1}
            </span>
          </div>
          <div className="flex-1 pt-1">
            <p className="font-cn text-sm font-bold text-foreground">{step.title}</p>
            <p className="font-cn text-xs text-muted-foreground mt-1 whitespace-pre-line">
              {step.desc}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
