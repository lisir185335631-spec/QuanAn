// VideoProductionHero.tsx — h1 + subtitle

import { VIDEO_PRODUCTION_H1, VIDEO_PRODUCTION_SUBTITLE } from '@/lib/constants/video-production';

export function VideoProductionHero() {
  return (
    <header className="space-y-3">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface">
        {VIDEO_PRODUCTION_H1}
      </h1>
      <p className="font-cn text-base text-muted-foreground mt-3">{VIDEO_PRODUCTION_SUBTITLE}</p>
    </header>
  );
}
