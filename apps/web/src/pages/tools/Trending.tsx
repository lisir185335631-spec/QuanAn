/**
 * Trending.tsx — /tools/trending 全网爆款库
 * mock-first 1:1 复刻 sally aiipznt.vip/trending
 * 大筛选 card + 3 col grid · 9 sample card · no trpc · no KPI · no Table · no Drawer
 */

import { useMemo, useState } from 'react';

import { STEP1_INDUSTRIES_56 } from '@/lib/constants/industries';
import {
  TRENDING_DEFAULT_INDUSTRY_ID,
  TRENDING_FAKE_TOTAL,
  TRENDING_MOCK,
} from '@/lib/constants/trending';

import { TrendingFilterCard } from './components/trending/TrendingFilterCard';
import { TrendingGrid } from './components/trending/TrendingGrid';
import { TrendingHero } from './components/trending/TrendingHero';
import { TrendingSearchBar } from './components/trending/TrendingSearchBar';

export default function Trending() {
  const [industryId, setIndustryId] = useState<string>(TRENDING_DEFAULT_INDUSTRY_ID);
  const [platformKey, setPlatformKey] = useState<string>('all');
  const [keywords, setKeywords] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const industry = useMemo(
    () => STEP1_INDUSTRIES_56.find((i) => i.id === industryId) ?? STEP1_INDUSTRIES_56[0]!,
    [industryId],
  );

  const filtered = useMemo(() => {
    let list = [...TRENDING_MOCK];
    if (platformKey !== 'all') {
      list = list.filter((c) => c.platform === platformKey);
    }
    if (search.trim()) {
      list = list.filter(
        (c) => c.title.includes(search.trim()) || c.body.includes(search.trim()),
      );
    }
    return list;
  }, [platformKey, search]);

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <TrendingHero />
      <TrendingFilterCard
        industry={industry}
        platformKey={platformKey}
        keywords={keywords}
        onIndustryChange={setIndustryId}
        onPlatformChange={setPlatformKey}
        onKeywordsChange={setKeywords}
        onFetch={() => { /* mock-first no-op */ }}
      />
      <TrendingSearchBar value={search} onChange={setSearch} count={TRENDING_FAKE_TOTAL} />
      <TrendingGrid items={filtered} />
    </main>
  );
}
