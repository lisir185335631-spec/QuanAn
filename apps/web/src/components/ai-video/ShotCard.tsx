/**
 * ShotCard.tsx — 单 SHOT card
 * header(SHOT# + 秒 + 景别 tag) + 4 cell grid + 场景 + 台词/旁白 + 动作指导 + 3 chip
 */
import { Clock, MapPin, Camera, Clapperboard, Type, Music, Lightbulb } from 'lucide-react';

import type { ShotMockData } from '@/lib/constants/ai-video';
import {
  SHOT_LABEL_ANGLE,
  SHOT_LABEL_MOVEMENT,
  SHOT_LABEL_EMOTION,
  SHOT_LABEL_TRANSITION,
  SHOT_LABEL_SCENE,
  SHOT_LABEL_DIALOGUE,
  SHOT_LABEL_ACTION,
} from '@/lib/constants/ai-video';
import { ShotFramingTag } from './ShotFramingTag';
import { ShotMetaCell } from './ShotMetaCell';
import { ShotChip } from './ShotChip';

interface ShotCardProps {
  shot: ShotMockData;
}

export function ShotCard({ shot }: ShotCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card/40 p-5 space-y-4"
      data-testid={`shot-card-${shot.num}`}
    >
      {/* Header: SHOT# + 秒 + 景别 tag */}
      <div className="flex items-center gap-3">
        <span className="text-base font-bold text-on-surface">SHOT {shot.num}</span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {shot.duration}
        </span>
        <ShotFramingTag framing={shot.framing} />
      </div>

      {/* 4 cell grid: 角度 / 运镜 / 情绪 / 转场 */}
      <div className="grid grid-cols-2 gap-2">
        <ShotMetaCell label={SHOT_LABEL_ANGLE}      value={shot.angle} />
        <ShotMetaCell label={SHOT_LABEL_MOVEMENT}   value={shot.movement} />
        <ShotMetaCell label={SHOT_LABEL_EMOTION}    value={shot.emotion} />
        <ShotMetaCell label={SHOT_LABEL_TRANSITION} value={shot.transition} />
      </div>

      {/* 场景 */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <MapPin className="w-3.5 h-3.5" />
          {SHOT_LABEL_SCENE}
        </div>
        <p className="text-sm text-muted-foreground">{shot.scene}</p>
      </div>

      {/* 台词/旁白 box */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Camera className="w-3.5 h-3.5" />
          {SHOT_LABEL_DIALOGUE}
        </div>
        <div className="rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-on-surface">
          {shot.dialogue}
        </div>
      </div>

      {/* 动作指导 */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Clapperboard className="w-3.5 h-3.5" />
          {SHOT_LABEL_ACTION}
        </div>
        <p className="text-sm text-muted-foreground">{shot.action}</p>
      </div>

      {/* 3 chip: T 字幕 / ♪ 音乐 / 💡 提示 */}
      <div className="flex flex-col gap-2">
        <ShotChip icon={Type}      text={shot.subtitle} testId={`shot-chip-subtitle-${shot.num}`} />
        <ShotChip icon={Music}     text={shot.music}    testId={`shot-chip-music-${shot.num}`} />
        <ShotChip icon={Lightbulb} text={shot.tip}      testId={`shot-chip-tip-${shot.num}`} />
      </div>
    </div>
  );
}
