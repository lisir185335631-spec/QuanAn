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
          <p className="text-sm font-semibold text-[#9ca3af]">{placeholderLabel ?? '—'}</p>
          <div className="h-7 w-7 bg-[#f3f4f6] rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-[#f3f4f6] rounded w-full" />
          <div className="h-3 bg-[#f3f4f6] rounded w-4/5" />
          <div className="h-3 bg-[#f3f4f6] rounded w-3/4" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 bg-[#f3f4f6] rounded-full w-12" />
          <div className="h-5 bg-[#f3f4f6] rounded-full w-16" />
        </div>
        <div className="h-3 bg-[#f3f4f6] rounded w-3/5" />
      </SubCard>
    );
  }

  return (
    <SubCard className={cn('space-y-3', className)}>
      {/* platform label + copy button */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[#111827]">{entry.platformLabel}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* long copy text — whitespace-pre-line 支持换行 */}
      <p className="text-xs text-[#6b7280] leading-relaxed whitespace-pre-line">{entry.copy}</p>

      {/* hashtag chips — AC-5: '#' prefix · 品牌蓝 #002fa7 */}
      {entry.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-block text-xs bg-[#002fa7]/10 text-[#002fa7] border border-[#002fa7]/20 rounded-full px-2.5 py-0.5"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 结构解析 (截图新增 · 通常显示一行 inline) */}
      {entry.structureExplain && entry.structureExplain.length > 0 && (
        <div className="space-y-1 border-t border-[#e5e7eb]/30 pt-2">
          <p className="text-[11px] text-[#6b7280] leading-relaxed">
            <span className="font-semibold text-[#4b5563]">结构解析：</span>
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
              className="inline-block text-[11px] text-[#1f2937] bg-[#002fa7]/10 border border-[#002fa7]/25 rounded px-2 py-1 leading-relaxed"
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
              className="inline-block text-[10px] bg-[#002fa7]/10 text-[#002fa7] border border-[#002fa7]/15 rounded px-2 py-0.5"
            >
              SEO {kw}
            </span>
          ))}
        </div>
      )}

      {/* evaluation (optional · 旧 mock 用) */}
      {entry.evaluation && (
        <p className="text-xs text-[#6b7280] leading-relaxed">
          <span className="font-medium text-[#4b5563]">评估：</span>
          {entry.evaluation}
        </p>
      )}
    </SubCard>
  );
}
