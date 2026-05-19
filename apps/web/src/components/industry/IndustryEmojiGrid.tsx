import type { Industry } from '@/lib/constants/industries';

interface IndustryEmojiGridProps {
  industries: readonly Industry[];
  value: Industry | null;
  onChange: (industry: Industry) => void;
}

export function IndustryEmojiGrid({ industries, value, onChange }: IndustryEmojiGridProps) {
  if (industries.length === 0) return null;

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {industries.map((ind) => (
        <button
          key={ind.id}
          type="button"
          data-testid={`industry-card-${ind.id}`}
          onClick={() => onChange(ind)}
          className={[
            'rounded-lg p-3 flex flex-col items-center text-center cursor-pointer transition-colors border',
            value?.id === ind.id
              ? 'bg-primary/10 border-primary'
              : 'border-border hover:border-primary/40 bg-surface-container',
          ].join(' ')}
        >
          <span className="text-3xl mb-2">{ind.emoji}</span>
          <span className="text-body-sm font-cn text-on-surface">{ind.label}</span>
        </button>
      ))}
    </div>
  );
}
