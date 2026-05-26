import { ChevronUp } from 'lucide-react';

import {
  BOOM_ANALYSIS_TITLE,
  BOOM_ANALYSIS_TAG,
  BOOM_ANALYSIS_BODY,
  BOOM_BEST_PRACTICE_LABEL,
  BOOM_BEST_PRACTICE,
  BOOM_AVOID_LIST,
} from '@/lib/constants/boomGenerate';

export function BoomAnalysis() {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 mt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg font-bold text-on-surface">{BOOM_ANALYSIS_TITLE}</h3>
          <span className="rounded-full border border-destructive/60 bg-destructive/10 px-3 py-1 text-xs font-cn font-bold text-destructive">
            {BOOM_ANALYSIS_TAG}
          </span>
        </div>
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </div>

      <p className="mt-4 font-cn text-sm text-muted-foreground leading-relaxed">{BOOM_ANALYSIS_BODY}</p>

      <p className="mt-4 font-cn text-sm leading-relaxed">
        <span className="font-bold text-primary">{BOOM_BEST_PRACTICE_LABEL}</span>
        <span className="text-muted-foreground">{BOOM_BEST_PRACTICE}</span>
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        {BOOM_AVOID_LIST.map((text) => (
          <span
            key={text}
            className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1.5 font-cn text-xs text-destructive"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
