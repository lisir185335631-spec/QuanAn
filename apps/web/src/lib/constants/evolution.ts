/**
 * PRD-24 US-002 · /evolution constants
 * AC-2: EVOLUTION_LEVELS_5 (D-237 字面锁)
 * AC-3: EVOLUTION_MODULES_5 (D-237 字面锁)
 * AC-4: EVOLUTION_DIRECTIONS_4 (D-238 字面锁)
 */

export interface EvolutionLevel {
  id: string
  emoji: string
  label: string
  range: string
}

export const EVOLUTION_LEVELS_5: readonly EvolutionLevel[] = [
  { id: 'L1', emoji: '🌱', label: '初始化', range: '0-4 反馈' },
  { id: 'L2', emoji: '📚', label: '学习中', range: '5-19 反馈' },
  { id: 'L3', emoji: '🌿', label: '成长期', range: '20-49 反馈' },
  { id: 'L4', emoji: '🌳', label: '成熟期', range: '50-99 反馈' },
  { id: 'L5', emoji: '👑', label: '大师级', range: '100+ 反馈' },
] as const

export const EVOLUTION_MODULES_5: readonly string[] = [
  '进化等级',
  '进化洞察',
  '最近反馈',
  '深度学习档案',
  '进化设置',
] as const

export const EVOLUTION_DIRECTIONS_4: readonly string[] = [
  '综合优化（积累反馈后自动生成）',
  '创意性优先',
  '转化率优先',
  '真实感优先',
] as const

export const EVOLUTION_SUBTITLE =
  '你的智能体通过反馈学习和深度学习持续进化，越用越懂你' as const

/** Stub metrics (AC-5: grid-cols-4, stub 随机值 60-95) */
export const EVOLUTION_METRICS_STUB = {
  goodCount: 87,
  needsImprovement: 13,
  learningArchive: 5,
  satisfactionRate: 87,
} as const
