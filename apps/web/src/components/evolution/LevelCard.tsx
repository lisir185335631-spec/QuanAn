/**
 * LevelCard · 横长 card · 左 seedling + L1 info + progress + next · 右 5 icon row
 */
import { Sprout } from 'lucide-react';

import {
  EVOLUTION_DEFAULT_ARCHIVES,
  EVOLUTION_DEFAULT_FEEDBACKS,
  EVOLUTION_DEFAULT_LEVEL_ID,
  EVOLUTION_DEFAULT_NEXT_NEED,
  EVOLUTION_LEVEL_INFO_TPL,
  EVOLUTION_LEVEL_NEXT_TPL,
  EVOLUTION_LEVEL_TITLE_TPL,
  EVOLUTION_LEVELS_5,
} from '@/lib/constants/evolution';

import { LevelIconRow } from './LevelIconRow';

export function LevelCard() {
  const currentLevel = EVOLUTION_LEVELS_5.find(
    (l) => l.id === EVOLUTION_DEFAULT_LEVEL_ID,
  )!;

  const titleText = EVOLUTION_LEVEL_TITLE_TPL(currentLevel.id, currentLevel.label);
  const infoText = EVOLUTION_LEVEL_INFO_TPL(
    EVOLUTION_DEFAULT_FEEDBACKS,
    EVOLUTION_DEFAULT_ARCHIVES,
  );
  const nextText = EVOLUTION_LEVEL_NEXT_TPL(EVOLUTION_DEFAULT_NEXT_NEED);

  return (
    <div
      data-testid="level-card"
      className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-5 flex items-center justify-between gap-6"
    >
      {/* left group */}
      <div className="space-y-3 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p
              data-testid="level-title"
              className="font-bold text-on-surface text-sm"
            >
              {titleText}
            </p>
            <p
              data-testid="level-info"
              className="text-xs text-muted-foreground mt-0.5"
            >
              {infoText}
            </p>
          </div>
        </div>

        {/* progress bar: full empty (0 of 5) */}
        <div className="space-y-1">
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '0%' }} />
          </div>
          <p
            data-testid="level-next"
            className="text-xs text-muted-foreground"
          >
            {nextText}
          </p>
        </div>
      </div>

      {/* right group: 5 level icon row */}
      <div className="shrink-0">
        <LevelIconRow activeId={EVOLUTION_DEFAULT_LEVEL_ID} />
      </div>
    </div>
  );
}
