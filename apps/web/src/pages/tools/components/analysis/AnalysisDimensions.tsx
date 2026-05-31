// AnalysisDimensions.tsx — 多维度评分 · 5 score bar(2 col · 高分绿条)

import { BarChart3 } from 'lucide-react';

import { ANALYSIS_DIMENSIONS, ANALYSIS_DIMENSIONS_TITLE } from '@/lib/constants/analysis';

function barColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function AnalysisDimensions() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-on-surface">
        <BarChart3 className="h-5 w-5 text-primary" />
        {ANALYSIS_DIMENSIONS_TITLE}
      </h2>
      <div className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
        {ANALYSIS_DIMENSIONS.map((d) => (
          <div key={d.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-cn text-sm text-muted-foreground">{d.label}</span>
              <span className="font-display text-sm font-bold text-on-surface">{d.score}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/40">
              <div
                className={`h-full rounded-full ${barColor(d.score)}`}
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
