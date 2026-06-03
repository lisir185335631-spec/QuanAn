/**
 * QuanAn · 14 呈现形式 (旧 schema · 已废弃)
 * 派生自 ARCHITECTURE.md §3.6 + spec.md §Ⅹ.6 实测
 *
 * @deprecated 此文件的 key 集合 (oral_solo / dialogue / ...) 与 PRD-27 US-003 规范不符。
 *   请使用 @quanan/schemas/specialist-io 的 PRESENTATION_STYLE_IDS (14 个标准 key)。
 *   本文件暂时保留以兼容可能的历史数据，不应引入新的 import。
 */

export interface PresentStyle {
  key: string;
  emoji: string;
  label: string;
  desc: string;
  /** 适合的脚本类型 keys */
  suitableScriptTypes?: readonly string[];
}

export const PRESENT_STYLES: readonly PresentStyle[] = [
  { key: 'oral_solo',     emoji: '🎤', label: '口播单人',  desc: '一人对镜头讲 · 最简单 · 适合知识 / 观点',
    suitableScriptTypes: ['opinion', 'knowledge', 'qna', 'motivation'] },
  { key: 'dialogue',      emoji: '💬', label: '双人对话',  desc: '两人 / 多人对谈 · 节奏快 · 信息密度高',
    suitableScriptTypes: ['debate', 'interview'] },
  { key: 'documentary',   emoji: '🎬', label: '纪实拍摄',  desc: '跟拍真实场景 · 强代入感',
    suitableScriptTypes: ['daily', 'process', 'behind'] },
  { key: 'tutorial',      emoji: '📚', label: '教学讲解',  desc: '步骤清晰 · 信息分块 · 适合教知识',
    suitableScriptTypes: ['knowledge', 'process'] },
  { key: 'before_after',  emoji: '🔄', label: '前后对比',  desc: '对比视觉冲击 · 适合蜕变 / 测评',
    suitableScriptTypes: ['transform', 'review'] },
  { key: 'street_talk',   emoji: '🛣️', label: '街头采访',  desc: '随机性高 · 真实反应 · 流量大',
    suitableScriptTypes: ['interview', 'reaction'] },
  { key: 'demo_review',   emoji: '🛠️', label: '实操测评',  desc: '亲自试用 · 客观评价',
    suitableScriptTypes: ['review', 'process'] },
  { key: 'storytelling',  emoji: '📖', label: '故事演绎',  desc: '剧情化展开 · 强情绪曲线',
    suitableScriptTypes: ['story', 'comedy'] },
  { key: 'compilation',   emoji: '📋', label: '盘点合辑',  desc: '清单化呈现 · 信息密度高 · 收藏率高',
    suitableScriptTypes: ['list', 'knowledge'] },
  { key: 'split_screen',  emoji: '⬛', label: '分屏对比',  desc: '同屏对比 · 视觉差异强烈',
    suitableScriptTypes: ['transform', 'review', 'debate'] },
  { key: 'reaction',      emoji: '😲', label: '反应录制',  desc: '记录他人反应 · 情绪感染力',
    suitableScriptTypes: ['reaction', 'interview'] },
  { key: 'animated',      emoji: '🎨', label: '动画图文',  desc: '动画 / 图文卡 · 适合科普 / 抽象概念',
    suitableScriptTypes: ['knowledge', 'opinion'] },
  { key: 'vlog',          emoji: '📹', label: 'Vlog 日常', desc: '生活记录 · 真实人设 · 慢节奏',
    suitableScriptTypes: ['daily', 'behind'] },
  { key: 'live_stream',   emoji: '📡', label: '直播切片',  desc: '从直播剪精彩片段 · 真实 · 节奏紧',
    suitableScriptTypes: ['product', 'qna'] },
] as const;

export const PRESENT_STYLE_KEYS = PRESENT_STYLES.map((p) => p.key) as readonly string[];

export const PRESENT_STYLE_BY_KEY: Record<string, PresentStyle> = PRESENT_STYLES.reduce(
  (acc, p) => ({ ...acc, [p.key]: p }),
  {} as Record<string, PresentStyle>,
);

// === 自检 ===
if (PRESENT_STYLES.length !== 14) {
  throw new Error(`Expected 14 present styles, got ${PRESENT_STYLES.length}`);
}
