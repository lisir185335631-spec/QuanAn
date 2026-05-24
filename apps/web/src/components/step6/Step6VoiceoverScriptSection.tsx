// PRD-29.11 · Step6 口播提词器 sub-component
import { useState } from 'react';

import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface Step6VoiceoverScriptSectionProps {
  script?: string[];
  defaultExpanded?: boolean;
  className?: string;
}

export function Step6VoiceoverScriptSection({
  script,
  defaultExpanded = true,
  className,
}: Step6VoiceoverScriptSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <SubCard className={cn('space-y-4', className)}>
      {/* H3 row with collapse button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
          口播提词器
          <span className="inline-flex items-center rounded border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
            可直接使用
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

      {/* Script paragraphs */}
      {expanded && (
        <div className="space-y-4">
          {(script ?? []).map((paragraph, i) => (
            <p key={i} className="text-sm leading-loose text-on-surface/90">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </SubCard>
  );
}
