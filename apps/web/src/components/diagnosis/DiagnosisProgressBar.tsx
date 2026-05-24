import { cn } from '@/lib/utils';

interface DiagnosisProgressBarProps {
  currentStep: number; // 0-indexed (0 = step 1 lit)
  totalSteps: number;  // 8
}

export function DiagnosisProgressBar({ currentStep, totalSteps }: DiagnosisProgressBarProps) {
  return (
    <div data-testid="diagnosis-progress-bar" className="flex gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 h-1 rounded-full transition-colors',
            i <= currentStep ? 'bg-primary' : 'bg-muted/30',
          )}
        />
      ))}
    </div>
  );
}
