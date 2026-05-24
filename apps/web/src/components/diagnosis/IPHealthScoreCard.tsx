import { Ban, Square } from 'lucide-react';

import {
  REPORT_LABEL_SCORE_TOTAL,
} from '@/lib/constants/diagnosis';

interface DimensionScore {
  id: string;
  shortLabel: string;
  radarLabel: string;
  score: number;
}

interface IPHealthScoreCardProps {
  scores: ReadonlyArray<DimensionScore>;
  overallScore: number;
}

export function IPHealthScoreCard({ scores, overallScore }: IPHealthScoreCardProps) {
  const maxScore = 10;

  return (
    <div
      data-testid="ip-health-score-card"
      className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4"
    >
      <div className="flex flex-col items-center gap-2">
        <Ban className="w-16 h-16 text-destructive" />
        <p className="text-base text-muted-foreground">{REPORT_LABEL_SCORE_TOTAL}</p>
        <p className="text-4xl font-bold text-on-surface">{overallScore}</p>
      </div>
      <div className="flex flex-col gap-3 mt-2">
        {scores.map((dim) => (
          <div key={dim.id} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-16 shrink-0">{dim.shortLabel}</span>
            <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${maxScore > 0 ? (dim.score / maxScore) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm text-muted-foreground">{dim.score}</span>
              <Square className="w-3 h-3 text-destructive" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
