// PRD-29.11 · Step6 分镜脚本 sub-component
import { useState } from 'react';

import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

export interface Step6Shot {
  index: number;
  timeRange: string;
  shotType: string;
  visual: string;
  audio: string;
}

interface Step6StoryboardSectionProps {
  shots?: Step6Shot[];
  defaultExpanded?: boolean;
  className?: string;
}

export function Step6StoryboardSection({
  shots,
  defaultExpanded = true,
  className,
}: Step6StoryboardSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <SubCard className={cn('space-y-4', className)}>
      {/* H3 row with collapse button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
          分镜脚本
          <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
            {shots?.length ?? 0} 个镜头
          </span>
        </h3>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-on-surface transition-colors"
          aria-label={expanded ? '折叠' : '展开'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Shot list */}
      {expanded && (
        <div className="space-y-3">
          {(shots ?? []).map((shot) => (
            <div key={shot.index} className="grid grid-cols-[48px_1fr] gap-4 items-start">
              {/* Index chip */}
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-2xl font-bold text-on-surface">
                {shot.index.toString().padStart(2, '0')}
              </span>

              {/* Content */}
              <div className="space-y-1">
                {/* Time range chip */}
                <div>
                  <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {shot.timeRange}
                  </span>
                </div>
                {/* Shot type */}
                <p className="text-sm font-semibold text-on-surface">{shot.shotType}</p>
                {/* Visual */}
                <p className="text-xs leading-relaxed">
                  <span className="font-medium text-primary/85">画面：</span>
                  <span className="text-muted-foreground">{shot.visual}</span>
                </p>
                {/* Audio */}
                <p className="text-xs leading-relaxed">
                  <span className="font-medium text-primary/85">音频：</span>
                  <span className="text-muted-foreground">{shot.audio}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SubCard>
  );
}
