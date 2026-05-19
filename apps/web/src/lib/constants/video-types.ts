/**
 * video-types.ts — 6 视频类型常量 · PRD-22 US-004
 * AC-2 字面锁 · D-221
 */

export interface VideoType {
  key: string;
  emoji: string;
  label: string;
  desc: string;
}

export const VIDEO_TYPES: readonly VideoType[] = [
  { key: 'monologue', emoji: '🗣', label: '口播',     desc: '真人出镜讲述' },
  { key: 'plot',      emoji: '🎬', label: '剧情',     desc: '故事情节演绎' },
  { key: 'vlog',      emoji: '📹', label: 'Vlog',     desc: '生活记录风格' },
  { key: 'product',   emoji: '🛍', label: '产品展示', desc: '商品种草带货' },
  { key: 'interview', emoji: '🎤', label: '街头采访', desc: '随机路人互动' },
  { key: 'tutorial',  emoji: '📚', label: '教程',     desc: '知识技能教学' },
] as const;
