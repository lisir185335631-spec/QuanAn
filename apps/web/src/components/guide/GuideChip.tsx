import { BookOpen } from 'lucide-react';

import { GUIDE_CHIP_SUBTITLE, GUIDE_CHIP_TITLE } from '@/lib/constants/guide';

export function GuideChip() {
  return (
    <div
      data-testid="guide-chip"
      className="rounded-xl border bg-card p-6 flex items-start gap-4"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <BookOpen className="w-6 h-6 text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <span
          data-testid="guide-chip-title"
          className="font-display text-3xl font-black text-primary tracking-wider uppercase"
        >
          {GUIDE_CHIP_TITLE}
        </span>
        <span
          data-testid="guide-chip-subtitle"
          className="font-cn text-sm text-muted-foreground"
        >
          {GUIDE_CHIP_SUBTITLE}
        </span>
      </div>
    </div>
  );
}
