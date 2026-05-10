/**
 * QuanQn · DALL-E 3 图像风格枚举 — PRD-6 US-001
 * 派生自 ARCHITECTURE.md §7 ImageGenWorker + OpenAI DALL-E 3 API spec
 * LD-013: as const satisfies ReadonlyArray pattern
 */

export const IMAGE_STYLES = ['vivid', 'natural'] as const satisfies ReadonlyArray<string>;

export type ImageStyle = (typeof IMAGE_STYLES)[number];

export const IMAGE_STYLE_LABELS: Record<ImageStyle, string> = {
  vivid: '鲜艳(vivid) · 更具戏剧性',
  natural: '自然(natural) · 更写实',
} as const;
