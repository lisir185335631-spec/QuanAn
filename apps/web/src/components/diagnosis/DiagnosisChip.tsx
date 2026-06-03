import { DIAGNOSIS_CHIP_LABEL } from '@/lib/constants/diagnosis';

export function DiagnosisChip() {
  return (
    <div
      data-testid="diagnosis-chip"
      className="inline-flex items-center gap-2 rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1"
    >
      <span className="material-symbols-outlined text-[16px] text-[#221b00]" aria-hidden="true">monitor_heart</span>
      <span className="text-[12px] font-bold uppercase tracking-widest text-[#221b00]">{DIAGNOSIS_CHIP_LABEL}</span>
    </div>
  );
}
