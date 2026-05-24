// PRD-29.13 · 私域成交流程 · 6 chip scenario tabs
import { cn } from '@/lib/utils';

export type PrivateDomainScenarioId =
  | 'welcome'
  | 'icebreaker'
  | 'trust'
  | 'discovery'
  | 'closing'
  | 'followup';

export interface PrivateDomainScenario {
  id: PrivateDomainScenarioId;
  name: string;
  subtitle: string;
  icon: string;
}

interface PrivateDomainScenarioTabsProps {
  scenarios: PrivateDomainScenario[];
  activeId: PrivateDomainScenarioId;
  onChange: (id: PrivateDomainScenarioId) => void;
}

export function PrivateDomainScenarioTabs({
  scenarios,
  activeId,
  onChange,
}: PrivateDomainScenarioTabsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {scenarios.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={cn(
            'rounded-lg border transition-colors py-4 flex flex-col items-center space-y-2',
            s.id === activeId
              ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
              : 'border-border/40 text-muted-foreground hover:text-on-surface',
          )}
        >
          <span className="text-xl">{s.icon}</span>
          <span className="text-sm">{s.name}</span>
        </button>
      ))}
    </div>
  );
}
