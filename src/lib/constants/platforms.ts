/**
 * QuanQn · 5 平台常量
 * 派生自 ARCHITECTURE.md §3.6 + spec.md §Ⅹ.1 实测
 */

export const PLATFORMS = [
  { key: 'douyin',      label: '抖音',    emoji: '📱', icon: 'douyin' },
  { key: 'xiaohongshu', label: '小红书',  emoji: '📕', icon: 'xiaohongshu' },
  { key: 'shipinhao',   label: '视频号',  emoji: '📺', icon: 'shipinhao' },
  { key: 'kuaishou',    label: '快手',    emoji: '🎬', icon: 'kuaishou' },
  { key: 'bilibili',    label: 'B站',     emoji: '📺', icon: 'bilibili' },
] as const;

export type PlatformKey = (typeof PLATFORMS)[number]['key'];
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_KEYS = PLATFORMS.map((p) => p.key) as readonly PlatformKey[];

export const PLATFORM_BY_KEY: Record<PlatformKey, Platform> = PLATFORMS.reduce(
  (acc, p) => ({ ...acc, [p.key]: p }),
  {} as Record<PlatformKey, Platform>,
);

/**
 * 平台规格(头像 / 背景图尺寸 · spec.md §Ⅶ.2 实测)
 */
export const PLATFORM_SPECS: Record<PlatformKey, { avatarSize: string; backgroundSize: string; bioMax: number }> = {
  douyin:      { avatarSize: '500x500',  backgroundSize: '1128x636', bioMax: 80 },
  xiaohongshu: { avatarSize: '300x300',  backgroundSize: '1080x540', bioMax: 100 },
  shipinhao:   { avatarSize: '500x500',  backgroundSize: '1080x432', bioMax: 100 },
  kuaishou:    { avatarSize: '500x500',  backgroundSize: '1080x540', bioMax: 80 },
  bilibili:    { avatarSize: '300x300',  backgroundSize: '1146x252', bioMax: 70 },
};
