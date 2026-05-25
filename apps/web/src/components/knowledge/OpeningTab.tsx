/**
 * OpeningTab — Tab 3 · search + count + 3 col grid 23 OpeningCard
 * SPEC §9
 */

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';
import { OPENING_FORMULAS } from '@/lib/constants/openingFormulas';

import { OpeningCard } from './OpeningCard';

export function OpeningTab() {
  const [search, setSearch] = useState('');

  const lowerQuery = search.trim().toLowerCase();
  const filtered = lowerQuery
    ? OPENING_FORMULAS.filter(
        (f) =>
          f.name.toLowerCase().includes(lowerQuery) ||
          f.formula.toLowerCase().includes(lowerQuery)
      )
    : OPENING_FORMULAS;

  return (
    <div className="space-y-4" data-testid="opening-tab">
      {/* search row */}
      <div className="flex items-center justify-between gap-4">
        <Input
          type="text"
          placeholder={KNOWLEDGE_PAGE.searchPlaceholders.opening}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
          data-testid="opening-search"
        />
        <span className="text-sm text-muted-foreground shrink-0" data-testid="opening-count">
          {KNOWLEDGE_PAGE.countText.opening(OPENING_FORMULAS.length, filtered.length)}
        </span>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f) => (
          <OpeningCard key={f.num} formula={f} />
        ))}
      </div>
    </div>
  );
}
