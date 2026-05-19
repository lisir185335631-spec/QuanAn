/**
 * QuanAn · 视频时长枚举 — PRD-6 US-001
 * 派生自 ARCHITECTURE.md §6.6 VideoAgent + PROMPTS.md §6.4
 * LD-013: as const satisfies ReadonlyArray pattern
 */

export const VIDEO_DURATIONS = ['15s', '30s', '60s', '180s'] as const satisfies ReadonlyArray<string>;

export type VideoDuration = (typeof VIDEO_DURATIONS)[number];

export const VIDEO_DURATION_LABELS: Record<VideoDuration, string> = {
  '15s': '15 秒',
  '30s': '30 秒',
  '60s': '60 秒',
  '180s': '3 分钟',
} as const;
