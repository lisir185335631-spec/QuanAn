// PRD-29.14 · Step5 5大类 chip tabs
import { cn } from '@/lib/utils';

export type Step5CategoryId = 'traffic' | 'monetization' | 'persona' | 'cognition' | 'case';

export interface Step5Category {
  id: Step5CategoryId;
  name: string;
  subtitle: string;
  icon: string;
  count: number;
}

interface Step5CategoryTabsProps {
  categories: Step5Category[];
  activeId: Step5CategoryId;
  onChange: (id: Step5CategoryId) => void;
}

export function Step5CategoryTabs({ categories, activeId, onChange }: Step5CategoryTabsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          className={cn(
            'rounded-lg border text-left transition-colors py-4 px-4 flex flex-col items-start space-y-2',
            cat.id === activeId
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border/40 text-muted-foreground hover:text-on-surface',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{cat.icon}</span>
            <span className="text-sm font-semibold">{cat.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
          <p className="text-xs text-on-surface/70">{cat.count} 个选题</p>
        </button>
      ))}
    </div>
  );
}
