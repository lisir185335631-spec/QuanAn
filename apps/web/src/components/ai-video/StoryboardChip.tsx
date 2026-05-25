/**
 * StoryboardChip.tsx — 顶部 chip card
 * Clapperboard icon + STORYBOARD 大字 + 副标题
 */
import { Clapperboard } from 'lucide-react';

import { AI_VIDEO_CHIP_SUBTITLE, AI_VIDEO_CHIP_TITLE } from '@/lib/constants/ai-video';

export function StoryboardChip() {
  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-primary/40 bg-card p-6"
      data-testid="storyboard-chip"
    >
      <Clapperboard className="w-10 h-10 text-primary flex-shrink-0" />
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-widest text-primary">
          {AI_VIDEO_CHIP_TITLE}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{AI_VIDEO_CHIP_SUBTITLE}</p>
      </div>
    </div>
  );
}
