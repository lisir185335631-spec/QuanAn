import { Stethoscope } from 'lucide-react';

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
      className="rounded-xl border border-border bg-card p-6 flex flex-col gap-6"
    >
      <div className="flex items-center gap-2">
        <Stethoscope className="w-5 h-5 text-primary" />
        <span className="text-base font-bold text-on-surface">{REPORT_HEADING_DETAILED}</span>
      </div>
      <p className="text-base text-muted-foreground">{intro}</p>
      <h2 className="text-2xl font-bold text-on-surface">{reportH2}</h2>
      <p className="text-base text-muted-foreground">
        <span className="font-bold text-on-surface">{verdictLead}</span>
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
