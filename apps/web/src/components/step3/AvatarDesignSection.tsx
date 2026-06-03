import { Eye } from 'lucide-react';

import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import {
  STEP3_AVATAR_SUB_SECTIONS,
  STEP3_CTA_VIEW_ICON,
  STEP3_EMPTY_PLACEHOLDER,
  STEP3_OUTPUT_H3_6,
} from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

export type AvatarSubSectionKey = (typeof STEP3_AVATAR_SUB_SECTIONS)[number];

export interface AvatarDesignContent {
  风格?: string;
  配色方案?: string;
  主色调?: string;
  辅色调?: string;
  心理学依据?: string;
  '表情/姿态'?: string;
  '服装/造型'?: string;
  背景设计?: string;
  参考案例?: string;       // 截图实际有此 sub-section
  必含元素?: { title: string; desc: string }[];
  禁忌?: { title: string; desc: string }[];
  aiPrompt?: string;       // 头像 AI Prompt 文本
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
  label: string;
  description?: string;
}

function SubSection({ label, description }: SubSectionProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-[#374151]">{label}</p>
      {description ? (
        <p className="text-xs text-[#6b7280] leading-relaxed">{description}</p>
      ) : (
        <div className="animate-pulse space-y-1">
          <div className="h-3 bg-[#f3f4f6] rounded w-full" />
          <div className="h-3 bg-[#f3f4f6] rounded w-3/4" />
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
        <h3 className="flex items-center gap-2 text-base font-semibold text-[#111827]">
          <FlameIcon className="h-4 w-4 shrink-0" aria-hidden size={4} />
          {H3_LABEL}
        </h3>
        <SubCard>
          <p className="text-xs text-[#6b7280] text-center py-4">
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
      <h3 className="flex items-center gap-2 text-base font-semibold text-[#111827]">
        <FlameIcon className="h-4 w-4 shrink-0" aria-hidden size={4} />
        {H3_LABEL}
      </h3>

      {/* 8 sub-sections */}
      <SubCard>
        <div className="space-y-4">
          {STEP3_AVATAR_SUB_SECTIONS.map((label) => (
            <SubSection
              key={label}
              label={label}
              description={hasContent ? content[label] : undefined}
            />
          ))}
          {/* 参考案例 · 截图实际有(D-286 锁 8 sub-section 之外补) */}
          {hasContent && content.参考案例 && (
            <SubSection label={'参考案例' as never} description={content.参考案例} />
          )}
        </div>
      </SubCard>

      {/* 必含元素 sub-card · 截图新增 */}
      {hasContent && content.必含元素 && content.必含元素.length > 0 && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#374151]">必含元素</p>
            <ul className="space-y-2">
              {content.必含元素.map((item, i) => (
                <li key={i} className="text-xs text-[#6b7280] leading-relaxed">
                  <span className="text-[#002fa7] mr-1">•</span>
                  <span className="font-medium text-[#374151]">{item.title}：</span>
                  {item.desc}
                </li>
              ))}
            </ul>
          </div>
        </SubCard>
      )}

      {/* 禁忌 sub-card · 截图新增 */}
      {hasContent && content.禁忌 && content.禁忌.length > 0 && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#781621]">禁忌</p>
            <ul className="space-y-2">
              {content.禁忌.map((item, i) => (
                <li key={i} className="text-xs text-[#6b7280] leading-relaxed flex gap-2">
                  <span className="text-[#781621] shrink-0">✗</span>
                  <span>
                    <span className="font-medium text-[#374151]">{item.title}：</span>
                    {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SubCard>
      )}

      {/* 头像参考图 sub-card · 含 AI Prompt + 生成按钮 */}
      <SubCard>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#374151]">头像参考图</p>
            <Button
              variant="outline"
              size="sm"
              disabled={!canViewImage}
              onClick={onViewImage}
            >
              <Eye className="h-3.5 w-3.5 mr-1" aria-hidden />
              {STEP3_CTA_VIEW_ICON}
            </Button>
          </div>
          {hasContent && content.aiPrompt && (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#9ca3af]">AI Prompt</p>
              <p className="text-[11px] text-[#6b7280] leading-relaxed font-mono bg-[#f8f9fa] rounded p-2 whitespace-pre-wrap">
                {content.aiPrompt}
              </p>
            </div>
          )}
          {hasContent && content.referenceImageUrl ? (
            <img
              src={content.referenceImageUrl}
              alt="头像参考图"
              className="w-full rounded-md object-cover"
            />
          ) : (
            <div className="border border-dashed border-[#e5e7eb] rounded-md flex items-center justify-center py-8 text-xs text-[#6b7280]">
              基于AI设计方案生成头像参考图，帮助你直观了解效果
            </div>
          )}
        </div>
      </SubCard>
    </div>
  );
}
