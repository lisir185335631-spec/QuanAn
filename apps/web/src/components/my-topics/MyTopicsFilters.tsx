/**
 * MyTopicsFilters — 6 filter chip 横排
 * sally 1:1 复刻 · selected = 金底 bg-primary/10 + 金边 + 金字 + 金 icon
 */
import { MY_TOPICS_FILTERS, type TopicFilterKey } from '@/lib/constants/myTopics';

interface MyTopicsFiltersProps {
  active: TopicFilterKey;
  onChange: (key: TopicFilterKey) => void;
}

export function MyTopicsFilters({ active, onChange }: MyTopicsFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="filter-chips">
      {MY_TOPICS_FILTERS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            data-testid={`filter-chip-${key}`}
            className={[
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium border transition-colors',
              isActive
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
            ].join(' ')}
            aria-pressed={isActive}
          >
            <Icon
              className={['h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground'].join(' ')}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
