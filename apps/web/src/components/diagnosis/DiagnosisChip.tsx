import { Stethoscope } from 'lucide-react';

import { DIAGNOSIS_CHIP_LABEL } from '@/lib/constants/diagnosis';

export function DiagnosisChip() {
  return (
    <div
      data-testid="diagnosis-chip"
      className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-card px-4 py-2"
    >
      <Stethoscope className="w-4 h-4 text-primary" />
      <span className="text-sm text-primary">{DIAGNOSIS_CHIP_LABEL}</span>
    </div>
  );
}
