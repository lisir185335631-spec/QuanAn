/**
 * CoreTab — Tab 4 · search + count + 3 col grid 23 CoreCard
 * SPEC §9
 */

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { CORE_FORMULAS } from '@/lib/constants/coreFormulas';
import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';

import { CoreCard } from './CoreCard';

export function CoreTab() {
  const [search, setSearch] = useState('');

  const lowerQuery = search.trim().toLowerCase();
  const filtered = lowerQuery
    ? CORE_FORMULAS.filter((f) => f.name.toLowerCase().includes(lowerQuery))
    : CORE_FORMULAS;

  return (
    <div className="space-y-4" data-testid="core-tab">
      {/* search row */}
      <div className="flex items-center justify-between gap-4">
        <Input
          type="text"
          placeholder={KNOWLEDGE_PAGE.searchPlaceholders.core}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
          data-testid="core-search"
        />
        <span className="text-sm text-muted-foreground shrink-0" data-testid="core-count">
          {KNOWLEDGE_PAGE.countText.core(CORE_FORMULAS.length, filtered.length)}
        </span>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f, i) => (
          <CoreCard key={f.name} formula={f} index={i} />
        ))}
      </div>
    </div>
  );
}
