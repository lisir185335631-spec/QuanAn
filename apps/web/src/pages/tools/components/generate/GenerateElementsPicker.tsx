import { cn } from '@/lib/utils';
import { ALL_ELEMENTS } from '@/lib/constants/elements';
import { GENERATE_ELEMENTS_TITLE } from '@/lib/constants/generatePage';

interface Props {
  value: string[];
  onChange: (keys: string[]) => void;
}

export function GenerateElementsPicker({ value, onChange }: Props) {
  function toggle(key: string) {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  }

  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="text-base font-bold text-on-surface">{GENERATE_ELEMENTS_TITLE}</h2>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {ALL_ELEMENTS.map((el) => {
          const selected = value.includes(el.key);
          return (
            <button
              key={el.key}
              type="button"
              onClick={() => toggle(el.key)}
              className={cn(
                'rounded-lg border border-border bg-card px-4 py-2.5 cursor-pointer flex items-center gap-2 font-cn text-sm hover:border-primary/40 transition',
                selected && 'border-primary text-primary bg-primary/10 font-bold',
              )}
            >
              <span>{el.emoji}</span>
              <span>{el.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
