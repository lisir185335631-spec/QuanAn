/**
 * ScriptCard — 单 script card
 * chip icon(emoji 单字) + name + 收藏/复制 btn + desc + methodology + 底部折叠案例
 * SPEC §9
 */

import { useState } from 'react';

import { ChevronDown, FileText, StarOff } from 'lucide-react';
import { toast } from 'sonner';

import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';
import type { ScriptType } from '@/lib/constants/scripts';
import { cn } from '@/lib/utils';

interface ScriptCardProps {
  script: ScriptType;
  index: number;
}

export function ScriptCard({ script, index }: ScriptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const caseCount = (index % 9) + 1;

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-3"
      data-testid={`script-card-${script.key}`}
    >
      {/* header row: chip icon + name + action btns */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary text-sm font-bold shrink-0"
            data-testid={`script-chip-${script.key}`}
          >
            {script.emoji}
          </span>
          <span className="font-display font-bold text-sm leading-snug">{script.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="收藏"
            data-testid={`script-bookmark-${script.key}`}
            onClick={() => toast.info(KNOWLEDGE_PAGE.toasts.bookmarked)}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <StarOff className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            aria-label="复制"
            data-testid={`script-copy-${script.key}`}
            onClick={() => {
              void navigator.clipboard.writeText(script.label);
              toast.success(KNOWLEDGE_PAGE.toasts.copied);
            }}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* desc */}
      <p className="text-sm text-muted-foreground">{script.desc}</p>

      {/* methodology paragraph */}
      <p className="text-xs text-muted-foreground leading-relaxed">{script.methodology}</p>

      {/* 折叠案例 */}
      <button
        type="button"
        data-testid={`script-cases-${script.key}`}
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <span>实战案例 ({caseCount}个)</span>
        <ChevronDown
          className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')}
        />
      </button>
      {expanded && (
        <p className="text-xs text-muted-foreground pl-2 border-l-2 border-border">
          暂无案例数据
        </p>
      )}
    </div>
  );
}
