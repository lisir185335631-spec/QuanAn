import { Sparkles } from 'lucide-react';

import type { Industry } from '@/lib/constants/industries';
import {
  STEP1_BANNER_KW_PREFIX,
  STEP1_BANNER_PREFIX,
  STEP1_CUSTOM_TAG,
  STEP1_PAGE_CTA,
} from '@/lib/constants/industries';

interface Step1BannerProps {
  industry?: Industry;
  customLabel?: string;
  onConfirm: () => void;
}

export function Step1Banner({ industry, customLabel, onConfirm }: Step1BannerProps) {
  const emoji = industry?.emoji ?? '✨';
  const label = industry?.label ?? customLabel ?? '';
  const displayLabel = customLabel ? `${label}${STEP1_CUSTOM_TAG}` : label;
  const keywords = industry?.keywords;

  return (
    <div className="mt-6 mb-6 rounded-xl border border-primary/40 bg-primary/5 p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{emoji}</span>
        <div>
          <p className="font-cn text-base text-on-surface">
            {STEP1_BANNER_PREFIX}{displayLabel}
          </p>
          {keywords && keywords.length > 0 && (
            <p className="font-cn text-sm text-muted-foreground/80">
              {STEP1_BANNER_KW_PREFIX}{keywords.join('、')}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        data-testid="step1-banner-cta"
        className="bg-primary text-on-primary hover:bg-primary/90 rounded-lg px-6 py-3 font-cn font-bold flex items-center gap-2 whitespace-nowrap"
      >
        <Sparkles size={14} />
        {STEP1_PAGE_CTA}
      </button>
    </div>
  );
}
