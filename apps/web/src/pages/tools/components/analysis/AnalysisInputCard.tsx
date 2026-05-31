// AnalysisInputCard.tsx — textarea(797 字默认) + 字数计数 + 开始分析 button

import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { ANALYSIS_CHAR_UNIT, ANALYSIS_CTA } from '@/lib/constants/analysis';

interface AnalysisInputCardProps {
  copy: string;
  onCopyChange: (v: string) => void;
}

export function AnalysisInputCard({ copy, onCopyChange }: AnalysisInputCardProps) {
  function handleAnalyze() {
    toast.success('分析完成');
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <textarea
        value={copy}
        onChange={(e) => onCopyChange(e.target.value)}
        className="w-full min-h-[280px] resize-y border-0 bg-transparent font-cn text-base leading-relaxed text-on-surface placeholder:text-muted-foreground/60 focus:outline-none"
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="font-cn text-sm text-muted-foreground">
          {copy.length} {ANALYSIS_CHAR_UNIT}
        </span>
        <button
          type="button"
          onClick={handleAnalyze}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-cn font-bold text-on-primary hover:bg-primary/90 transition-colors"
        >
          <Search className="h-4 w-4" />
          {ANALYSIS_CTA}
        </button>
      </div>
    </div>
  );
}
