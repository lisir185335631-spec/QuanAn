/**
 * VideoTypeCard.tsx — 单 type card
 * label 大白 + desc 小灰 · 选中态金边 · 无 emoji(sally 真实无)
 */
import { cn } from '@/lib/utils';
import type { VideoType } from '@/lib/constants/video-types';

interface VideoTypeCardProps {
  type: VideoType;
  selected: boolean;
  onClick: () => void;
}

export function VideoTypeCard({ type, selected, onClick }: VideoTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`video-type-card-${type.key}`}
      className={cn(
        'flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all duration-200',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <span className={cn('font-bold text-sm', selected ? 'text-primary' : 'text-on-surface')}>
        {type.label}
      </span>
      <span className="text-xs text-muted-foreground">{type.desc}</span>
    </button>
  );
}
