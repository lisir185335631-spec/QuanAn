/**
 * evolution constants · sally 1:1 복刻版 unit tests
 * 5 levels + icon 类型 + 字面 const 完整验收
 */
import { BookOpen, Crown, Leaf, Sprout, Trees } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import {
  EVOLUTION_ARCHIVE_DONE_CHIP,
  EVOLUTION_ARCHIVE_MOCK,
  EVOLUTION_ARCHIVE_TITLE,
  EVOLUTION_BREADCRUMB_LEFT,
  EVOLUTION_DEFAULT_ARCHIVES,
  EVOLUTION_DEFAULT_FEEDBACKS,
  EVOLUTION_DEFAULT_LEVEL_ID,
  EVOLUTION_DEFAULT_NEXT_NEED,
  EVOLUTION_DEFAULT_STATS,
  EVOLUTION_DIR_DEFAULT_TAG,
  EVOLUTION_FEEDBACK_EMPTY_DESC,
  EVOLUTION_FEEDBACK_EMPTY_TITLE,
  EVOLUTION_FEEDBACK_TITLE,
  EVOLUTION_H1,
  EVOLUTION_INSIGHT_EMPTY_DESC,
  EVOLUTION_INSIGHT_EMPTY_TITLE,
  EVOLUTION_INSIGHT_TITLE,
  EVOLUTION_LEVEL_INFO_TPL,
  EVOLUTION_LEVEL_NEXT_TPL,
  EVOLUTION_LEVEL_TITLE_TPL,
  EVOLUTION_LEVELS_5,
  EVOLUTION_SETTING_AUTO_DESC,
  EVOLUTION_SETTING_AUTO_LABEL,
  EVOLUTION_SETTING_DIR_DESC,
  EVOLUTION_SETTING_DIR_LABEL,
  EVOLUTION_SETTINGS_TITLE,
  EVOLUTION_STAT_LABELS,
  EVOLUTION_SUBTITLE_PARTS,
  EVOLUTION_TOAST_AUTO_OFF,
  EVOLUTION_TOAST_AUTO_ON,
  EVOLUTION_TOAST_TRIGGER,
  EVOLUTION_TRIGGER_BTN,
} from '@/lib/constants/evolution';

describe('evolution constants · sally 1:1 字面锁', () => {
  // ── EVOLUTION_LEVELS_5 ──────────────────────────────────────────────────────

  it('EVOLUTION_LEVELS_5 长度为 5', () => {
    expect(EVOLUTION_LEVELS_5).toHaveLength(5);
  });

  it('EVOLUTION_LEVELS_5 id 序列 L1-L5', () => {
    expect(EVOLUTION_LEVELS_5.map((l) => l.id)).toEqual([
      'L1', 'L2', 'L3', 'L4', 'L5',
    ]);
  });

  it('EVOLUTION_LEVELS_5 label 字面', () => {
    expect(EVOLUTION_LEVELS_5.map((l) => l.label)).toEqual([
      '初始化', '学习中', '成长期', '成熟期', '大师级',
    ]);
  });

  it('EVOLUTION_LEVELS_5 icon 类型映射(lucide · 5 枚)', () => {
    expect(EVOLUTION_LEVELS_5[0]!.icon).toBe(Sprout);
    expect(EVOLUTION_LEVELS_5[1]!.icon).toBe(BookOpen);
    expect(EVOLUTION_LEVELS_5[2]!.icon).toBe(Leaf);
    expect(EVOLUTION_LEVELS_5[3]!.icon).toBe(Trees);
    expect(EVOLUTION_LEVELS_5[4]!.icon).toBe(Crown);
  });

  it('EVOLUTION_LEVELS_5 range 字面', () => {
    expect(EVOLUTION_LEVELS_5.map((l) => l.range)).toEqual([
      '0-4 反馈',
      '5-19 反馈',
      '20-49 反馈',
      '50-99 反馈',
      '100+ 反馈',
    ]);
  });

  // ── header const ─────────────────────────────────────────────────────────────

  it('EVOLUTION_BREADCRUMB_LEFT === EVOLUTION', () => {
    expect(EVOLUTION_BREADCRUMB_LEFT).toBe('EVOLUTION');
  });

  it('EVOLUTION_H1 字面', () => {
    expect(EVOLUTION_H1).toBe('智能体进化中心');
  });

  it('EVOLUTION_SUBTITLE_PARTS 完整字面(含全角标点)', () => {
    expect(EVOLUTION_SUBTITLE_PARTS.prefix).toBe('你的智能体通过');
    expect(EVOLUTION_SUBTITLE_PARTS.highlight1).toBe('反馈学习');
    expect(EVOLUTION_SUBTITLE_PARTS.middle).toBe('和');
    expect(EVOLUTION_SUBTITLE_PARTS.highlight2).toBe('深度学习');
    expect(EVOLUTION_SUBTITLE_PARTS.suffix).toBe('持续进化，越用越懂你');
  });

  it('EVOLUTION_TRIGGER_BTN 字面', () => {
    expect(EVOLUTION_TRIGGER_BTN).toBe('触发进化');
  });

  // ── template functions ────────────────────────────────────────────────────────

  it('EVOLUTION_LEVEL_TITLE_TPL 全角冒号', () => {
    expect(EVOLUTION_LEVEL_TITLE_TPL('L1', '初始化')).toBe('进化等级 L1：初始化');
  });

  it('EVOLUTION_LEVEL_INFO_TPL 字面', () => {
    expect(EVOLUTION_LEVEL_INFO_TPL(0, 1)).toBe(
      '已收集 0 条反馈 · 1 个深度学习档案',
    );
  });

  it('EVOLUTION_LEVEL_NEXT_TPL 字面', () => {
    expect(EVOLUTION_LEVEL_NEXT_TPL(5)).toBe('距离下一等级还需 5 条反馈');
  });

  // ── stat labels ───────────────────────────────────────────────────────────────

  it('EVOLUTION_STAT_LABELS 4 字段字面', () => {
    expect(EVOLUTION_STAT_LABELS.good).toBe('好评数');
    expect(EVOLUTION_STAT_LABELS.needsImprove).toBe('待改进');
    expect(EVOLUTION_STAT_LABELS.learningArchive).toBe('学习档案');
    expect(EVOLUTION_STAT_LABELS.satisfaction).toBe('满意率');
  });

  // ── empty col ─────────────────────────────────────────────────────────────────

  it('EVOLUTION_INSIGHT_* 字面', () => {
    expect(EVOLUTION_INSIGHT_TITLE).toBe('进化洞察');
    expect(EVOLUTION_INSIGHT_EMPTY_TITLE).toBe('还没有进化洞察');
    expect(EVOLUTION_INSIGHT_EMPTY_DESC).toContain('触发进化');
  });

  it('EVOLUTION_FEEDBACK_* 字面(含 emoji)', () => {
    expect(EVOLUTION_FEEDBACK_TITLE).toBe('最近反馈');
    expect(EVOLUTION_FEEDBACK_EMPTY_TITLE).toBe('还没有反馈记录');
    expect(EVOLUTION_FEEDBACK_EMPTY_DESC).toContain('👍');
    expect(EVOLUTION_FEEDBACK_EMPTY_DESC).toContain('👎');
  });

  // ── archive ───────────────────────────────────────────────────────────────────

  it('EVOLUTION_ARCHIVE_MOCK 1 条 · 字面 title + done', () => {
    expect(EVOLUTION_ARCHIVE_MOCK).toHaveLength(1);
    expect(EVOLUTION_ARCHIVE_MOCK[0]!.title).toBe('文案学习 2026/5/25 (1篇)');
    expect(EVOLUTION_ARCHIVE_MOCK[0]!.done).toBe(true);
  });

  it('EVOLUTION_ARCHIVE_TITLE / DONE_CHIP 字面', () => {
    expect(EVOLUTION_ARCHIVE_TITLE).toBe('深度学习档案');
    expect(EVOLUTION_ARCHIVE_DONE_CHIP).toBe('已学习');
  });

  // ── settings ─────────────────────────────────────────────────────────────────

  it('EVOLUTION_SETTINGS_TITLE 字面', () => {
    expect(EVOLUTION_SETTINGS_TITLE).toBe('进化设置');
  });

  it('settings row labels + descs 字面(含全角括号)', () => {
    expect(EVOLUTION_SETTING_AUTO_LABEL).toBe('自动进化');
    expect(EVOLUTION_SETTING_AUTO_DESC).toBe('根据反馈自动优化生成质量');
    expect(EVOLUTION_SETTING_DIR_LABEL).toBe('进化方向');
    expect(EVOLUTION_SETTING_DIR_DESC).toBe('综合优化（积累反馈后自动生成）');
    expect(EVOLUTION_DIR_DEFAULT_TAG).toBe('L1 初始化');
  });

  // ── default mock state ────────────────────────────────────────────────────────

  it('EVOLUTION_DEFAULT_* 数值', () => {
    expect(EVOLUTION_DEFAULT_LEVEL_ID).toBe('L1');
    expect(EVOLUTION_DEFAULT_FEEDBACKS).toBe(0);
    expect(EVOLUTION_DEFAULT_ARCHIVES).toBe(1);
    expect(EVOLUTION_DEFAULT_NEXT_NEED).toBe(5);
    expect(EVOLUTION_DEFAULT_STATS.good).toBe(0);
    expect(EVOLUTION_DEFAULT_STATS.needsImprove).toBe(0);
    expect(EVOLUTION_DEFAULT_STATS.learningArchive).toBe(1);
    expect(EVOLUTION_DEFAULT_STATS.satisfaction).toBe(0);
  });

  // ── toast strings ─────────────────────────────────────────────────────────────

  it('toast strings 字面(含全角中点)', () => {
    expect(EVOLUTION_TOAST_TRIGGER).toBe('触发进化 · 即将上线');
    expect(EVOLUTION_TOAST_AUTO_ON).toBe('自动进化已开启');
    expect(EVOLUTION_TOAST_AUTO_OFF).toBe('自动进化已关闭');
  });
});
