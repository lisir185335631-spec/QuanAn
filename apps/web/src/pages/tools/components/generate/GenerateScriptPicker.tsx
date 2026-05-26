import { cn } from '@/lib/utils';
import { SCRIPT_TYPES } from '@/lib/constants/scripts';
import { GENERATE_SCRIPT_TITLE } from '@/lib/constants/generatePage';

interface Props {
  value: string;
  onChange: (key: string) => void;
}

export function GenerateScriptPicker({ value, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-6">
      <h2 className="text-base font-bold text-on-surface">{GENERATE_SCRIPT_TITLE}</h2>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {SCRIPT_TYPES.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => onChange(type.key)}
            className={cn(
              'rounded-xl border border-border bg-card px-4 py-3 cursor-pointer text-left hover:border-primary/40 transition',
              value === type.key && 'border-primary text-primary bg-primary/5',
            )}
          >
            <div className="font-cn font-bold text-base mb-1">{type.label}</div>
            <div className="font-cn text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">
              {type.desc}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
