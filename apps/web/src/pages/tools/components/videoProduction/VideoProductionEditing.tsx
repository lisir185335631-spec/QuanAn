// VideoProductionEditing.tsx — 剪辑要点 · 11 条有序列表

import { Scissors } from 'lucide-react';

import {
  VIDEO_PRODUCTION_EDITING,
  VIDEO_PRODUCTION_EDITING_TITLE,
} from '@/lib/constants/video-production';

export function VideoProductionEditing() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-on-surface">
        <Scissors className="h-5 w-5 text-red-400" />
        {VIDEO_PRODUCTION_EDITING_TITLE}
      </h2>
      <ol className="space-y-3">
        {VIDEO_PRODUCTION_EDITING.map((item, i) => (
          <li key={item} className="flex gap-3 font-cn text-sm leading-relaxed text-muted-foreground">
            <span className="font-display font-bold text-red-400">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
