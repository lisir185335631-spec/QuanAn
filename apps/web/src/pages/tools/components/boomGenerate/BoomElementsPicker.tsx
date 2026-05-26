import { cn } from '@/lib/utils';
import { HOT_ELEMENT_GROUPS } from '@/lib/constants/elements';
import {
  BOOM_PICKER_TITLE,
  BOOM_SELECTED_PREFIX,
  BOOM_SELECTED_SUFFIX,
} from '@/lib/constants/boomGenerate';

interface BoomElementsPickerProps {
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
}

export function BoomElementsPicker({ selectedKeys, onChange }: BoomElementsPickerProps) {
  function toggleKey(key: string) {
    if (selectedKeys.includes(key)) {
      onChange(selectedKeys.filter((k) => k !== key));
    } else {
      onChange([...selectedKeys, key]);
    }
  }

  const selectedLabels = HOT_ELEMENT_GROUPS.flatMap((g) => g.items)
    .filter((item) => selectedKeys.includes(item.key))
    .map((item) => item.label);

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="font-cn font-bold text-on-surface">{BOOM_PICKER_TITLE}</h2>
      <div className="space-y-6 mt-6">
        {HOT_ELEMENT_GROUPS.map((group) => (
          <div key={group.key}>
            <p className="font-cn text-sm text-primary mb-3 font-bold">{group.label}</p>
            <div className="flex flex-wrap gap-3">
              {group.items.map((item) => {
                const selected = selectedKeys.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleKey(item.key)}
                    className={cn(
                      'rounded-full border border-border bg-card px-4 py-2 font-cn text-sm flex items-center gap-1.5 cursor-pointer hover:border-primary/40 transition',
                      selected && 'border-primary text-primary bg-primary/10 font-bold',
                    )}
                  >
                    {item.emoji} {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedKeys.length > 0 && (
        <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 font-cn text-sm">
          <span className="text-primary font-bold">
            {BOOM_SELECTED_PREFIX} {selectedKeys.length} {BOOM_SELECTED_SUFFIX}
          </span>
          <span className="text-on-surface">{selectedLabels.join('、')}</span>
        </div>
      )}
    </div>
  );
}
