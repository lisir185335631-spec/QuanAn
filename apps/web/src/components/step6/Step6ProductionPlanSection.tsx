// PRD-29.11 · Step6 拍摄方案 sub-component
import { useState } from 'react';

import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface Step6ProductionPlan {
  equipment: string[];
  location: string;
  lighting: string;
  props: string[];
  wardrobe: string;
  totalDuration: string;
}

interface Step6ProductionPlanSectionProps {
  plan?: Step6ProductionPlan;
  defaultExpanded?: boolean;
  className?: string;
}

const PLAN_KEYS: (keyof Step6ProductionPlan)[] = [
  'equipment',
  'location',
  'lighting',
  'props',
  'wardrobe',
  'totalDuration',
];

export function Step6ProductionPlanSection({
  plan,
  defaultExpanded = true,
  className,
}: Step6ProductionPlanSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <SubCard className={cn('space-y-4', className)}>
      {/* H3 row with collapse button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-on-surface">拍摄方案</h3>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-on-surface transition-colors"
          aria-label={expanded ? '折叠' : '展开'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Fields */}
      {expanded && plan && (
        <div className="space-y-4">
          {PLAN_KEYS.map((key) => {
            const value = plan[key];
            return (
              <SubCard key={key} variant="default" className="space-y-1.5">
                <p className="text-xs font-semibold text-primary">{key}</p>
                {Array.isArray(value) ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {`["${(value as string[]).join('","')}"]`}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed">{value as string}</p>
                )}
              </SubCard>
            );
          })}
        </div>
      )}
    </SubCard>
  );
}
