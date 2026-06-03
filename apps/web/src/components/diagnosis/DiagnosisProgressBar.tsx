import { cn } from '@/lib/utils';

interface DiagnosisProgressBarProps {
  currentStep: number; // 0-indexed (0 = step 1 lit)
  totalSteps: number;  // 8
}

export function DiagnosisProgressBar({ currentStep, totalSteps }: DiagnosisProgressBarProps) {
  return (
    <div
      data-testid="diagnosis-progress-bar"
      role="progressbar"
      aria-label="诊断进度"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      className="flex gap-2"
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 h-1.5 rounded-full transition-colors',
            i < currentStep
              ? 'bg-[#002fa7]'
              : i === currentStep
                ? 'bg-[#002fa7] opacity-70'
                : 'bg-[#e5e7eb]',
          )}
        />
      ))}
    </div>
  );
}
