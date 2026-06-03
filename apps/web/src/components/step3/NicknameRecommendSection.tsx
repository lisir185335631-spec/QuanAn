import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { STEP3_OUTPUT_H3_6 } from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

import { NicknameCard, type NicknameEvaluation } from './NicknameCard';

export type { NicknameEvaluation } from './NicknameCard';

export interface NicknameSelectionStrategy {
  hint: string;
  chips: string[];
  // 截图: 命名策略 4 ✓ + 4 ✗ + 附注
  principles?: string[];   // ✓ 4 条原则
  avoidances?: string[];   // ✗ 4 条禁忌
  note?: string;           // 末尾附注: 抖音昵称更强调 ... / 小红书 ... / 视频号 ...
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
        <div className="h-4 bg-[#f3f4f6] rounded w-2/5" />
        <div className="h-3 bg-[#f3f4f6] rounded w-full" />
        <div className="h-3 bg-[#f3f4f6] rounded w-4/5" />
        <div className="h-3 bg-[#f3f4f6] rounded w-3/4" />
        <div className="h-6 bg-[#f3f4f6] rounded-full w-1/3" />
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
      <h3 className="flex items-center gap-2 text-base font-semibold text-[#111827]">
        <FlameIcon className="h-4 w-4 shrink-0" aria-hidden="true" size={4} />
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

      {/* 命名策略 sub-section */}
      {(isEmpty || strategy) && (
        <div className="bg-[#f3f4f6] p-4 rounded-lg space-y-3 border border-[#002fa7]/15">
          <p className="text-sm font-semibold text-[#111827]">命名策略</p>
          {strategy ? (
            <>
              {strategy.hint && (
                <p className="text-xs text-[#6b7280] leading-relaxed">{strategy.hint}</p>
              )}
              {strategy.principles && strategy.principles.length > 0 && (
                <ul className="space-y-1.5">
                  {strategy.principles.map((p, i) => (
                    <li key={`p-${i}`} className="text-xs leading-relaxed flex gap-2 text-[#1f2937]">
                      <span className="text-[#10b981] shrink-0">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
              {strategy.avoidances && strategy.avoidances.length > 0 && (
                <ul className="space-y-1.5">
                  {strategy.avoidances.map((a, i) => (
                    <li key={`a-${i}`} className="text-xs leading-relaxed flex gap-2 text-[#6b7280]">
                      <span className="text-[#781621] shrink-0">✗</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              )}
              {strategy.chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {strategy.chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-block text-xs bg-[#002fa7]/10 text-[#002fa7] border border-[#002fa7]/20 rounded-full px-2.5 py-0.5"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
              {strategy.note && (
                <p className="text-[11px] text-[#6b7280] leading-relaxed border-t border-[#e5e7eb]/30 pt-2 mt-1">
                  {strategy.note}
                </p>
              )}
            </>
          ) : (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-[#f3f4f6] rounded w-full" />
              <div className="h-3 bg-[#f3f4f6] rounded w-3/4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
