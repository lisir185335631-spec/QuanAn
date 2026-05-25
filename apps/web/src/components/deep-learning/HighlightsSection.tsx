/**
 * HighlightsSection.tsx — 精华片段 (N) section
 */
import { DL_SECTION_HIGHLIGHTS_PREFIX } from '@/lib/constants/deep-learning';

interface HighlightsSectionProps {
  quotes: ReadonlyArray<string>;
}

export function HighlightsSection({ quotes }: HighlightsSectionProps) {
  return (
    <div data-testid="highlights-section" className="space-y-3">
      <p className="text-sm font-bold text-primary">
        {DL_SECTION_HIGHLIGHTS_PREFIX} ({quotes.length})
      </p>
      <div className="space-y-3">
        {quotes.map((quote, i) => (
          <p
            key={i}
            data-testid={`highlight-quote-${i}`}
            className="text-sm text-muted-foreground italic pl-3 border-l-2 border-primary/30 leading-relaxed"
          >
            {quote}
          </p>
        ))}
      </div>
    </div>
  );
}
