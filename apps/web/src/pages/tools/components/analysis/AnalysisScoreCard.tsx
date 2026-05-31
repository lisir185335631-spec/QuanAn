// AnalysisScoreCard.tsx — 综合评分 big number

import { ANALYSIS_OVERALL_LABEL, ANALYSIS_OVERALL_SCORE } from '@/lib/constants/analysis';

export function AnalysisScoreCard() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-primary/20 bg-card py-12">
      <div className="font-display text-7xl md:text-8xl font-bold text-primary">
        {ANALYSIS_OVERALL_SCORE}
      </div>
      <div className="mt-2 font-cn text-base text-muted-foreground">{ANALYSIS_OVERALL_LABEL}</div>
    </div>
  );
}
