// VideoProductionShootingPlan.tsx — 拍摄方案 · 6 子块

import { Camera } from 'lucide-react';

import {
  VIDEO_PRODUCTION_SHOOTING,
  VIDEO_PRODUCTION_SHOOTING_TITLE,
} from '@/lib/constants/video-production';

export function VideoProductionShootingPlan() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-on-surface">
        <Camera className="h-5 w-5" />
        {VIDEO_PRODUCTION_SHOOTING_TITLE}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="font-cn text-sm text-muted-foreground mb-2">
            {VIDEO_PRODUCTION_SHOOTING.equipmentLabel}
          </p>
          <ul className="space-y-1.5">
            {VIDEO_PRODUCTION_SHOOTING.equipment.map((item) => (
              <li key={item} className="font-cn text-sm text-on-surface/85 flex gap-2">
                <span className="text-primary">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-cn text-sm text-muted-foreground mb-2">
            {VIDEO_PRODUCTION_SHOOTING.sceneLabel}
          </p>
          <p className="font-cn text-sm text-on-surface/85 leading-relaxed">
            {VIDEO_PRODUCTION_SHOOTING.scene}
          </p>
        </div>
        <div>
          <p className="font-cn text-sm text-muted-foreground mb-2">
            {VIDEO_PRODUCTION_SHOOTING.lightingLabel}
          </p>
          <p className="font-cn text-sm text-on-surface/85 leading-relaxed">
            {VIDEO_PRODUCTION_SHOOTING.lighting}
          </p>
        </div>
        <div>
          <p className="font-cn text-sm text-muted-foreground mb-2">
            {VIDEO_PRODUCTION_SHOOTING.costumeLabel}
          </p>
          <p className="font-cn text-sm text-on-surface/85 leading-relaxed">
            {VIDEO_PRODUCTION_SHOOTING.costume}
          </p>
        </div>
        <div>
          <p className="font-cn text-sm text-muted-foreground mb-2">
            {VIDEO_PRODUCTION_SHOOTING.propsLabel}
          </p>
          <ul className="space-y-1.5">
            {VIDEO_PRODUCTION_SHOOTING.props.map((item) => (
              <li key={item} className="font-cn text-sm text-on-surface/85 flex gap-2">
                <span className="text-primary">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-cn text-sm text-muted-foreground mb-2">
            {VIDEO_PRODUCTION_SHOOTING.durationLabel}
          </p>
          <p className="font-cn text-base font-semibold text-on-surface">
            {VIDEO_PRODUCTION_SHOOTING.duration}
          </p>
        </div>
      </div>
    </div>
  );
}
