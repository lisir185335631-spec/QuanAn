// VideoProductionBgm.tsx — 配乐建议

import { Music } from 'lucide-react';

import {
  VIDEO_PRODUCTION_BGM,
  VIDEO_PRODUCTION_BGM_TITLE,
} from '@/lib/constants/video-production';

export function VideoProductionBgm() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-on-surface">
        <Music className="h-5 w-5" />
        {VIDEO_PRODUCTION_BGM_TITLE}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <p className="font-cn text-sm text-muted-foreground">
          {VIDEO_PRODUCTION_BGM.styleLabel}：
          <span className="font-semibold text-on-surface">{VIDEO_PRODUCTION_BGM.style}</span>
        </p>
        <p className="font-cn text-sm text-muted-foreground">
          {VIDEO_PRODUCTION_BGM.moodLabel}：{VIDEO_PRODUCTION_BGM.mood}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {VIDEO_PRODUCTION_BGM.chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-primary/40 bg-primary/5 px-4 py-2 font-cn text-sm text-primary"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
