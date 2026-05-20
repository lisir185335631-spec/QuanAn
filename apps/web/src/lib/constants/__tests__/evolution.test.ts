/**
 * PRD-24 US-002 · evolution constants unit tests (D-233 AC-8)
 * 字面锁验证: EVOLUTION_LEVELS_5 / EVOLUTION_MODULES_5 / EVOLUTION_DIRECTIONS_4
 */
import { describe, expect, it } from 'vitest';

import {
  EVOLUTION_DIRECTIONS_4,
  EVOLUTION_LEVELS_5,
  EVOLUTION_MODULES_5,
  EVOLUTION_SUBTITLE,
} from '@/lib/constants/evolution';

describe('evolution constants · D-237/D-238 字面锁', () => {
  it('AC-2 · EVOLUTION_LEVELS_5 长度为 5', () => {
    expect(EVOLUTION_LEVELS_5).toHaveLength(5);
  });

  it('AC-2 · EVOLUTION_LEVELS_5 字面 1:1 spec §8.5.3 (完整字面对照)', () => {
    expect(EVOLUTION_LEVELS_5).toEqual([
      { id: 'L1', emoji: '🌱', label: '初始化', range: '0-4 反馈' },
      { id: 'L2', emoji: '📚', label: '学习中', range: '5-19 反馈' },
      { id: 'L3', emoji: '🌿', label: '成长期', range: '20-49 反馈' },
      { id: 'L4', emoji: '🌳', label: '成熟期', range: '50-99 反馈' },
      { id: 'L5', emoji: '👑', label: '大师级', range: '100+ 反馈' },
    ]);
  });

  it('AC-3 · EVOLUTION_MODULES_5 长度为 5', () => {
    expect(EVOLUTION_MODULES_5).toHaveLength(5);
  });

  it('AC-3 · EVOLUTION_MODULES_5 字面锁(顺序 + 全量)', () => {
    expect(Array.from(EVOLUTION_MODULES_5)).toEqual([
      '进化等级',
      '进化洞察',
      '最近反馈',
      '深度学习档案',
      '进化设置',
    ]);
  });

  it('AC-4 · EVOLUTION_DIRECTIONS_4 长度为 4', () => {
    expect(EVOLUTION_DIRECTIONS_4).toHaveLength(4);
  });

  it('AC-4 · EVOLUTION_DIRECTIONS_4 字面锁(全量字面对照)', () => {
    expect(EVOLUTION_DIRECTIONS_4).toContain('综合优化（积累反馈后自动生成）');
    expect(EVOLUTION_DIRECTIONS_4).toContain('创意性优先');
    expect(EVOLUTION_DIRECTIONS_4).toContain('转化率优先');
    expect(EVOLUTION_DIRECTIONS_4).toContain('真实感优先');
  });

  it('AC-1 · EVOLUTION_SUBTITLE spec §8.5.3 字面对照', () => {
    expect(EVOLUTION_SUBTITLE).toBe(
      '你的智能体通过反馈学习和深度学习持续进化，越用越懂你',
    );
  });
});
