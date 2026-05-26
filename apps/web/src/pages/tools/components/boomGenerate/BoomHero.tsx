import {
  BOOM_H1,
  BOOM_SUBTITLE_PART1,
  BOOM_SUBTITLE_HIGHLIGHT,
  BOOM_SUBTITLE_PART2,
} from '@/lib/constants/boomGenerate';

export function BoomHero() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold font-display text-on-surface">
        ⚡ {BOOM_H1}
      </h1>
      <p className="text-sm font-cn text-muted-foreground">
        {BOOM_SUBTITLE_PART1}
        <span className="font-bold text-primary">{BOOM_SUBTITLE_HIGHLIGHT}</span>
        {BOOM_SUBTITLE_PART2}
      </p>
    </div>
  );
}
