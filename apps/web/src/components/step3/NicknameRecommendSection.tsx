import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { STEP3_OUTPUT_H3_6 } from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

import { NicknameCard, type NicknameEvaluation } from './NicknameCard';

export type { NicknameEvaluation } from './NicknameCard';

export interface NicknameSelectionStrategy {
  hint: string;
  chips: string[];
}

export interface NicknameRecommendSectionProps {
  nicknames?: NicknameEvaluation[];
  strategy?: NicknameSelectionStrategy;
  className?: string;
}

const H3_LABEL = STEP3_OUTPUT_H3_6[1]!.h3Label; // '昵称推荐'

function NicknameSkeleton() {
  return (
    <SubCard>
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-muted/60 rounded w-2/5" />
        <div className="h-3 bg-muted/40 rounded w-full" />
        <div className="h-3 bg-muted/40 rounded w-4/5" />
        <div className="h-3 bg-muted/40 rounded w-3/4" />
        <div className="h-6 bg-muted/30 rounded-full w-1/3" />
      </div>
    </SubCard>
  );
}

export function NicknameRecommendSection({
  nicknames = [],
  strategy,
  className,
}: NicknameRecommendSectionProps) {
  const isEmpty = nicknames.length === 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
        <FlameIcon className="h-4 w-4 shrink-0" size={4} />
        {H3_LABEL}
      </h3>

      {/* 5-card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isEmpty ? (
          <>
            <NicknameSkeleton />
            <NicknameSkeleton />
            <NicknameSkeleton />
            <NicknameSkeleton />
            <NicknameSkeleton />
          </>
        ) : (
          nicknames.map((n, i) => (
            <NicknameCard key={i} nickname={n} />
          ))
        )}
      </div>

      {/* 选择策略 sub-section */}
      {(isEmpty || strategy) && (
        <div className="bg-muted/20 p-4 rounded-lg space-y-2">
          <p className="text-xs font-medium text-on-surface/70">选择策略</p>
          {strategy ? (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed">{strategy.hint}</p>
              {strategy.chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {strategy.chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-block text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-muted/40 rounded w-full" />
              <div className="h-3 bg-muted/40 rounded w-3/4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
