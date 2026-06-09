import { FlameIcon } from '@/components/icons/aiipznt-icons';
import { C, F } from '@/components/home-next/ikb/system';
import { Button } from '@/components/ui/button';
import { SubCard } from '@/components/ui/sub-card';
import {
  STEP3_BACKGROUND_SUB_SECTIONS,
  STEP3_CTA_GENERATE_REFERENCE,
  STEP3_OUTPUT_H3_6,
} from '@/lib/constants/step3';
import { cn } from '@/lib/utils';

import { PlatformColumnCard, type BgPlatformKey } from './PlatformColumnCard';

export type BgSubSectionKey = (typeof STEP3_BACKGROUND_SUB_SECTIONS)[number];

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
  // 截图新增 sub-section · 不动 D-locks · 加 optional
  文案内容?: { title: string; desc: string }[];   // 核心Slogan / 服务关键词 / 联系方式 / 科技感元素
  必含元素?: { title: string; desc: string }[];   // (与 avatar.必含元素 同样结构)
  平台适配?: { platform: string; size: string; desc: string }[]; // 抖音 1920x1080 等
  aiPrompt?: string;                              // 背景图 AI Prompt
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
        <h3 className="flex items-center gap-2 text-base font-semibold" style={{ color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
          <FlameIcon className="h-4 w-4 shrink-0" aria-hidden size={4} />
          {H3_LABEL}
        </h3>
        <Button
          variant="outline"
          size="sm"
          disabled={content === null || !canGenerate}
          onClick={onGenerate}
        >
          {STEP3_CTA_GENERATE_REFERENCE}
        </Button>
      </div>

      {/* 8 sub-sections */}
      <SubCard>
        <div className="space-y-4">
          {STEP3_BACKGROUND_SUB_SECTIONS.map((label) => (
            <SubSection
              key={label}
              label={label}
              description={hasContent ? content[label] : undefined}
            />
          ))}
        </div>
      </SubCard>

      {/* 文案内容 sub-card · 截图新增 */}
      {hasContent && content.文案内容 && content.文案内容.length > 0 && (
        <SubCard>
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>文案内容</p>
            <ul className="space-y-2">
              {content.文案内容.map((item, i) => (
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

      {/* 平台适配 sub-card · 截图新增 · 抖音/小红书/视频号 尺寸+内容 */}
      {hasContent && content.平台适配 && content.平台适配.length > 0 && (
        <SubCard>
          <div className="space-y-3">
            <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>平台适配</p>
            <div className="grid grid-cols-3 gap-3">
              {content.平台适配.map((item, i) => (
                <div key={i} className="space-y-1 p-3 rounded-lg" style={{ border: `0.5px solid ${C.line}`, background: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn }}>{item.platform}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>尺寸：{item.size}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </SubCard>
      )}

      {/* 背景图参考图 sub-card · AI Prompt + 3 平台 grid */}
      <SubCard>
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: C.ikb, fontFamily: F.cn, textShadow: C.textShadow }}>背景图参考图</p>
          {hasContent && content.aiPrompt && (
            <div className="space-y-1">
              <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}>AI Prompt</p>
              <p className="text-[11px] leading-relaxed whitespace-pre-wrap rounded p-2" style={{ color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, background: 'rgba(255,255,255,0.07)', border: `0.5px solid ${C.line}`, textShadow: C.textShadow }}>
                {content.aiPrompt}
              </p>
            </div>
          )}
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
      </SubCard>
    </div>
  );
}
