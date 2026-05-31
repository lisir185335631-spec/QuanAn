// VideoProductionStoryboard.tsx — 分镜脚本 · 14 场景

import { Camera } from 'lucide-react';

import {
  VIDEO_PRODUCTION_STORYBOARD,
  VIDEO_PRODUCTION_STORYBOARD_TITLE,
} from '@/lib/constants/video-production';

import { VideoProductionSceneCard } from './VideoProductionSceneCard';

export function VideoProductionStoryboard() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-on-surface">
        <Camera className="h-5 w-5" />
        {VIDEO_PRODUCTION_STORYBOARD_TITLE}
      </h2>
      <div className="space-y-4">
        {VIDEO_PRODUCTION_STORYBOARD.map((s) => (
          <VideoProductionSceneCard key={s.scene} scene={s} />
        ))}
      </div>
    </div>
  );
}
