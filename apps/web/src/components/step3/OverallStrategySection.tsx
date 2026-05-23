import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import { STEP3_OUTPUT_H3_6 } from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

// D-290 锁: 4 strategic sub-section 字面顺序不可改
const OVERALL_STRATEGY_SUB_SECTIONS = [
  '视觉统一性',
  '第一印象设计',
  '内容封面与简介公益策略',
  '内容创意建议',
] as const;

export type OverallStrategySubSectionKey = (typeof OVERALL_STRATEGY_SUB_SECTIONS)[number];

export interface OverallStrategyContent {
  视觉统一性?: string;
  第一印象设计?: string;
  内容封面与简介公益策略?: string;
  内容创意建议?: string;
}

export interface OverallStrategySectionProps {
  content?: OverallStrategyContent | null;
  className?: string;
}

const H3_LABEL = STEP3_OUTPUT_H3_6[5]!.h3Label; // '整体包装策略'

interface SubSectionProps {
  label: OverallStrategySubSectionKey;
  description?: string;
}

function SubSection({ label, description }: SubSectionProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-on-surface/80">{label}</p>
      {description ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      ) : (
        <div className="animate-pulse space-y-1">
          <div className="h-3 bg-muted/40 rounded w-full" />
          <div className="h-3 bg-muted/40 rounded w-3/4" />
        </div>
      )}
    </div>
  );
}

export function OverallStrategySection({ content, className }: OverallStrategySectionProps) {
  // empty state: content === null (explicit null means generated but empty)
  if (content === null) {
    return (
      <div className={cn('space-y-3', className)}>
        <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
          <FlameIcon className="h-4 w-4 shrink-0" size={4} />
          {H3_LABEL}
        </h3>
        <SubCard>
          <p className="text-xs text-muted-foreground text-center py-4">
            暂无内容 · 点击"生成账号包装方案"开始
          </p>
        </SubCard>
      </div>
    );
  }

  const hasContent = content !== undefined;

  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row */}
      <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
        <FlameIcon className="h-4 w-4 shrink-0" size={4} />
        {H3_LABEL}
      </h3>

      {/* 4 strategic sub-sections — AC-3: 无 action button */}
      <SubCard>
        <div className="space-y-4">
          {OVERALL_STRATEGY_SUB_SECTIONS.map((label) => (
            <SubSection
              key={label}
              label={label}
              description={hasContent ? content[label] : undefined}
            />
          ))}
        </div>
      </SubCard>
    </div>
  );
}
