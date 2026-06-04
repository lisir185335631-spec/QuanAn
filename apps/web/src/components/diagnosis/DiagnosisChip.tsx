import { DIAGNOSIS_CHIP_LABEL } from '@/lib/constants/diagnosis';

export function DiagnosisChip() {
  return (
    <div
      data-testid="diagnosis-chip"
      className="inline-flex items-center gap-2 rounded-lg px-3 py-1"
      style={{
        border: '1px solid rgba(43,83,230,0.35)',
        background: 'linear-gradient(110deg, #2B53E6 0%, #7A3BE0 52%, #EF3E6B 100%)',
      }}
    >
      <span className="material-symbols-outlined text-[16px] text-white" aria-hidden={true}>monitor_heart</span>
      <span className="text-[12px] font-bold uppercase tracking-widest text-white">{DIAGNOSIS_CHIP_LABEL}</span>
    </div>
  );
}
