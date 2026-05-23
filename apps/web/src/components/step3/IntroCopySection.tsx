import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { STEP3_OUTPUT_H3_6 } from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

import { IntroCopyPlatformCard, type IntroCopyEntry } from './IntroCopyPlatformCard';

export type { IntroCopyEntry } from './IntroCopyPlatformCard';

// D-289 锁: 6 平台顺序不可改 (2 列 × 3 行)
const INTRO_PLATFORM_LABELS = [
  '抖音主号',
  '抖音副号',
  '小红书干货博主',
  '小红书个人IP',
  '视频号品质创业',
  '视频号个人生活',
] as const;

export interface IntroCopySectionProps {
  formula?: string;
  entries?: IntroCopyEntry[];
  className?: string;
}

const H3_LABEL = STEP3_OUTPUT_H3_6[4]!.h3Label; // '简介文案方案'

export function IntroCopySection({ formula, entries = [], className }: IntroCopySectionProps) {
  const hasEntries = entries.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
        <FlameIcon className="h-4 w-4 shrink-0" size={4} />
        {H3_LABEL}
      </h3>

      {/* ★ 简介公式 independent SubCard — AC-3 */}
      <SubCard>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-on-surface/80">★ 简介公式</p>
          {formula ? (
            <p className="text-xs text-muted-foreground leading-relaxed font-mono">{formula}</p>
          ) : (
            <div className="animate-pulse space-y-1">
              <div className="h-3 bg-muted/40 rounded w-full" />
              <div className="h-3 bg-muted/40 rounded w-3/4" />
            </div>
          )}
        </div>
      </SubCard>

      {/* 6 platform cards grid — D-289 锁: grid-cols-1 md:grid-cols-2 (2 列 × 3 行) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasEntries
          ? entries.map((entry) => (
              <IntroCopyPlatformCard key={entry.platformKey} entry={entry} />
            ))
          : INTRO_PLATFORM_LABELS.map((label) => (
              <IntroCopyPlatformCard key={label} placeholderLabel={label} />
            ))}
      </div>
    </div>
  );
}
