import { ArrowRight } from 'lucide-react';

import {
  STEP1_CUSTOM_TAG,
  STEP1_PAGE_CTA,
  STEP1_STICKY_PREFIX,
} from '@/lib/constants/industries';

interface Step1StickyBarProps {
  selectedEmoji: string;
  selectedLabel: string;
  isCustom: boolean;
  onConfirm: () => void;
}

export function Step1StickyBar({
  selectedEmoji,
  selectedLabel,
  isCustom,
  onConfirm,
}: Step1StickyBarProps) {
  const displayLabel = isCustom ? `${selectedLabel}${STEP1_CUSTOM_TAG}` : selectedLabel;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-cn text-sm text-muted-foreground">{STEP1_STICKY_PREFIX}</span>
          <span className="text-xl">{selectedEmoji}</span>
          <span className="font-cn text-base font-bold text-on-surface">{displayLabel}</span>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          data-testid="step1-sticky-cta"
          className="bg-primary text-on-primary hover:bg-primary/90 rounded-lg px-6 py-2.5 font-cn font-bold flex items-center gap-2 whitespace-nowrap"
        >
          <ArrowRight size={14} />
          {STEP1_PAGE_CTA}
        </button>
      </div>
    </div>
  );
}
