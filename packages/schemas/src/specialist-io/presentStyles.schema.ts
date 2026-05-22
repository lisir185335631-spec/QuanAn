/**
 * PresentStyles Specialist I/O schemas — PRD-27 US-003
 * PresentationAgent: recommend 3-5 presentation styles from 14 spec §27.5 keys
 *
 * AC-2: PresentationOutput zod schema with recommendedStyles
 * AC-3: 14 enum keys strict per spec §27.5 (lowercase + underscore)
 * AC-8: PresentationInput + PresentationOutput shared across frontend/backend
 */

import { z } from 'zod';

// ── 14 enum keys (spec §27.5 · 0 字面漂移) ────────────────────────────────────

export const PRESENTATION_STYLE_IDS = [
  'talking_head',
  'drama',
  'tutorial',
  'vlog',
  'street_interview',
  'comparison',
  'list_style',
  'mashup',
  'screen_record',
  'animation',
  'reaction',
  'before_after',
  'pov',
  'qa',
] as const;

export type PresentationStyleId = (typeof PRESENTATION_STYLE_IDS)[number];

// ── Platform constants (kept for form UI) ────────────────────────────────────

export const PRESENT_STYLE_PLATFORMS = [
  'douyin',
  'xiaohongshu',
  'shipinhao',
  'kuaishou',
  'bilibili',
  'weibo',
  'wechat',
] as const;

export type PresentStylePlatform = (typeof PRESENT_STYLE_PLATFORMS)[number];

// ── Input schema ──────────────────────────────────────────────────────────────

export const PresentationInputSchema = z.object({
  text: z.string().min(10, { message: '文案至少10字' }).max(2000),
  platform: z.string().min(1).max(50),
});

export type PresentationInput = z.infer<typeof PresentationInputSchema>;

// ── Output schema ─────────────────────────────────────────────────────────────

export const PresentationOutputItemSchema = z.object({
  id: z.enum(PRESENTATION_STYLE_IDS),
  label: z.string(),
  description: z.string(),
  tips: z.string(),
  matchScore: z.number().min(0).max(100),
  rationale: z.string(),
});

export const PresentationOutputSchema = z.object({
  recommendedStyles: z.array(PresentationOutputItemSchema).min(3).max(5),
});

export type PresentationOutputItem = z.infer<typeof PresentationOutputItemSchema>;
export type PresentationOutput = z.infer<typeof PresentationOutputSchema>;

// ── Legacy exports (backward compat — PRD-15 US-004 remaining refs) ───────────

/** @deprecated Use PRESENTATION_STYLE_IDS */
export const PRESENT_STYLE_TYPES = PRESENTATION_STYLE_IDS;
/** @deprecated Use PresentationStyleId */
export type PresentStyleType = PresentationStyleId;

// ── Input schema (legacy alias) ───────────────────────────────────────────────

export const PresentStylesInputSchema = PresentationInputSchema;
export type PresentStylesInput = PresentationInput;
