import type { DimensionDetailData } from '@/lib/constants/diagnosis';
import { REPORT_HEADING_DETAILED } from '@/lib/constants/diagnosis';

import { DimensionDetailBlock } from './DimensionDetailBlock';

interface DetailedReportSectionProps {
  intro: string;
  reportH2: string;
  verdictLead: string;
  verdictBody: string;
  details: ReadonlyArray<DimensionDetailData>;
}

export function DetailedReportSection({
  intro,
  reportH2,
  verdictLead,
  verdictBody,
  details,
}: DetailedReportSectionProps) {
  return (
    <div
      data-testid="detailed-report-section"
      className="rounded-xl p-6 flex flex-col gap-6 pw-shadow-soft"
      style={{
        border: '1px solid rgba(22,32,72,0.13)',
        background: 'linear-gradient(135deg, #F3F5FC, #FFFFFF)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: '#2B53E6' }}>stethoscope</span>
        <span className="text-[18px] font-bold" style={{ color: '#161D33' }}>{REPORT_HEADING_DETAILED}</span>
      </div>
      <p className="text-[15px] text-[#444653]">{intro}</p>
      <h2 className="text-[24px] font-bold" style={{ color: '#161D33' }}>{reportH2}</h2>
      <p className="text-[15px] text-[#444653]">
        <span className="font-bold" style={{ color: '#161D33' }}>{verdictLead}</span>
        {verdictBody}
      </p>
      <div className="flex flex-col gap-8">
        {details.map((detail) => (
          <DimensionDetailBlock key={detail.num} detail={detail} />
        ))}
      </div>
    </div>
  );
}
