/**
 * ScriptTab — Tab 1 · search input + 共/显示 count + 3 col grid 20 ScriptCard
 * SPEC §9
 */

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';
import { SCRIPT_TYPES } from '@/lib/constants/scripts';

import { ScriptCard } from './ScriptCard';

export function ScriptTab() {
  const [search, setSearch] = useState('');

  const lowerQuery = search.trim().toLowerCase();
  const filtered = lowerQuery
    ? SCRIPT_TYPES.filter(
        (s) =>
          s.label.toLowerCase().includes(lowerQuery) ||
          s.desc.toLowerCase().includes(lowerQuery)
      )
    : SCRIPT_TYPES;

  return (
    <div className="space-y-4" data-testid="script-tab">
      {/* search row */}
      <div className="flex items-center justify-between gap-4">
        <Input
          type="text"
          placeholder={KNOWLEDGE_PAGE.searchPlaceholders.scripts}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
          data-testid="script-search"
        />
        <span className="text-sm text-muted-foreground shrink-0" data-testid="script-count">
          {KNOWLEDGE_PAGE.countText.scripts(SCRIPT_TYPES.length, filtered.length)}
        </span>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s, i) => (
          <ScriptCard key={s.key} script={s} index={i} />
        ))}
      </div>
    </div>
  );
}
