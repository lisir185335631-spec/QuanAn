import { Eye } from 'lucide-react';

import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { C, F } from '@/components/home-next/ikb/system';
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
      <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>{label}</p>
      {description ? (
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>{description}</p>
      ) : (
        <div className="animate-pulse space-y-1">
          <div className="h-3 rounded w-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-3 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
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
        <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
          <FlameIcon className="h-4 w-4 shrink-0" aria-hidden size={4} />
          {H3_LABEL}
        </h3>
        <SubCard>
          <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
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
      <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
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
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>必含元素</p>
            <ul className="space-y-2">
              {content.必含元素.map((item, i) => (
                <li key={i} className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span className="mr-1" style={{ color: C.ikb }}>•</span>
                  <span className="font-medium" style={{ color: C.ink }}>{item.title}：</span>
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
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,120,120,0.95)', fontFamily: F.cn, textShadow: C.textShadow }}>禁忌</p>
            <ul className="space-y-2">
              {content.禁忌.map((item, i) => (
                <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>
                  <span className="shrink-0" style={{ color: 'rgba(255,120,120,0.95)' }}>✗</span>
                  <span>
                    <span className="font-medium" style={{ color: C.ink }}>{item.title}：</span>
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
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>头像参考图</p>
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
              <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}>AI Prompt</p>
              <p className="text-[11px] leading-relaxed whitespace-pre-wrap rounded p-2" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, background: 'rgba(255,255,255,0.07)', border: `0.5px solid ${C.line}`, textShadow: C.textShadow }}>
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
            <div className="rounded-md flex items-center justify-center py-8 text-xs" style={{ border: `1px dashed ${C.line}`, color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}>
              基于AI设计方案生成头像参考图，帮助你直观了解效果
            </div>
          )}
        </div>
      </SubCard>
    </div>
  );
}
