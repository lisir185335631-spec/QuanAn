/**
 * PlatformCard.tsx — 单 platform card
 * emoji + label · 选中态金边
 */
import { cn } from '@/lib/utils';
import type { PlatformOption } from '@/lib/constants/ai-video';

interface PlatformCardProps {
  platform: PlatformOption;
  selected: boolean;
  onClick: () => void;
}

export function PlatformCard({ platform, selected, onClick }: PlatformCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`platform-card-${platform.key}`}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200',
        selected
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-card text-on-surface hover:border-primary/40',
      )}
    >
      <span className="text-2xl">{platform.emoji}</span>
      <span className={cn('font-medium text-sm', selected ? 'text-primary' : 'text-on-surface')}>
        {platform.label}
      </span>
    </button>
  );
}
