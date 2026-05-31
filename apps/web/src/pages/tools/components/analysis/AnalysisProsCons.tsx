// AnalysisProsCons.tsx — 优点(绿) / 不足(红) · 2 col

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import {
  ANALYSIS_CONS,
  ANALYSIS_CONS_TITLE,
  ANALYSIS_PROS,
  ANALYSIS_PROS_TITLE,
} from '@/lib/constants/analysis';

export function AnalysisProsCons() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* 优点 */}
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-green-500">
          <CheckCircle2 className="h-5 w-5" />
          {ANALYSIS_PROS_TITLE}
        </h2>
        <ul className="space-y-3">
          {ANALYSIS_PROS.map((p) => (
            <li key={p} className="flex gap-2 font-cn text-sm leading-relaxed text-muted-foreground">
              <span className="text-green-500">+</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* 不足 */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-red-500">
          <AlertTriangle className="h-5 w-5" />
          {ANALYSIS_CONS_TITLE}
        </h2>
        <ul className="space-y-3">
          {ANALYSIS_CONS.map((c) => (
            <li key={c} className="flex gap-2 font-cn text-sm leading-relaxed text-muted-foreground">
              <span className="text-red-500">−</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
