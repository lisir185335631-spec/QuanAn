import { cn } from '@/lib/utils';
import { PLATFORMS } from '@/lib/constants/platforms';

export interface PlatformInlineRadioProps {
  value: string | null;
  onChange: (key: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
} as const;

export function PlatformInlineRadio({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: PlatformInlineRadioProps) {
  return (
    <div className="flex gap-3 flex-wrap lg:flex-nowrap">
      {PLATFORMS.map((platform) => {
        const isSelected = platform.key === value;
        return (
          <button
            key={platform.key}
            type="button"
            onClick={() => !disabled && onChange(platform.key)}
            disabled={disabled}
            className={cn(
              'rounded-lg border transition-all flex items-center gap-2',
              sizeClasses[size],
              isSelected
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-border bg-card hover:border-primary/40',
              disabled && 'opacity-50 cursor-not-allowed'
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
