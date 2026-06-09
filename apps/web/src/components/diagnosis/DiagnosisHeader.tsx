import { C, F } from '@/components/home-next/ikb/system';
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
        <span
          className="rounded-lg px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
          style={{
            border: `1px solid ${C.line}`,
            background: 'rgba(255,255,255,0.08)',
            color: C.ikb,
            textShadow: C.textShadow,
            fontFamily: F.cn,
          }}
        >
          智能引擎
        </span>
        <DiagnosisChip />
      </div>
      {/* H1 */}
      <h1
        className="ikb-gradtext text-[40px] font-extrabold tracking-tighter"
        style={{ textShadow: C.textShadow }}
      >
        {DIAGNOSIS_H1}
      </h1>
      <p
        className="mt-2 text-[16px] leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}
      >
        {DIAGNOSIS_SUBTITLE}
      </p>
      {/* 进度条 */}
      <div className="mt-6">
        <DiagnosisProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </div>
    </div>
  );
}
