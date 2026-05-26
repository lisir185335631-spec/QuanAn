// MonetizationForm.tsx — 左 form card · 4 字段 + CTA

import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import {
  MONETIZATION_CTA,
  MONETIZATION_DEFAULT_INDUSTRY_ID,
  MONETIZATION_FORM_TITLE,
  MONETIZATION_LABEL_AUDIENCE,
  MONETIZATION_LABEL_INDUSTRY,
  MONETIZATION_LABEL_POSITIONING,
  MONETIZATION_LABEL_PRODUCT,
} from '@/lib/constants/monetization';
import { STEP1_INDUSTRIES_56 } from '@/lib/constants/industries';

interface MonetizationFormProps {
  industryId: string;
  product: string;
  audience: string;
  positioning: string;
  onIndustryChange: (id: string) => void;
  onProductChange: (v: string) => void;
  onAudienceChange: (v: string) => void;
  onPositioningChange: (v: string) => void;
  onGenerate: () => void;
}

export function MonetizationForm({
  industryId,
  product,
  audience,
  positioning,
  onIndustryChange: _onIndustryChange,
  onProductChange,
  onAudienceChange,
  onPositioningChange,
  onGenerate,
}: MonetizationFormProps) {
  const selectedIndustry = STEP1_INDUSTRIES_56.find((i) => i.id === industryId)
    ?? STEP1_INDUSTRIES_56.find((i) => i.id === MONETIZATION_DEFAULT_INDUSTRY_ID)!;

  function handleDropdownClick() {
    toast.info('即将上线');
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="font-display text-xl font-bold mb-6 text-on-surface">
        {MONETIZATION_FORM_TITLE}
      </h2>

      <div className="space-y-5">
        {/* 字段 1 · 选择行业 */}
        <div>
          <label className="block font-cn text-sm text-muted-foreground mb-2">
            {MONETIZATION_LABEL_INDUSTRY}
          </label>
          <button
            type="button"
            onClick={handleDropdownClick}
            className="flex w-full items-center justify-between rounded-lg border border-primary/30 bg-input px-4 py-3 font-cn text-sm text-on-surface"
          >
            <span>{selectedIndustry.emoji} {selectedIndustry.label}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* 字段 2 · 产品/服务描述 * */}
        <div>
          <label className="block font-cn text-sm text-muted-foreground mb-2">
            {MONETIZATION_LABEL_PRODUCT}{' '}
            <span className="text-destructive">*</span>
          </label>
          <textarea
            value={product}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full min-h-[100px] rounded-lg border border-primary/30 bg-input px-4 py-3 font-cn text-sm placeholder:text-muted-foreground/60 text-on-surface resize-y focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* 字段 3 · 目标受众（可选） */}
        <div>
          <label className="block font-cn text-sm text-muted-foreground mb-2">
            {MONETIZATION_LABEL_AUDIENCE}
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => onAudienceChange(e.target.value)}
            className="w-full rounded-lg border border-primary/30 bg-input px-4 py-3 font-cn text-sm placeholder:text-muted-foreground/60 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* 字段 4 · IP定位（可选） */}
        <div>
          <label className="block font-cn text-sm text-muted-foreground mb-2">
            {MONETIZATION_LABEL_POSITIONING}
          </label>
          <input
            type="text"
            value={positioning}
            onChange={(e) => onPositioningChange(e.target.value)}
            className="w-full rounded-lg border border-primary/30 bg-input px-4 py-3 font-cn text-sm placeholder:text-muted-foreground/60 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onGenerate}
          className="mt-2 w-full rounded-lg bg-primary px-4 py-3 font-cn font-bold text-on-primary hover:bg-primary/90 transition-colors"
        >
          {MONETIZATION_CTA}
        </button>
      </div>
    </div>
  );
}
