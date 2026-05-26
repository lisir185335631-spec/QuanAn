import { Search, SlidersHorizontal } from 'lucide-react';

import {
  TRENDING_COUNT_TPL,
  TRENDING_SEARCH_PLACEHOLDER,
} from '@/lib/constants/trending';

interface Props {
  value: string;
  onChange: (v: string) => void;
  count: number;
}

export function TrendingSearchBar({ value, onChange, count }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 mt-6">
      {/* search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={TRENDING_SEARCH_PLACEHOLDER}
          className="w-full rounded-lg border border-primary/30 bg-card pl-9 pr-4 py-3 font-cn text-sm text-on-surface placeholder:text-muted-foreground/60 outline-none"
        />
      </div>

      {/* count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-cn whitespace-nowrap">
        <SlidersHorizontal className="h-4 w-4" />
        {TRENDING_COUNT_TPL(count)}
      </div>
    </div>
  );
}
