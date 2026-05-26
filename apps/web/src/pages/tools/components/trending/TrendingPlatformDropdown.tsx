import { useRef, useEffect, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

import {
  TRENDING_FILTER_PLATFORM_LABEL,
  TRENDING_PLATFORM_ALL,
  TRENDING_PLATFORM_OPTIONS,
} from '@/lib/constants/trending';

interface Props {
  platformKey: string;
  onSelect: (key: string) => void;
}

export function TrendingPlatformDropdown({ platformKey, onSelect }: Props) {
  const [open, setOpen] = useState(false);
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

  const currentLabel =
    platformKey === 'all'
      ? TRENDING_PLATFORM_ALL
      : (TRENDING_PLATFORM_OPTIONS.find((p) => p.key === platformKey)?.label ?? TRENDING_PLATFORM_ALL);

  const currentEmoji =
    platformKey === 'all'
      ? ''
      : (TRENDING_PLATFORM_OPTIONS.find((p) => p.key === platformKey)?.emoji ?? '');

  return (
    <div className="relative" ref={ref}>
      <p className="font-cn text-sm text-muted-foreground mb-2">{TRENDING_FILTER_PLATFORM_LABEL}</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full rounded-lg border border-primary/30 bg-card px-4 py-3 font-cn text-sm text-on-surface"
      >
        <span>{currentEmoji ? `${currentEmoji} ` : ''}{currentLabel}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
      </button>

      {open && (
        <div className="rounded-xl border border-primary/40 bg-card p-2 shadow-xl absolute top-full mt-2 left-0 w-60 z-20">
          {/* 全部平台 option */}
          <button
            type="button"
            onClick={() => { onSelect('all'); setOpen(false); }}
            className="flex items-center justify-between w-full rounded-lg px-3 py-2 font-cn text-sm hover:bg-primary/10 text-on-surface"
          >
            <span>{TRENDING_PLATFORM_ALL}</span>
            {platformKey === 'all' && <Check className="h-4 w-4 text-primary" />}
          </button>

          {TRENDING_PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onSelect(opt.key); setOpen(false); }}
              className="flex items-center justify-between w-full rounded-lg px-3 py-2 font-cn text-sm hover:bg-primary/10 text-on-surface"
            >
              <span>{opt.emoji} {opt.label}</span>
              {platformKey === opt.key && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
