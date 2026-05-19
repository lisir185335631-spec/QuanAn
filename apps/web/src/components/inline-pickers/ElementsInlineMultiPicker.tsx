import { cn } from '@/lib/utils';
import { HOT_ELEMENT_GROUPS, ALL_ELEMENTS } from '@/lib/constants/elements';

export interface ElementsInlineMultiPickerProps {
  value: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
  showCount?: boolean;
  layout?: 'compact' | 'grouped';
}

export function ElementsInlineMultiPicker({
  value,
  onChange,
  disabled = false,
  showCount = true,
  layout = 'grouped',
}: ElementsInlineMultiPickerProps) {
  function toggle(key: string) {
    if (disabled) return;
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  }

  if (layout === 'compact') {
    return (
      <div className="space-y-3">
        {showCount && (
          <p className="text-sm font-label text-on-surface">
            选择爆款元素（已选 {value.length} 个）
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {ALL_ELEMENTS.map((el) => {
            const isSelected = value.includes(el.key);
            return (
              <button
                key={el.key}
                type="button"
                data-element={el.key}
                onClick={() => toggle(el.key)}
                disabled={disabled}
                className={cn(
                  'px-3 py-1 rounded-full text-sm border transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-card hover:border-primary/40',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span>{el.emoji}</span> {el.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showCount && (
        <p className="text-sm font-label text-on-surface">
          选择爆款元素（已选 {value.length} 个）
        </p>
      )}
      {HOT_ELEMENT_GROUPS.map((group) => (
        <div key={group.key}>
          <h4 className="font-display font-bold text-sm text-muted-foreground mb-2">
            {group.label}
          </h4>
          <div className="flex flex-wrap gap-2">
            {group.items.map((el) => {
              const isSelected = value.includes(el.key);
              return (
                <button
                  key={el.key}
                  type="button"
                  data-element={el.key}
                  onClick={() => toggle(el.key)}
                  disabled={disabled}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm border transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card hover:border-primary/40',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span>{el.emoji}</span> {el.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
