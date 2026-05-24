import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { SubCard } from '@/components/ui/sub-card';
import {
  STEP3_EMPTY_PLACEHOLDER,
  STEP3_OUTPUT_H3_6,
  STEP3_OVERALL_STRATEGY_SUB_SECTIONS,
} from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

export type OverallStrategySubSectionKey = (typeof STEP3_OVERALL_STRATEGY_SUB_SECTIONS)[number];

export interface OverallStrategyContent {
  视觉统一性?: string;
  第一印象设计?: string;
  内容封面与简介公益策略?: string;
  内容创意建议?: string;
  // 截图新增 sub-section · 不动 D-locks · 加 optional
  时长策略?: { stage: string; desc: string }[];     // 第1秒/2-7秒/8-15秒/16-60秒/60秒以上
  平台优势?: { platform: string; desc: string }[]; // 抖音/小红书/视频号
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
            {STEP3_EMPTY_PLACEHOLDER}
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
          {STEP3_OVERALL_STRATEGY_SUB_SECTIONS.map((label) => (
            <SubSection
              key={label}
              label={label}
              description={hasContent ? content[label] : undefined}
            />
          ))}
        </div>
      </SubCard>

      {/* 时长策略 sub-card · 截图新增 · 主页访客转化路径设计 5 阶段 */}
      {hasContent && content.时长策略 && content.时长策略.length > 0 && (
        <SubCard>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-on-surface/80">时长策略 · 主页访客转化路径设计</p>
            <ul className="space-y-2">
              {content.时长策略.map((item, i) => (
                <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-3">
                  <span className="shrink-0 inline-block text-[11px] font-mono bg-primary/15 text-primary border border-primary/30 rounded px-2 py-0.5 min-w-[5rem] text-center">
                    {item.stage}
                  </span>
                  <span className="flex-1">{item.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </SubCard>
      )}

      {/* 平台优势 sub-card · 截图新增 · 3 平台 */}
      {hasContent && content.平台优势 && content.平台优势.length > 0 && (
        <SubCard>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-on-surface/80">平台优势</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {content.平台优势.map((item, i) => (
                <div key={i} className="space-y-1 p-3 rounded border border-border/30">
                  <p className="text-xs font-semibold text-primary">{item.platform}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </SubCard>
      )}
    </div>
  );
}
