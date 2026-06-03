import { DIAGNOSIS_H1, DIAGNOSIS_SUBTITLE } from '@/lib/constants/diagnosis';

import { DiagnosisChip } from './DiagnosisChip';
import { DiagnosisProgressBar } from './DiagnosisProgressBar';

interface DiagnosisHeaderProps {
  currentStep: number; // 0-indexed
  totalSteps: number;  // 8
}

export function DiagnosisHeader({ currentStep, totalSteps }: DiagnosisHeaderProps) {
  return (
    <div data-testid="diagnosis-header" className="mb-10">
      {/* 双徽标 chrome */}
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
          智能引擎
        </span>
        <DiagnosisChip />
      </div>
      {/* H1 */}
      <h1 className="text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
        {DIAGNOSIS_H1}
      </h1>
      <p className="mt-2 text-[16px] leading-relaxed text-[#444653]">{DIAGNOSIS_SUBTITLE}</p>
      {/* 进度条 */}
      <div className="mt-6">
        <DiagnosisProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </div>
    </div>
  );
}
