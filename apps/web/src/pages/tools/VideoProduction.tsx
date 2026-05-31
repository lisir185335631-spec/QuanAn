/**
 * VideoProduction.tsx — /video-production · 短视频一键制作
 * 1:1 字面复刻 aiipznt · mock-first · 2026-06-01
 * 旧 PRD-25 trpc 版整页重写 → 默认 mock 直出(form 预填 + 5 结果区常驻)
 */
import { useState } from 'react';

import { VIDEO_PRODUCTION_DEFAULT_COPY } from '@/lib/constants/video-production';

import { VideoProductionBgm } from './components/videoProduction/VideoProductionBgm';
import { VideoProductionEditing } from './components/videoProduction/VideoProductionEditing';
import { VideoProductionFeedback } from './components/videoProduction/VideoProductionFeedback';
import { VideoProductionHero } from './components/videoProduction/VideoProductionHero';
import { VideoProductionInputCard } from './components/videoProduction/VideoProductionInputCard';
import { VideoProductionShootingPlan } from './components/videoProduction/VideoProductionShootingPlan';
import { VideoProductionStoryboard } from './components/videoProduction/VideoProductionStoryboard';
import { VideoProductionTeleprompter } from './components/videoProduction/VideoProductionTeleprompter';

export default function VideoProduction() {
  const [copy, setCopy] = useState<string>(VIDEO_PRODUCTION_DEFAULT_COPY);

  return (
    <main className="flex-1 container mx-auto px-4 py-8 space-y-6 max-w-6xl">
      <VideoProductionHero />
      <VideoProductionInputCard copy={copy} onCopyChange={setCopy} />
      <VideoProductionStoryboard />
      <VideoProductionShootingPlan />
      <VideoProductionTeleprompter />
      <VideoProductionBgm />
      <VideoProductionEditing />
      <VideoProductionFeedback />
    </main>
  );
}
