import { STEP3_PLATFORMS_5 } from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

// D-288 锁: 只 3 平台用于背景图区, 快手/B站不在此列
export type BgPlatformKey = 'douyin' | 'xiaohongshu' | 'shipinhao';

const PLATFORM_DATA = Object.fromEntries(
  STEP3_PLATFORMS_5.map((p) => [p.id, p]),
) as Record<string, { id: string; label: string; name: string }>;

export interface PlatformColumnCardProps {
  platformKey: BgPlatformKey;
  referenceImageUrl?: string | null;
  className?: string;
}

export function PlatformColumnCard({
  platformKey,
  referenceImageUrl,
  className,
}: PlatformColumnCardProps) {
  const platform = PLATFORM_DATA[platformKey]!;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-xs font-semibold text-on-surface/80">{platform.label}</p>
      {referenceImageUrl ? (
        <img
          src={referenceImageUrl}
          alt={`${platform.name}背景图参考`}
          className="w-full rounded-md object-cover"
        />
      ) : (
        <div className="border border-dashed border-border/60 rounded-md flex items-center justify-center py-8 text-xs text-muted-foreground">
          参考图占位
        </div>
      )}
    </div>
  );
}
