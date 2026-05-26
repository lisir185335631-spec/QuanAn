import { RefreshCw } from 'lucide-react';

import {
  TRENDING_FETCH_BTN,
  TRENDING_FILTER_KEYWORDS_LABEL,
  TRENDING_FILTER_KEYWORDS_PLACEHOLDER,
} from '@/lib/constants/trending';
import { TrendingIndustryDropdown } from './TrendingIndustryDropdown';
import { TrendingPlatformDropdown } from './TrendingPlatformDropdown';

import type { Industry } from '@/lib/constants/industries';

interface Props {
  industry: Industry;
  platformKey: string;
  keywords: string;
  onIndustryChange: (id: string) => void;
  onPlatformChange: (key: string) => void;
  onKeywordsChange: (v: string) => void;
  onFetch: () => void;
}

export function TrendingFilterCard({
  industry,
  platformKey,
  keywords,
  onIndustryChange,
  onPlatformChange,
  onKeywordsChange,
  onFetch,
}: Props) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] gap-4 items-end">
        {/* 字段 1 · 选择行业 */}
        <TrendingIndustryDropdown selected={industry} onSelect={onIndustryChange} />

        {/* 字段 2 · 筛选平台 */}
        <TrendingPlatformDropdown platformKey={platformKey} onSelect={onPlatformChange} />

        {/* 字段 3 · 自定义关键词 */}
        <div>
          <p className="font-cn text-sm text-muted-foreground mb-2">
            {TRENDING_FILTER_KEYWORDS_LABEL}
          </p>
          <input
            type="text"
            value={keywords}
            onChange={(e) => onKeywordsChange(e.target.value)}
            placeholder={TRENDING_FILTER_KEYWORDS_PLACEHOLDER}
            className="w-full rounded-lg border border-primary/30 bg-card px-4 py-3 font-cn text-sm text-on-surface placeholder:text-muted-foreground/60 outline-none"
          />
        </div>

        {/* 字段 4 · 抓取最新爆款 btn */}
        <button
          type="button"
          onClick={onFetch}
          className="bg-primary text-on-primary hover:bg-primary/90 rounded-lg px-6 py-3 font-cn font-bold flex items-center gap-2 whitespace-nowrap transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          {TRENDING_FETCH_BTN}
        </button>
      </div>
    </div>
  );
}
