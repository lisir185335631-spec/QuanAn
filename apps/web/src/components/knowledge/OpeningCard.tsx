/**
 * OpeningCard — 单 opening card
 * num 序号圆(金 bg) + name + 收藏/复制 + 公式 label + formula + 示例 label + example quote
 * SPEC §9
 */

import { FileText, StarOff } from 'lucide-react';
import { toast } from 'sonner';

import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';
import type { OpeningFormula } from '@/lib/constants/openingFormulas';

interface OpeningCardProps {
  formula: OpeningFormula;
}

export function OpeningCard({ formula }: OpeningCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-3"
      data-testid={`opening-card-${formula.num}`}
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {formula.num}
          </span>
          <span className="font-display font-bold text-sm leading-snug">{formula.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="收藏"
            data-testid={`opening-bookmark-${formula.num}`}
            onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <StarOff className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            aria-label="复制"
            data-testid={`opening-copy-${formula.num}`}
            onClick={() => {
              void navigator.clipboard.writeText(formula.formula);
              toast.success(KNOWLEDGE_PAGE.toasts.copied);
            }}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* formula */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">公式</p>
        <p className="text-sm text-foreground">{formula.formula}</p>
      </div>

      {/* example */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">示例</p>
        <blockquote className="text-sm text-muted-foreground italic rounded-md bg-card/40 border border-border px-3 py-2">
          {formula.example}
        </blockquote>
      </div>
    </div>
  );
}
