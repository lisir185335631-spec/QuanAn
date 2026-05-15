/**
 * PresentStyles Specialist I/O schemas — PRD-15 US-004
 * PresentationAgent: recommend 3-5 presentation styles for given content
 */

import { z } from 'zod';

export const PRESENT_STYLE_TYPES = [
  'graphic_text',
  'short_video',
  'live_stream',
  'long_article',
  'comic',
] as const;

export const PRESENT_STYLE_LABELS: Record<(typeof PRESENT_STYLE_TYPES)[number], string> = {
  graphic_text: '图文',
  short_video: '短视频',
  live_stream: '直播口播',
  long_article: '长图文',
  comic: '漫画',
};

export const PRESENT_STYLE_PLATFORMS = [
  'douyin',
  'xiaohongshu',
  'shipinhao',
  'kuaishou',
  'bilibili',
  'weibo',
  'wechat',
] as const;

export type PresentStyleType = (typeof PRESENT_STYLE_TYPES)[number];
export type PresentStylePlatform = (typeof PRESENT_STYLE_PLATFORMS)[number];

export const PresentStylesInputSchema = z.object({
  text: z.string().min(10, { message: '文案至少10字' }).max(2000),
  platform: z.enum(PRESENT_STYLE_PLATFORMS, { errorMap: () => ({ message: '请选择平台' }) }),
});

export const PresentStyleItemSchema = z.object({
  type: z.enum(PRESENT_STYLE_TYPES),
  label: z.string(),
  description: z.string(),
  example: z.string(),
  fitScore: z.number().int().min(0).max(100).optional(),
});

export const PresentStylesResultSchema = z.object({
  styles: z.array(PresentStyleItemSchema).min(3).max(5),
});

export type PresentStylesInput = z.infer<typeof PresentStylesInputSchema>;
export type PresentStyleItem = z.infer<typeof PresentStyleItemSchema>;
export type PresentStylesResult = z.infer<typeof PresentStylesResultSchema>;
