import { useState } from 'react';

import { EmptyState } from '@/components/states';
import {
  STEP1_INDUSTRIES_56,
  STEP1_SEARCH_PLACEHOLDER,
  STEP1_TABS,
} from '@/lib/constants/industries';

// D1=A 字面锁 — 来源 aiipznt-spec.md §7.1
const STEP1_LABEL = 'STEP 01 · 选择行业赛道' as const;
const STEP1_H1 = '选择你的行业赛道' as const;
const STEP1_SUBTITLE = '覆盖抖音、视频号等主流平台的 56+ 个细分行业。你也可以自定义输入行业。' as const;

export default function Step1() {
  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTab = STEP1_TABS.find((t) => t.id === activeTabId) ?? STEP1_TABS[0]!;

  // AC-5: tab filter first
  const tabFiltered =
    activeTabId === 'all'
      ? STEP1_INDUSTRIES_56
      : STEP1_INDUSTRIES_56.filter((ind) => ind.category === activeTab.label);

  // AC-6: search filter on top of tab filter
  const filteredIndustries = searchQuery.trim()
    ? tabFiltered.filter(
        (ind) =>
          ind.label.includes(searchQuery) ||
          (ind.keywords ?? []).some((kw) => kw.includes(searchQuery)),
      )
    : tabFiltered;

  return (
    <main className="flex-1 container py-8">
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP1_LABEL}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP1_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-6">{STEP1_SUBTITLE}</p>

      {/* AC-2: search box — placeholder from constant only */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={STEP1_SEARCH_PLACEHOLDER}
          className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* AC-3: 6 tabs, grid-cols-6, rendered from STEP1_TABS */}
      <div className="grid grid-cols-6 gap-2 mb-6">
        {STEP1_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabId(tab.id)}
            className={[
              'rounded-md px-2 py-2 text-body-sm text-center transition-colors',
              activeTabId === tab.id
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-surface-container text-muted-foreground border border-border hover:bg-surface-container-high',
            ].join(' ')}
          >
            {tab.emoji} {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* AC-7 / AC-4: empty state or industry grid */}
      {filteredIndustries.length === 0 ? (
        <EmptyState title="未找到匹配的行业" description="尝试自定义输入" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredIndustries.map((ind) => (
            <div
              key={ind.id}
              className="glass-card rounded-lg p-4 flex flex-col items-center text-center cursor-pointer hover:border-primary/40 transition-colors"
            >
              <span className="text-3xl mb-2">{ind.emoji}</span>
              <span className="text-body-sm font-cn text-on-surface">{ind.label}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
