/**
 * ElementsTab — Tab 2 · 4 filter chip(全部/经典/情绪/内容/转化) + count + 3 col grid 23 ElementCard
 * SPEC §9
 */

import { useState } from 'react';

import { ELEMENT_DETAILS } from '@/lib/constants/elementDetails';
import { HOT_ELEMENT_GROUPS, ALL_ELEMENTS } from '@/lib/constants/elements';
import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';
import { cn } from '@/lib/utils';

import { ElementCard } from './ElementCard';

type FilterKey = 'all' | 'classic' | 'emotion' | 'content' | 'conversion';

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all',        label: KNOWLEDGE_PAGE.filterChips.all },
  { key: 'classic',   label: KNOWLEDGE_PAGE.filterChips.classic },
  { key: 'emotion',   label: KNOWLEDGE_PAGE.filterChips.emotion },
  { key: 'content',   label: KNOWLEDGE_PAGE.filterChips.content },
  { key: 'conversion',label: KNOWLEDGE_PAGE.filterChips.conversion },
];

// Build a lookup: elementKey → groupLabel
const ELEMENT_GROUP_LABEL: Record<string, string> = {};
for (const group of HOT_ELEMENT_GROUPS) {
  for (const item of group.items) {
    ELEMENT_GROUP_LABEL[item.key] = group.label;
  }
}

// Build group key lookup: elementKey → groupKey
const ELEMENT_GROUP_KEY: Record<string, string> = {};
for (const group of HOT_ELEMENT_GROUPS) {
  for (const item of group.items) {
    ELEMENT_GROUP_KEY[item.key] = group.key;
  }
}

export function ElementsTab() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filtered =
    activeFilter === 'all'
      ? ALL_ELEMENTS
      : ALL_ELEMENTS.filter((item) => ELEMENT_GROUP_KEY[item.key] === activeFilter);

  return (
    <div className="space-y-4" data-testid="elements-tab">
      {/* filter chips row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              data-testid={`elements-filter-${chip.key}`}
              onClick={() => setActiveFilter(chip.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-colors',
                activeFilter === chip.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground shrink-0" data-testid="elements-count">
          {KNOWLEDGE_PAGE.countText.elements(ALL_ELEMENTS.length, filtered.length)}
        </span>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const detail = ELEMENT_DETAILS[item.key];
          if (!detail) return null;
          return (
            <ElementCard
              key={item.key}
              item={item}
              groupLabel={ELEMENT_GROUP_LABEL[item.key] ?? ''}
              detail={detail}
            />
          );
        })}
      </div>
    </div>
  );
}
