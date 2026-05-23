import { PLATFORMS } from '@/lib/constants/platforms';
import { cn } from '@/lib/utils';

export interface PlatformRadioGroupProps {
  value: string | null;
  onChange: (key: string) => void;
  disabled?: boolean;
}

export function PlatformRadioGroup({ value, onChange, disabled = false }: PlatformRadioGroupProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {PLATFORMS.map((platform) => {
        const isActive = platform.key === value;
        return (
          <button
            key={platform.key}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(platform.key)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all',
              isActive
                ? 'border-primary bg-primary/20 text-primary ring-1 ring-primary/50'
                : 'border-border bg-card text-on-surface hover:border-primary/40',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <span>{platform.emoji}</span>
            <span>{platform.label}</span>
          </button>
        );
      })}
    </div>
  );
}
