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
              ? 'opacity-100'
              : i === currentStep
                ? 'opacity-70'
                : '',
          )}
          style={
            i <= currentStep
              ? { background: 'linear-gradient(110deg, #2B53E6 0%, #7A3BE0 52%, #EF3E6B 100%)' }
              : { background: 'rgba(255,255,255,0.12)' }
          }
        />
      ))}
    </div>
  );
}
