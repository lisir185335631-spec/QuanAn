import { DIAGNOSIS_H1, DIAGNOSIS_SUBTITLE } from '@/lib/constants/diagnosis';

import { DiagnosisChip } from './DiagnosisChip';
import { DiagnosisProgressBar } from './DiagnosisProgressBar';

interface DiagnosisHeaderProps {
  currentStep: number; // 0-indexed
  totalSteps: number;  // 8
}

export function DiagnosisHeader({ currentStep, totalSteps }: DiagnosisHeaderProps) {
  return (
    <div data-testid="diagnosis-header" className="flex flex-col items-center gap-4 mb-8">
      <DiagnosisChip />
      <h1 className="text-4xl md:text-5xl font-bold text-on-surface font-display text-center">
        {DIAGNOSIS_H1}
      </h1>
      <p className="text-base text-muted-foreground text-center">{DIAGNOSIS_SUBTITLE}</p>
      <div className="w-full mt-2">
        <DiagnosisProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </div>
    </div>
  );
}
