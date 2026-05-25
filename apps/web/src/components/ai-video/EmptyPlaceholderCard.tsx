/**
 * EmptyPlaceholderCard.tsx — empty 大占位 card
 * Clapperboard 大灰 + h3 + desc + 4 bullet(ChevronRight 金 prefix)
 */
import { Clapperboard, ChevronRight } from 'lucide-react';

import {
  AI_VIDEO_EMPTY_BULLETS,
  AI_VIDEO_EMPTY_DESC,
  AI_VIDEO_EMPTY_H3,
} from '@/lib/constants/ai-video';

export function EmptyPlaceholderCard() {
  return (
    <div
      className="flex flex-col items-center rounded-xl border border-border bg-card p-12 text-center"
      data-testid="ai-video-empty-card"
    >
      <Clapperboard className="w-16 h-16 text-muted-foreground mb-6" />
      <h3 className="text-xl font-bold text-on-surface mb-3">{AI_VIDEO_EMPTY_H3}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{AI_VIDEO_EMPTY_DESC}</p>
      <ul className="flex flex-col gap-2 text-left">
        {AI_VIDEO_EMPTY_BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground">{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
