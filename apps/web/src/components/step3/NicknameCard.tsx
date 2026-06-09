import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { SparkleIcon } from '@/components/icons/aiipznt-icons';
import { C, F } from '@/components/home-next/ikb/system';
import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface NicknameEvaluation {
  name: string;
  description: string;
  psychology?: string;     // 截图无此字段 · 改 optional
  searchability: string;   // 截图: "搜索友好度: 高/中/中高"
  tags: string[];
  hasSparkle?: boolean;
}

export interface NicknameCardProps {
  nickname: NicknameEvaluation;
  className?: string;
}

export function NicknameCard({ nickname, className }: NicknameCardProps) {
  function handleCopy() {
    void navigator.clipboard.writeText(nickname.name).then(() => {
      toast('已复制昵称');
    });
  }

  return (
    <SubCard
      variant={nickname.hasSparkle ? 'highlighted' : 'default'}
      className={cn('space-y-3', className)}
    >
      {/* name row + copy button */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
          {nickname.hasSparkle && (
            <SparkleIcon size={4} className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {nickname.name}
        </h4>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* description */}
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{nickname.description}</p>

      {/* psychology (optional · 截图无) */}
      {nickname.psychology && (
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
          <span className="font-medium" style={{ color: C.ink }}>心理学依据：</span>
          {nickname.psychology}
        </p>
      )}

      {/* searchability */}
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
        <span className="font-medium" style={{ color: C.ink }}>搜索友好度：</span>
        {nickname.searchability}
      </p>

      {/* chip tags */}
      {nickname.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {nickname.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block text-xs rounded-full px-2.5 py-0.5"
              style={{ background: 'rgba(216,232,255,0.15)', color: C.ikb, border: `0.5px solid rgba(216,232,255,0.3)` }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </SubCard>
  );
}
