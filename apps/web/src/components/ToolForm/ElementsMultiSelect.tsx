/**
 * ElementsMultiSelect — 22 爆款元素 4 组分类 + checkbox multiselect · PRD-5 US-001
 * 4 组 collapsible sections · ScrollArea h-96 · max 8 elements
 */

import { useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  HOT_ELEMENT_GROUPS,
  HOT_ELEMENT_LABELS,
} from '@quanqn/schemas/specialist-io';

import type { FieldError } from 'react-hook-form';
import type { HotElementKey } from '@quanqn/schemas/specialist-io';

interface ElementsMultiSelectProps {
  value: HotElementKey[];
  onChange: (value: HotElementKey[]) => void;
  error?: FieldError;
  maxSelect?: number;
}

export function ElementsMultiSelect({
  value,
  onChange,
  error,
  maxSelect = 8,
}: ElementsMultiSelectProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    psychological: true,
    social: true,
    rhetoric: false,
    information: false,
  });

  function toggleGroup(key: string) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleElement(el: HotElementKey) {
    if (value.includes(el)) {
      onChange(value.filter((k) => k !== el));
    } else if (value.length < maxSelect) {
      onChange([...value, el]);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-medium text-on-surface">
          爆款元素<span className="text-error ml-0.5">*</span>
          <span className="text-muted-foreground font-normal ml-1">(最多{maxSelect}个)</span>
        </p>
        <span className="text-body-xs text-muted-foreground">
          已选 {value.length}/{maxSelect}
        </span>
      </div>

      <ScrollArea className="h-96 rounded-md border border-border">
        <div className="p-2 space-y-1" data-testid="elements-multi-select">
          {(HOT_ELEMENT_GROUPS as ReadonlyArray<{ key: string; label: string; keys: ReadonlyArray<HotElementKey> }>).map((group) => (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="flex w-full items-center justify-between px-2 py-1.5 rounded-sm text-body-xs font-semibold text-muted-foreground hover:bg-surface-container-high transition-colors"
                aria-expanded={openGroups[group.key]}
              >
                <span>{group.label}</span>
                <span className="text-muted-foreground">{openGroups[group.key] ? '▲' : '▼'}</span>
              </button>

              {openGroups[group.key] && (
                <div className="grid grid-cols-3 gap-1 mt-1 mb-2 px-1">
                  {group.keys.map((el: HotElementKey) => {
                    const selected = value.includes(el);
                    const disabled = !selected && value.length >= maxSelect;
                    return (
                      <button
                        key={el}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleElement(el)}
                        className={cn(
                          'rounded-md border px-2 py-1.5 text-body-xs transition-colors text-left',
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : disabled
                              ? 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-on-surface',
                        )}
                        data-selected={selected}
                        data-element={el}
                        aria-pressed={selected}
                      >
                        {HOT_ELEMENT_LABELS[el]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {error && (
        <p className="text-body-xs text-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
