import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface IntroCopyEntry {
  platformKey: string;
  platformLabel: string;
  copy: string;
  hashtags: string[];
  evaluation: string;
  // 截图新增 · 结构解析 5 行 + SEO 关键词 chips
  structureExplain?: string[];
  seoKeywords?: string[];
}

export interface IntroCopyPlatformCardProps {
  entry?: IntroCopyEntry;
  placeholderLabel?: string;
  className?: string;
}

export function IntroCopyPlatformCard({
  entry,
  placeholderLabel,
  className,
}: IntroCopyPlatformCardProps) {
  function handleCopy() {
    if (!entry) return;
    navigator.clipboard.writeText(entry.copy).then(() => {
      toast(`已复制 ${entry.platformLabel} 简介文案`);
    });
  }

  if (!entry) {
    return (
      <SubCard className={cn('space-y-3 animate-pulse', className)}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-on-surface/40">{placeholderLabel ?? '—'}</p>
          <div className="h-7 w-7 bg-muted/40 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-muted/40 rounded w-full" />
          <div className="h-3 bg-muted/40 rounded w-4/5" />
          <div className="h-3 bg-muted/40 rounded w-3/4" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 bg-muted/30 rounded-full w-12" />
          <div className="h-5 bg-muted/30 rounded-full w-16" />
        </div>
        <div className="h-3 bg-muted/30 rounded w-3/5" />
      </SubCard>
    );
  }

  return (
    <SubCard className={cn('space-y-3', className)}>
      {/* platform label + copy button */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-on-surface">{entry.platformLabel}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* long copy text — whitespace-pre-line 支持换行 */}
      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{entry.copy}</p>

      {/* hashtag chips — AC-5: '#' prefix · bg-primary/10 text-primary */}
      {entry.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-block text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 结构解析 (截图新增) */}
      {entry.structureExplain && entry.structureExplain.length > 0 && (
        <div className="space-y-1.5 border-t border-border/30 pt-2">
          <p className="text-[11px] font-semibold text-on-surface/70">结构解析</p>
          <ul className="space-y-1">
            {entry.structureExplain.map((line, i) => (
              <li key={i} className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="text-primary/70 mr-1">·</span>{line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SEO 关键词 chips (截图新增) */}
      {entry.seoKeywords && entry.seoKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {entry.seoKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-block text-[10px] bg-primary/8 text-primary/85 border border-primary/15 rounded px-2 py-0.5"
            >
              SEO {kw}
            </span>
          ))}
        </div>
      )}

      {/* evaluation (optional · 旧 mock 用) */}
      {entry.evaluation && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-on-surface/70">评估：</span>
          {entry.evaluation}
        </p>
      )}
    </SubCard>
  );
}
