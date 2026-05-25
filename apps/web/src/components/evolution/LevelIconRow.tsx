/**
 * LevelIconRow · 5 level icons · active L1 金圈 · 其余 4 dimmed
 */
import {
  EVOLUTION_LEVELS_5,
} from '@/lib/constants/evolution';

interface LevelIconRowProps {
  activeId: string;
}

export function LevelIconRow({ activeId }: LevelIconRowProps) {
  return (
    <div
      data-testid="level-icon-row"
      className="flex items-center gap-2"
    >
      {EVOLUTION_LEVELS_5.map((lvl) => {
        const isActive = lvl.id === activeId;
        const Icon = lvl.icon;
        return (
          <div
            key={lvl.id}
            data-testid={`level-icon-${lvl.id}`}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive
                ? 'ring-2 ring-primary bg-primary/10'
                : 'opacity-30'
            }`}
          >
            <Icon
              className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
        );
      })}
    </div>
  );
}
