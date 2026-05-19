import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SCRIPT_TYPES } from '@/lib/constants/scripts';

export interface ScriptTypeInlineCardsProps {
  value: string | null;
  onChange: (key: string) => void;
  disabled?: boolean;
  showSearch?: boolean;
  showMethodology?: boolean;
}

export function ScriptTypeInlineCards({
  value,
  onChange,
  disabled = false,
  showSearch = false,
  showMethodology = false,
}: ScriptTypeInlineCardsProps) {
  const [query, setQuery] = useState('');

  const lowerQuery = query.trim().toLowerCase();
  const filtered = lowerQuery
    ? SCRIPT_TYPES.filter(
        (s) =>
          s.label.toLowerCase().includes(lowerQuery) ||
          s.desc.toLowerCase().includes(lowerQuery)
      )
    : SCRIPT_TYPES;

  return (
    <div className="space-y-3">
      {showSearch && (
        <Input
          type="text"
          placeholder="搜索脚本类型..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((s) => {
          const isSelected = s.key === value;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => !disabled && onChange(s.key)}
              disabled={disabled}
              className={cn(
                'rounded-lg p-3 text-left border transition-all',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/40',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="block text-3xl">{s.emoji}</span>
              <span className="block font-display font-bold text-sm mt-1">{s.label}</span>
              <span className="block text-sm text-muted-foreground mt-1 line-clamp-2">{s.desc}</span>
              {showMethodology && (
                <span
                  data-testid={`methodology-${s.key}`}
                  className="block text-xs text-muted-foreground mt-2"
                >
                  {s.methodology}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
