import { Eye } from 'lucide-react';

import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import { STEP3_OUTPUT_H3_6 } from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

// 8 sub-section labels — D-286 锁: 严守字面顺序, 禁止改写
const AVATAR_SUB_SECTIONS = [
  '风格',
  '配色方案',
  '主色调',
  '辅色调',
  '心理学依据',
  '表情/姿态',
  '服装/造型',
  '背景设计',
] as const;

export type AvatarSubSectionKey = (typeof AVATAR_SUB_SECTIONS)[number];

export interface AvatarDesignContent {
  风格?: string;
  配色方案?: string;
  主色调?: string;
  辅色调?: string;
  心理学依据?: string;
  '表情/姿态'?: string;
  '服装/造型'?: string;
  背景设计?: string;
  referenceImageUrl?: string | null;
}

export interface AvatarDesignSectionProps {
  content?: AvatarDesignContent | null;
  canViewImage?: boolean;
  onViewImage?: () => void;
  className?: string;
}

const H3_LABEL = STEP3_OUTPUT_H3_6[2]!.h3Label; // '头像设计方案'

interface SubSectionProps {
  label: AvatarSubSectionKey;
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

export function AvatarDesignSection({
  content,
  canViewImage = false,
  onViewImage,
  className,
}: AvatarDesignSectionProps) {
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

      {/* 8 sub-sections */}
      <SubCard>
        <div className="space-y-4">
          {AVATAR_SUB_SECTIONS.map((label) => (
            <SubSection
              key={label}
              label={label}
              description={hasContent ? content[label] : undefined}
            />
          ))}
        </div>
      </SubCard>

      {/* 参考图样例 sub-card — D-287 锁: button 字面 '[查看图标]' */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-on-surface/80">参考图样例</p>
          {hasContent && content.referenceImageUrl ? (
            <img
              src={content.referenceImageUrl}
              alt="头像参考图"
              className="w-full rounded-md object-cover"
            />
          ) : (
            <div className="border border-dashed border-border/60 rounded-md flex items-center justify-center py-8 text-xs text-muted-foreground">
              点击"查看图标"生成参考图
            </div>
          )}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={!canViewImage}
              onClick={onViewImage}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              查看图标
            </Button>
          </div>
        </div>
      </SubCard>
    </div>
  );
}
