/**
 * CoreCard — 单 core card
 * name + 收藏/复制 + flow chips horizontal(ArrowRight 连) + 实战案例 + example quote + 用这个公式生成文案 btn
 * SPEC §9
 */

import { ArrowRight, FileText, Sparkles, StarOff } from 'lucide-react';
import { toast } from 'sonner';

import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';
import type { CoreFormula } from '@/lib/constants/coreFormulas';

interface CoreCardProps {
  formula: CoreFormula;
  index: number;
}

export function CoreCard({ formula, index }: CoreCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-3"
      data-testid={`core-card-${index}`}
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-display font-bold text-sm leading-snug flex-1 min-w-0">
          {formula.name}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="收藏"
            data-testid={`core-bookmark-${index}`}
            onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <StarOff className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            aria-label="复制"
            data-testid={`core-copy-${index}`}
            onClick={() => {
              void navigator.clipboard.writeText(formula.name);
              toast.success(KNOWLEDGE_PAGE.toasts.copied);
            }}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* flow chips */}
      <div className="flex items-center gap-1 flex-wrap">
        {formula.flow.map((step, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-md border border-border text-xs text-primary font-medium">
              {step}
            </span>
            {i < formula.flow.length - 1 && (
              <ArrowRight className="w-3 h-3 text-primary shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* example quote */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">实战案例</p>
        <blockquote className="text-sm text-muted-foreground italic rounded-md bg-card/40 border border-border px-3 py-2">
          {formula.example}
        </blockquote>
      </div>

      {/* generate btn */}
      <button
        type="button"
        data-testid={`core-generate-${index}`}
        onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.generate)}
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        用这个公式生成文案
      </button>
    </div>
  );
}
