// PRD-29.15 · Step7 左列 · 脚本类型列表 + 搜索
import { useState } from 'react';

import { cn } from '@/lib/utils';

export interface Step7ScriptTypeItem {
  id: string;
  name: string;
  desc: string;
}

interface Step7ScriptTypeListProps {
  types: Step7ScriptTypeItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function Step7ScriptTypeList({
  types,
  selectedId,
  onSelect,
  className,
}: Step7ScriptTypeListProps) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? types.filter(
        (t) =>
          t.name.includes(query.trim()) ||
          t.desc.includes(query.trim()),
      )
    : types;

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold text-on-surface">选择脚本类型</h3>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索脚本..."
          className="w-full rounded-md border border-border bg-input pl-8 pr-3 py-2 text-sm text-on-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              'w-full text-left rounded-lg border px-4 py-3 transition-colors',
              t.id === selectedId
                ? 'border-primary/40 bg-primary/10'
                : 'border-border/40 hover:bg-card/50',
            )}
          >
            <p className="text-sm font-semibold text-on-surface">{t.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
