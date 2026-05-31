// AnalysisSuggestions.tsx — 优化建议 · 金色 numbered list

import { Lightbulb } from 'lucide-react';

import { ANALYSIS_SUGGESTIONS, ANALYSIS_SUGGESTIONS_TITLE } from '@/lib/constants/analysis';

export function AnalysisSuggestions() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-primary">
        <Lightbulb className="h-5 w-5" />
        {ANALYSIS_SUGGESTIONS_TITLE}
      </h2>
      <ol className="space-y-4">
        {ANALYSIS_SUGGESTIONS.map((s, i) => (
          <li key={s} className="flex gap-3 font-cn text-sm leading-relaxed text-muted-foreground">
            <span className="font-display font-bold text-primary">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
