/**
 * platforms.ts — 5 目标平台常量 · PRD-22 US-001
 * D1A 字面锁 · spec §Ⅹ.1 · douyin/xiaohongshu/shipinhao/kuaishou/bilibili
 */

export interface Platform {
  key: string;
  label: string;
  emoji: string;
  icon: string;
}

export const PLATFORMS: readonly Platform[] = [
  { key: 'douyin',      label: '抖音',   emoji: '📱', icon: 'douyin' },
  { key: 'xiaohongshu', label: '小红书', emoji: '📕', icon: 'xiaohongshu' },
  { key: 'shipinhao',   label: '视频号', emoji: '📺', icon: 'shipinhao' },
  { key: 'kuaishou',    label: '快手',   emoji: '🎬', icon: 'kuaishou' },
  { key: 'bilibili',    label: 'B站',    emoji: '📺', icon: 'bilibili' },
] as const;
