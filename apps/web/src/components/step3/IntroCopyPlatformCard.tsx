import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { C, F } from '@/components/home-next/ikb/system';
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
  // 图 10/11/12/13 红框 · 每行 copy 的亮点解读 chip(line annotation)
  // 例: "12年餐饮老板转型AI，负债百万到智能体架构师：强烈的个人故事和转型经历..."
  lineHighlights?: string[];
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
    void navigator.clipboard.writeText(entry.copy).then(() => {
      toast(`已复制 ${entry.platformLabel} 简介文案`);
    });
  }

  if (!entry) {
    return (
      <SubCard className={cn('space-y-3 animate-pulse', className)}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: F.cn }}>{placeholderLabel ?? '—'}</p>
          <div className="h-7 w-7 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className="space-y-1">
          <div className="h-3 rounded w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-3 rounded w-4/5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-3 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 rounded-full w-12" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-5 rounded-full w-16" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className="h-3 rounded w-3/5" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </SubCard>
    );
  }

  return (
    <SubCard className={cn('space-y-3', className)}>
      {/* platform label + copy button */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{entry.platformLabel}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* long copy text — whitespace-pre-line 支持换行 */}
      <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{entry.copy}</p>

      {/* hashtag chips — AC-5: '#' prefix · 冷蓝 */}
      {entry.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-block text-xs rounded-full px-2.5 py-0.5"
              style={{ background: 'rgba(216,232,255,0.15)', color: C.ikb, border: `0.5px solid rgba(216,232,255,0.3)` }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 结构解析 (截图新增 · 通常显示一行 inline) */}
      {entry.structureExplain && entry.structureExplain.length > 0 && (
        <div className="space-y-1 pt-2" style={{ borderTop: `0.5px solid ${C.line}` }}>
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
            <span className="font-semibold" style={{ color: C.ink }}>结构解析：</span>
            {entry.structureExplain.map((line, i) => (
              <span key={i}>
                {i > 0 && '　'}
                {line}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* 行亮点解读 chips (图 10/11/12/13 红框 · 每行 copy 亮点解读) */}
      {entry.lineHighlights && entry.lineHighlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {entry.lineHighlights.map((line, i) => (
            <span
              key={i}
              className="inline-block text-[11px] rounded px-2 py-1 leading-relaxed"
              style={{ color: C.ink, background: 'rgba(216,232,255,0.12)', border: `0.5px solid rgba(216,232,255,0.25)`, fontFamily: F.cn, textShadow: C.textShadow }}
            >
              {line}
            </span>
          ))}
        </div>
      )}

      {/* SEO 关键词 chips (截图新增) */}
      {entry.seoKeywords && entry.seoKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {entry.seoKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-block text-[10px] rounded px-2 py-0.5"
              style={{ background: 'rgba(216,232,255,0.12)', color: C.ikb, border: `0.5px solid rgba(216,232,255,0.2)` }}
            >
              SEO {kw}
            </span>
          ))}
        </div>
      )}

      {/* evaluation (optional · 旧 mock 用) */}
      {entry.evaluation && (
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
          <span className="font-medium" style={{ color: C.ink }}>评估：</span>
          {entry.evaluation}
        </p>
      )}
    </SubCard>
  );
}
