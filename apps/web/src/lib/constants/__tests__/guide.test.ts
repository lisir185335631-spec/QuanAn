/**
 * guide constants · unit tests (sally 1:1 复刻 · 字面锁)
 * 对齐新常量: GUIDE_CHIP_TITLE / GUIDE_FLOW / GUIDE_SECTIONS_13 / GUIDE_FAQS_4 / GUIDE_TIPS_TITLE
 */
import { describe, expect, it } from 'vitest';

import {
  FAQS,
  GUIDE_CHIP_SUBTITLE,
  GUIDE_CHIP_TITLE,
  GUIDE_FAQS_4,
  GUIDE_FAQ_TITLE,
  GUIDE_FLOW,
  GUIDE_FLOW_TITLE,
  GUIDE_MODULES,
  GUIDE_SEARCH_PLACEHOLDER,
  GUIDE_SECTIONS_13,
  GUIDE_TIPS_TITLE,
} from '../guide';

describe('guide constants · 字面锁', () => {
  it('chip title + subtitle 字面锁', () => {
    expect(GUIDE_CHIP_TITLE).toBe('USER GUIDE');
    expect(GUIDE_CHIP_SUBTITLE).toBe('产品使用说明 · 功能详解 · 最佳实践');
  });

  it('GUIDE_FLOW · 5 step + name + sub 字面锁', () => {
    expect(GUIDE_FLOW).toHaveLength(5);
    expect(GUIDE_FLOW[0]!.name).toBe('深度学习');
    expect(GUIDE_FLOW[0]!.sub).toBe('批量文案分析');
    expect(GUIDE_FLOW[1]!.name).toBe('设计变现');
    expect(GUIDE_FLOW[2]!.name).toBe('创作内容');
    expect(GUIDE_FLOW[3]!.name).toBe('制作视频');
    expect(GUIDE_FLOW[4]!.name).toBe('私域成交');
    expect(GUIDE_FLOW[4]!.sub).toBe('转化变现');
  });

  it('GUIDE_FLOW_TITLE 字面锁', () => {
    expect(GUIDE_FLOW_TITLE).toBe('推荐使用流程');
  });

  it('GUIDE_SEARCH_PLACEHOLDER 字面锁', () => {
    expect(GUIDE_SEARCH_PLACEHOLDER).toBe('搜索功能说明...');
  });

  it('GUIDE_SECTIONS_13 · 12 entries · section[0] = 系统概览', () => {
    expect(GUIDE_SECTIONS_13).toHaveLength(12);
    expect(GUIDE_SECTIONS_13[0]!.id).toBe('system_overview');
    expect(GUIDE_SECTIONS_13[0]!.name).toBe('系统概览');
    expect(GUIDE_SECTIONS_13[0]!.sub).toBe('了解AIP智能体的核心能力');
  });

  it('GUIDE_SECTIONS_13 · 每 section 有 id / icon / name / sub / steps / tips', () => {
    GUIDE_SECTIONS_13.forEach((section) => {
      expect(section).toHaveProperty('id');
      expect(section).toHaveProperty('icon');
      expect(section).toHaveProperty('name');
      expect(section).toHaveProperty('sub');
      expect(section.steps.length).toBeGreaterThanOrEqual(1);
      expect(section.tips.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('GUIDE_SECTIONS_13 · 12 section name 字面锁', () => {
    const names = GUIDE_SECTIONS_13.map((s) => s.name);
    expect(names).toContain('系统概览');
    expect(names).toContain('爆款库');
    expect(names).toContain('爆款解析');
    expect(names).toContain('呈现形式');
    expect(names).toContain('变现模型');
    expect(names).toContain('私域成交');
    expect(names).toContain('爆款生成');
    expect(names).toContain('生成文案');
    expect(names).toContain('文案分析');
    expect(names).toContain('AI视频');
    expect(names).toContain('深度学习');
    expect(names).toContain('视频制作');
    // 获客视频 已随批1删除，不再出现
  });

  it('GUIDE_FAQS_4 · 4 entries · Q 字面锁', () => {
    expect(GUIDE_FAQS_4).toHaveLength(4);
    expect(GUIDE_FAQS_4[0]!.q).toBe('AI生成的内容可以直接使用吗？');
    expect(GUIDE_FAQS_4[1]!.q).toBe('AI视频功能可以直接生成视频吗？');
    expect(GUIDE_FAQS_4[2]!.q).toBe('如何让AI更了解我的风格？');
    expect(GUIDE_FAQS_4[3]!.q).toBe('数据会被保存吗？');
  });

  it('GUIDE_FAQ_TITLE + GUIDE_TIPS_TITLE 字面锁', () => {
    expect(GUIDE_FAQ_TITLE).toBe('常见问题');
    expect(GUIDE_TIPS_TITLE).toBe('实用技巧');
  });

  it('兼容旧 export · GUIDE_MODULES 保留(11，已删获客视频) + FAQS 保留(4)', () => {
    expect(GUIDE_MODULES).toHaveLength(11);
    expect(FAQS).toHaveLength(4);
  });
});
