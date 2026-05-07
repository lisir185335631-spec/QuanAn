/**
 * QuanQn · 5 进化等级
 * 派生自 ARCHITECTURE.md §2.6 + §5.6 + spec.md §8.5.3 + ADR-008/009
 */

export type EvolutionLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export interface EvolutionLevelConfig {
  level: EvolutionLevel;
  name: string;
  emoji: string;
  /** 升级到此等级需要的累计反馈数 */
  threshold: number;
  desc: string;
  /** 此等级解锁的功能 */
  unlocked: readonly string[];
}

export const EVOLUTION_LEVELS: readonly EvolutionLevelConfig[] = [
  { level: 'L1', name: '初始化',  emoji: '🌱', threshold: 0,   desc: '刚注册 · 进化档案为空',
    unlocked: [] },
  { level: 'L2', name: '学习中',  emoji: '📚', threshold: 5,   desc: '可手动触发首次进化',
    unlocked: ['manual_evolve', 'view_insights'] },
  { level: 'L3', name: '成长期',  emoji: '🌿', threshold: 20,  desc: '可启用自动进化开关',
    unlocked: ['auto_evolution', 'view_evolution_history'] },
  { level: 'L4', name: '成熟期',  emoji: '🌳', threshold: 50,  desc: '可选进化方向(创意/转化/真实)',
    unlocked: ['direction_creative', 'direction_conversion', 'direction_real'] },
  { level: 'L5', name: '大师级',  emoji: '👑', threshold: 100, desc: '档案稳定 · 可克隆到其他账号',
    unlocked: ['clone_to_other_accounts'] },
] as const;

export const EVOLUTION_LEVEL_KEYS = EVOLUTION_LEVELS.map((l) => l.level) as readonly EvolutionLevel[];

/** 根据反馈累计数推断当前等级 */
export function inferLevel(feedbackTotal: number): EvolutionLevel {
  for (let i = EVOLUTION_LEVELS.length - 1; i >= 0; i--) {
    const cfg = EVOLUTION_LEVELS[i]!;
    if (feedbackTotal >= cfg.threshold) return cfg.level;
  }
  return 'L1';
}

/** 进化方向(L4+ 可选) */
export const EVOLUTION_DIRECTIONS = ['综合', '创意性', '转化率', '真实感'] as const;
export type EvolutionDirection = (typeof EVOLUTION_DIRECTIONS)[number];

if (EVOLUTION_LEVELS.length !== 5) {
  throw new Error(`Expected 5 evolution levels, got ${EVOLUTION_LEVELS.length}`);
}
