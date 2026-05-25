/**
 * ElementCard — 单 element card
 * emoji + name + 收藏/复制 + group label chip(右) + desc + 使用技巧 3 bullet
 * SPEC §9
 */

import { FileText, StarOff } from 'lucide-react';
import { toast } from 'sonner';

import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';
import type { ElementDetail } from '@/lib/constants/elementDetails';
import type { ElementItem } from '@/lib/constants/elements';

interface ElementCardProps {
  item: ElementItem;
  groupLabel: string;
  detail: ElementDetail;
}

export function ElementCard({ item, groupLabel, detail }: ElementCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-3"
      data-testid={`element-card-${item.key}`}
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl shrink-0">{item.emoji}</span>
          <span className="font-display font-bold text-sm leading-snug">{item.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
            {groupLabel}
          </span>
          <button
            type="button"
            aria-label="收藏"
            data-testid={`element-bookmark-${item.key}`}
            onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <StarOff className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            aria-label="复制"
            data-testid={`element-copy-${item.key}`}
            onClick={() => {
              void navigator.clipboard.writeText(item.label);
              toast.success(KNOWLEDGE_PAGE.toasts.copied);
            }}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* desc */}
      <p className="text-sm text-muted-foreground">{detail.desc}</p>

      {/* 使用技巧 3 bullet */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">使用技巧</p>
        <ol className="space-y-1">
          {detail.techniques.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
