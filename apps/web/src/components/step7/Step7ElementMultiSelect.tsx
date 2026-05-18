import { memo } from 'react';

import {
  STEP7_ELEMENT_COUNTER_TEMPLATE,
  STEP7_ELEMENT_GROUPS_4,
  STEP7_ELEMENTS_22,
} from '@/lib/constants/step7';

interface Step7ElementMultiSelectProps {
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export const Step7ElementMultiSelect = memo(function Step7ElementMultiSelect({
  selected,
  onToggle,
}: Step7ElementMultiSelectProps) {
  const counterText = STEP7_ELEMENT_COUNTER_TEMPLATE.replace('{count}', String(selected.size));

  return (
    <div className="space-y-4">
      <p className="text-body-sm font-label text-on-surface sticky top-0 bg-card/90 backdrop-blur-sm py-1 z-10">
        {counterText}
      </p>
      {STEP7_ELEMENT_GROUPS_4.map((group) => {
        const elements = STEP7_ELEMENTS_22.filter((e) => e.groupKey === group.key);
        return (
          <div key={group.key}>
            <h4 className="text-body-xs font-label text-muted-foreground mb-2">{group.label}</h4>
            <div className="flex flex-wrap gap-2">
              {elements.map((el) => {
                const isSelected = selected.has(el.id);
                return (
                  <button
                    key={el.id}
                    type="button"
                    onClick={() => onToggle(el.id)}
                    className={[
                      'px-3 py-1 rounded-full text-body-xs border transition-all',
                      isSelected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-on-surface',
                    ].join(' ')}
                  >
                    {el.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
