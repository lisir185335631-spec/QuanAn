import { useRef, useEffect, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

import { STEP1_INDUSTRIES_56 } from '@/lib/constants/industries';
import {
  TRENDING_FILTER_INDUSTRY_LABEL,
  TRENDING_IND_SEARCH_PLACEHOLDER,
  TRENDING_IND_TABS,
  TRENDING_IND_TOTAL_TPL,
} from '@/lib/constants/trending';

import type { Industry } from '@/lib/constants/industries';

interface Props {
  selected: Industry;
  onSelect: (id: string) => void;
}

export function TrendingIndustryDropdown({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const categoryMap: Record<string, string> = {
    life: '生活服务',
    ecom: '电商零售',
    create: '内容创作',
    pro: '专业服务',
    mfg: '产业制造',
  };

  const filtered = STEP1_INDUSTRIES_56.filter((ind) => {
    const matchTab = activeTab === 'all' || ind.category === categoryMap[activeTab];
    const matchQuery = query
      ? ind.label.includes(query) || (ind.keywords ?? []).some((k) => k.includes(query))
      : true;
    return matchTab && matchQuery;
  });

  return (
    <div className="relative" ref={ref}>
      <p className="font-cn text-sm text-muted-foreground mb-2">{TRENDING_FILTER_INDUSTRY_LABEL}</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full rounded-lg border border-primary/30 bg-card px-4 py-3 font-cn text-sm text-on-surface"
      >
        <span>{selected.emoji} {selected.label}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
      </button>

      {open && (
        <div className="rounded-xl border border-primary/40 bg-card p-4 shadow-xl absolute top-full mt-2 left-0 w-[480px] z-20">
          {/* search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={TRENDING_IND_SEARCH_PLACEHOLDER}
              className="w-full rounded-lg border-border bg-input pl-9 pr-3 py-2 font-cn text-sm text-on-surface placeholder:text-muted-foreground/60 outline-none"
            />
          </div>

          {/* chip tabs */}
          <div className="flex gap-2 flex-wrap mb-3">
            {TRENDING_IND_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1 font-cn text-xs transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:bg-primary/10'
                }`}
              >
                {tab.emoji ? `${tab.emoji} ` : ''}{tab.label}
              </button>
            ))}
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto">
            {filtered.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => {
                  onSelect(ind.id);
                  setOpen(false);
                  setQuery('');
                }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 font-cn text-sm text-left transition-colors hover:bg-primary/10 ${
                  selected.id === ind.id
                    ? 'bg-primary/10 border border-primary text-primary'
                    : 'text-on-surface'
                }`}
              >
                <span>{ind.emoji}</span>
                <span>{ind.label}</span>
              </button>
            ))}
          </div>

          {/* footer count */}
          <p className="text-right font-cn text-xs text-muted-foreground mt-3">
            {TRENDING_IND_TOTAL_TPL(STEP1_INDUSTRIES_56.length)}
          </p>
        </div>
      )}
    </div>
  );
}
