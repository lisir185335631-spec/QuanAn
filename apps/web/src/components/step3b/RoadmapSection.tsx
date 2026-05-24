// PRD-29.8 · H3-5 人设打造路线图
import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RoadmapItem {
  period: string;
  accent: 'green' | 'yellow' | 'purple';
  goal: string;
  steps: string[];
}

interface RoadmapSectionProps {
  roadmap?: RoadmapItem[];
  canViewPlan?: boolean;
  onViewPlan?: () => void;
  className?: string;
}

function accentClasses(accent: 'green' | 'yellow' | 'purple') {
  if (accent === 'green') {
    return {
      box: 'border-emerald-500/30 bg-emerald-500/5',
      chip: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400',
    };
  }
  if (accent === 'yellow') {
    return {
      box: 'border-amber-500/30 bg-amber-500/5',
      chip: 'bg-amber-500/15 border-amber-500/35 text-amber-400',
    };
  }
  return {
    box: 'border-violet-500/30 bg-violet-500/5',
    chip: 'bg-violet-500/15 border-violet-500/35 text-violet-400',
  };
}

export function RoadmapSection({ roadmap, canViewPlan, onViewPlan, className }: RoadmapSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
          <FlameIcon className="h-4 w-4 shrink-0" size={4} />
          人设打造路线图
        </h3>
        <Button variant="outline" size="sm" disabled={!canViewPlan} onClick={onViewPlan}>
          执行计划
        </Button>
      </div>

      {/* 3 timeline boxes */}
      <div className="space-y-3">
        {(roadmap ?? []).map((item, i) => {
          const cls = accentClasses(item.accent);
          return (
            <div key={i} className={cn('rounded-lg border p-5', cls.box)}>
              <div className="flex items-center gap-3">
                <span className={cn('text-xs font-semibold rounded px-3 py-1 border', cls.chip)}>
                  {item.period}
                </span>
                <span className="text-sm font-semibold text-on-surface">{item.goal}</span>
              </div>
              <ul className="space-y-1.5 mt-3">
                {item.steps.map((step, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="text-primary shrink-0">→</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
