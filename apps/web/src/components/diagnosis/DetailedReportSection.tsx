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
      className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-6 pw-shadow-soft"
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">stethoscope</span>
        <span className="text-[18px] font-bold text-[#111827]">{REPORT_HEADING_DETAILED}</span>
      </div>
      <p className="text-[15px] text-[#444653]">{intro}</p>
      <h2 className="text-[24px] font-bold text-[#111827]">{reportH2}</h2>
      <p className="text-[15px] text-[#444653]">
        <span className="font-bold text-[#111827]">{verdictLead}</span>
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
