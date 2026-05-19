/**
 * QuanAn · 视频类型枚举 — PRD-6 US-001
 * 派生自 ARCHITECTURE.md §6.6 VideoAgent 4 mode + PROMPTS.md §6.4
 * LD-013: as const satisfies ReadonlyArray pattern
 */

export const VIDEO_TYPES = ['short_form', 'long_form'] as const satisfies ReadonlyArray<string>;

export type VideoType = (typeof VIDEO_TYPES)[number];

export const VIDEO_TYPE_LABELS: Record<VideoType, string> = {
  short_form: '短视频',
  long_form: '长视频',
} as const;
