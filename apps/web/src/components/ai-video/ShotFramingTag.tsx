/**
 * ShotFramingTag.tsx — 景别 tag
 * 中景=emerald / 近景=primary金 / 特写=orange
 */
import { cn } from '@/lib/utils';
import type { ShotFraming } from '@/lib/constants/ai-video';

interface ShotFramingTagProps {
  framing: ShotFraming;
}

const FRAMING_STYLES: Record<ShotFraming, string> = {
  '中景': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  '近景': 'text-primary bg-primary/10 border-primary/20',
  '特写': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

export function ShotFramingTag({ framing }: ShotFramingTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        FRAMING_STYLES[framing],
      )}
      data-testid={`framing-tag-${framing}`}
    >
      {framing}
    </span>
  );
}
