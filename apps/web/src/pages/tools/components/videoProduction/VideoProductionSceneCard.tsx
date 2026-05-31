// VideoProductionSceneCard.tsx — 单场景卡片(Storyboard 的子组件)

import {
  type VideoProductionScene,
  VIDEO_PRODUCTION_SCENE_LABELS,
} from '@/lib/constants/video-production';

interface VideoProductionSceneCardProps {
  scene: VideoProductionScene;
}

export function VideoProductionSceneCard({ scene }: VideoProductionSceneCardProps) {
  return (
    <div className="rounded-lg border border-border/40 bg-input/30 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-base font-bold text-primary">{scene.scene}</span>
        <span className="rounded bg-muted/40 px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {scene.time}
        </span>
      </div>
      <p className="font-cn text-sm text-muted-foreground">
        <span className="text-muted-foreground/70">{VIDEO_PRODUCTION_SCENE_LABELS.shot}：</span>
        {scene.shot}
      </p>
      <p className="font-cn text-sm text-muted-foreground">
        <span className="text-muted-foreground/70">{VIDEO_PRODUCTION_SCENE_LABELS.frame}：</span>
        {scene.frame}
      </p>
      <div className="rounded border-l-2 border-primary bg-primary/5 px-3 py-2">
        <p className="font-cn text-sm text-on-surface">
          <span className="text-muted-foreground/70">{VIDEO_PRODUCTION_SCENE_LABELS.voiceover}：</span>
          {scene.voiceover}
        </p>
      </div>
      <p className="font-cn text-sm text-muted-foreground">
        <span className="text-muted-foreground/70">{VIDEO_PRODUCTION_SCENE_LABELS.action}：</span>
        {scene.action}
      </p>
      <p className="font-cn text-sm text-muted-foreground">
        <span className="text-muted-foreground/70">{VIDEO_PRODUCTION_SCENE_LABELS.transition}：</span>
        <span className="text-primary font-semibold">{scene.transition}</span>
      </p>
    </div>
  );
}
