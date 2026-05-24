// /video-analysis · 爆款元素运用 + 爆款公式提炼 · 2 折叠 sub-card
import { useState } from 'react';

import { SubCard } from '@/components/ui/sub-card';
import { cn } from '@/lib/utils';

interface PopularElement {
  name: string;
  main: string;
  note: string;
}

interface PopularFormula {
  title: string;
  chips: string[];
}

interface VideoAnalysisElementsSectionProps {
  elements: PopularElement[];
  formula: PopularFormula;
  className?: string;
}

function goldChip(text: string) {
  return (
    <span className="inline-flex items-center rounded border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold ml-2">
      {text}
    </span>
  );
}

function CollapseButton({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-muted-foreground hover:text-on-surface transition-colors"
      aria-label={expanded ? '折叠' : '展开'}
    >
      {expanded ? '▲' : '▼'}
    </button>
  );
}

export function VideoAnalysisElementsSection({
  elements,
  formula,
  className,
}: VideoAnalysisElementsSectionProps) {
  const [expandedElements, setExpandedElements] = useState(true);
  const [expandedFormula, setExpandedFormula] = useState(true);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sub 1 · 爆款元素运用 */}
      <SubCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-on-surface flex items-center">
            爆款元素运用
            {goldChip(`${elements.length}个元素`)}
          </h3>
          <CollapseButton
            expanded={expandedElements}
            onToggle={() => setExpandedElements((v) => !v)}
          />
        </div>
        {expandedElements && (
          <div className="space-y-3">
            {elements.map((el, i) => (
              <div key={i} className="border-l-2 border-primary pl-4 py-2">
                <p className="text-sm text-primary font-semibold">{el.name}</p>
                <p className="text-sm text-on-surface/85 leading-relaxed">{el.main}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{el.note}</p>
              </div>
            ))}
          </div>
        )}
      </SubCard>

      {/* Sub 2 · 爆款公式提炼 */}
      <SubCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-on-surface flex items-center">
            爆款公式提炼
            {goldChip('核心公式')}
          </h3>
          <CollapseButton
            expanded={expandedFormula}
            onToggle={() => setExpandedFormula((v) => !v)}
          />
        </div>
        {expandedFormula && (
          <div className="space-y-3">
            <p className="text-base text-primary font-semibold">{formula.title}</p>
            <div className="flex flex-wrap gap-2">
              {formula.chips.map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded border border-primary/30 bg-primary/8 text-on-surface px-3 py-1.5 text-xs"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        )}
      </SubCard>
    </div>
  );
}
