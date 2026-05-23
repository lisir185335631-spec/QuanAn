import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import { STEP3_BUTTON_GEN_IMAGE, STEP3_OUTPUT_H3_6 } from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

import { PlatformColumnCard, type BgPlatformKey } from './PlatformColumnCard';

// AC-3 字面锁: 8 sub-section 顺序不可改
const BG_SUB_SECTIONS = [
  '风格理念',
  '布局结构',
  '色调',
  '主色调',
  '辅色调',
  '品牌元素',
  '字体/icon',
  '分镜建议',
] as const;

export type BgSubSectionKey = (typeof BG_SUB_SECTIONS)[number];

// D-288 锁: 只 3 平台, 快手/B站不在背景图区
const BG_PLATFORM_KEYS: BgPlatformKey[] = ['douyin', 'xiaohongshu', 'shipinhao'];

export interface BackgroundImageContent {
  风格理念?: string;
  布局结构?: string;
  色调?: string;
  主色调?: string;
  辅色调?: string;
  品牌元素?: string;
  '字体/icon'?: string;
  分镜建议?: string;
  platformImages?: Partial<Record<BgPlatformKey, string | null>>;
}

export interface BackgroundImageDesignSectionProps {
  content?: BackgroundImageContent | null;
  canGenerate?: boolean;
  onGenerate?: () => void;
  className?: string;
}

const H3_LABEL = STEP3_OUTPUT_H3_6[3]!.h3Label; // '背景图设计方案'

interface SubSectionProps {
  label: BgSubSectionKey;
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

export function BackgroundImageDesignSection({
  content,
  canGenerate = false,
  onGenerate,
  className,
}: BackgroundImageDesignSectionProps) {
  const hasContent = content !== undefined && content !== null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* H3 row: FlameIcon + title + [生成参考图] button */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-on-surface">
          <FlameIcon className="h-4 w-4 shrink-0" size={4} />
          {H3_LABEL}
        </h3>
        <Button
          variant="outline"
          size="sm"
          disabled={content === null || !canGenerate}
          onClick={onGenerate}
        >
          {STEP3_BUTTON_GEN_IMAGE}
        </Button>
      </div>

      {/* 8 sub-sections */}
      <SubCard>
        <div className="space-y-4">
          {BG_SUB_SECTIONS.map((label) => (
            <SubSection
              key={label}
              label={label}
              description={hasContent ? content[label] : undefined}
            />
          ))}
        </div>
      </SubCard>

      {/* 3 平台横向 column grid — D-288 锁: 只 douyin/xiaohongshu/shipinhao */}
      <div className="grid grid-cols-3 gap-4">
        {BG_PLATFORM_KEYS.map((key) => (
          <PlatformColumnCard
            key={key}
            platformKey={key}
            referenceImageUrl={hasContent ? content.platformImages?.[key] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
