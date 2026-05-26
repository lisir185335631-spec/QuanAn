/**
 * Monetization.tsx — /tools/monetization IP变现模型定制
 * mock-first · 2 col layout(左 form · 右 JSON raw 输出)
 * 2026-05-26 · 大改 · 删 trpc.monetization.generate / isFallback / 结构化 type
 */

import { useState } from 'react';

import {
  MONETIZATION_DEFAULT_AUDIENCE,
  MONETIZATION_DEFAULT_INDUSTRY_ID,
  MONETIZATION_DEFAULT_POSITIONING,
  MONETIZATION_DEFAULT_PRODUCT,
  MONETIZATION_MOCK,
} from '@/lib/constants/monetization';

import { MonetizationForm } from './components/monetization/MonetizationForm';
import { MonetizationHero } from './components/monetization/MonetizationHero';
import { MonetizationResult } from './components/monetization/MonetizationResult';

export default function Monetization() {
  const [industryId, setIndustryId] = useState<string>(MONETIZATION_DEFAULT_INDUSTRY_ID);
  const [product, setProduct] = useState<string>(MONETIZATION_DEFAULT_PRODUCT);
  const [audience, setAudience] = useState<string>(MONETIZATION_DEFAULT_AUDIENCE);
  const [positioning, setPositioning] = useState<string>(MONETIZATION_DEFAULT_POSITIONING);

  return (
    <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
      <MonetizationHero />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonetizationForm
          industryId={industryId}
          product={product}
          audience={audience}
          positioning={positioning}
          onIndustryChange={setIndustryId}
          onProductChange={setProduct}
          onAudienceChange={setAudience}
          onPositioningChange={setPositioning}
          onGenerate={() => { /* no-op · default mock 已显示 */ }}
        />
        <MonetizationResult mock={MONETIZATION_MOCK} />
      </div>
    </main>
  );
}
