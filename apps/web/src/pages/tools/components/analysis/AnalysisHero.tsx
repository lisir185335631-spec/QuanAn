// AnalysisHero.tsx — h1 + subtitle

import { ANALYSIS_H1, ANALYSIS_SUBTITLE } from '@/lib/constants/analysis';

export function AnalysisHero() {
  return (
    <header className="space-y-3">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface">
        {ANALYSIS_H1}
      </h1>
      <p className="font-cn text-base text-muted-foreground mt-3">{ANALYSIS_SUBTITLE}</p>
    </header>
  );
}
