// AnalysisStructure.tsx — 结构拆解(起承转合) · accent 左边框 + 评分 + 可选类型 + 描述

import {
  ANALYSIS_STRUCTURE,
  ANALYSIS_STRUCTURE_TITLE,
  type AnalysisAccent,
} from '@/lib/constants/analysis';

// 静态 class 字符串(Tailwind JIT 需可静态扫描)
const ACCENT_BORDER: Record<AnalysisAccent, string> = {
  orange: 'border-l-orange-500',
  amber: 'border-l-amber-500',
  yellow: 'border-l-yellow-500',
  green: 'border-l-green-500',
};

export function AnalysisStructure() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="mb-6 font-display text-xl font-bold text-on-surface">
        {ANALYSIS_STRUCTURE_TITLE}
      </h2>
      <div className="space-y-4">
        {ANALYSIS_STRUCTURE.map((it) => (
          <div
            key={it.stage}
            className={`rounded-lg border-l-4 ${ACCENT_BORDER[it.accent]} bg-input/40 p-4`}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-base font-bold text-on-surface">{it.stage}</h3>
              <span className="shrink-0 font-display text-sm font-bold text-primary">
                {it.score}分
              </span>
            </div>
            {it.type && (
              <p className="mt-1 font-cn text-xs text-muted-foreground">类型：{it.type}</p>
            )}
            <p className="mt-2 font-cn text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
