import { C, F } from '@/components/home-next/ikb/system';
import { DIAGNOSIS_CHIP_LABEL } from '@/lib/constants/diagnosis';

export function DiagnosisChip() {
  return (
    <div
      data-testid="diagnosis-chip"
      className="inline-flex items-center gap-2 rounded-lg px-3 py-1"
      style={{
        border: `1px solid ${C.line}`,
        background: 'rgba(216,232,255,0.14)',
      }}
    >
      <span className="material-symbols-outlined text-[16px]" aria-hidden={true} style={{ color: C.ikb, filter: 'drop-shadow(0 1px 4px rgba(5,12,34,.8))' }}>monitor_heart</span>
      <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>{DIAGNOSIS_CHIP_LABEL}</span>
    </div>
  );
}
