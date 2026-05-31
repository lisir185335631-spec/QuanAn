// AnalysisElements.tsx — 识别到的爆款元素 · 10 金边 chip

import { ANALYSIS_ELEMENTS, ANALYSIS_ELEMENTS_TITLE } from '@/lib/constants/analysis';

export function AnalysisElements() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="mb-5 font-display text-xl font-bold text-on-surface">
        {ANALYSIS_ELEMENTS_TITLE}
      </h2>
      <div className="flex flex-wrap gap-3">
        {ANALYSIS_ELEMENTS.map((e) => (
          <span
            key={e}
            className="rounded-full border border-primary/40 bg-primary/5 px-4 py-2 font-cn text-sm text-primary"
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}
