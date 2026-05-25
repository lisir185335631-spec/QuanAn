/**
 * video-types.ts — 6 视频类型常量 · PRD-22 US-004
 * AC-2 字面锁 · D-221
 * 2026-05-25 · 删 emoji 字段(sally 真实无 emoji · 1:1 复刻)
 */

export interface VideoType {
  key: string;
  label: string;
  desc: string;
}

export const VIDEO_TYPES: readonly VideoType[] = [
  { key: 'monologue', label: '口播',     desc: '真人出镜讲述' },
  { key: 'plot',      label: '剧情',     desc: '故事情节演绎' },
  { key: 'vlog',      label: 'Vlog',     desc: '生活记录风格' },
  { key: 'product',   label: '产品展示', desc: '商品种草带货' },
  { key: 'interview', label: '街头采访', desc: '随机路人互动' },
  { key: 'tutorial',  label: '教程',     desc: '知识技能教学' },
] as const;
