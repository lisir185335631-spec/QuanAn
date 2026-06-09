import { C, F } from '@/components/home-next/ikb/system';
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
      className="lg-glass lg-spec rounded-xl p-6 flex flex-col gap-6"
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-[20px]"
          aria-hidden={true}
          style={{ color: C.ikb, filter: 'drop-shadow(0 1px 4px rgba(5,12,34,.8))' }}
        >
          stethoscope
        </span>
        <span
          className="text-[18px] font-bold"
          style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
        >
          {REPORT_HEADING_DETAILED}
        </span>
      </div>
      <p
        className="text-[15px]"
        style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}
      >
        {intro}
      </p>
      <h2
        className="text-[24px] font-bold"
        style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
      >
        {reportH2}
      </h2>
      <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
        <span className="font-bold" style={{ color: C.ink }}>{verdictLead}</span>
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
