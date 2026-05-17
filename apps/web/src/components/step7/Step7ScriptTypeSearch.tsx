import { memo, useState } from 'react';

import { Input } from '@/components/ui/input';
import {
  STEP7_SCRIPT_DISPLAY_TEMPLATE,
  STEP7_SCRIPT_TYPES_20,
  STEP7_SEARCH_PLACEHOLDER,
} from '@/lib/constants/step7';

interface Step7ScriptTypeSearchProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const Step7ScriptTypeSearch = memo(function Step7ScriptTypeSearch({
  selectedId,
  onSelect,
}: Step7ScriptTypeSearchProps) {
  const [query, setQuery] = useState('');

  const lowerQuery = query.trim().toLowerCase();
  const filtered = lowerQuery
    ? STEP7_SCRIPT_TYPES_20.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerQuery) ||
          s.positioning.toLowerCase().includes(lowerQuery)
      )
    : STEP7_SCRIPT_TYPES_20;

  const selected =
    STEP7_SCRIPT_TYPES_20.find((s) => s.id === selectedId) ?? STEP7_SCRIPT_TYPES_20[0]!;

  const displayText = STEP7_SCRIPT_DISPLAY_TEMPLATE.replace('{name}', selected.name).replace(
    '{positioning}',
    selected.positioning
  );

  return (
    <div className="space-y-3">
      <p className="text-body-xs text-primary">{displayText}</p>
      <Input
        type="text"
        placeholder={STEP7_SEARCH_PLACEHOLDER}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {filtered.map((s) => {
          const isSelected = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={[
                'rounded-md p-3 text-left border transition-all',
                isSelected
                  ? 'border-primary shadow-md bg-primary/10'
                  : 'border-border bg-surface-container hover:border-primary/40',
              ].join(' ')}
            >
              <p className="font-label text-body-sm text-on-surface">{s.name}</p>
              <p className="text-body-xs text-muted-foreground line-clamp-2 mt-1">
                {s.positioning}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
});
