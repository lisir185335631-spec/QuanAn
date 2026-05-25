/**
 * deep-learning.test.ts — constants 字面锁
 */
import { describe, expect, it } from 'vitest';

import {
  DEEP_LEARNING_CHIP,
  DEEP_LEARNING_H1,
  DEEP_LEARNING_SUBTITLE,
  DL_ARCHIVE_MOCK,
  DL_HIGHLIGHTS,
  DL_LOGIC_FIELDS,
  DL_PACKAGING_FIELDS,
  DL_STYLE_PORTRAIT_BODY,
  DL_USAGE_SECTIONS,
} from '../deep-learning';

describe('DL_LOGIC_FIELDS', () => {
  it('has 9 entries', () => {
    expect(DL_LOGIC_FIELDS).toHaveLength(9);
  });

  it('keys cover 9 expected fields', () => {
    const keys = DL_LOGIC_FIELDS.map((f) => f.key);
    expect(keys).toContain('opening');
    expect(keys).toContain('structure');
    expect(keys).toContain('language');
    expect(keys).toContain('script_type');
    expect(keys).toContain('guidance');
    expect(keys).toContain('audience');
    expect(keys).toContain('hook');
    expect(keys).toContain('emotion');
    expect(keys).toContain('viral');
  });

  it('每个 entry 的 label 以全角冒号 "：" 结尾', () => {
    for (const f of DL_LOGIC_FIELDS) {
      expect(f.label.endsWith('：')).toBe(true);
    }
  });
});

describe('DL_PACKAGING_FIELDS', () => {
  it('has 5 entries', () => {
    expect(DL_PACKAGING_FIELDS).toHaveLength(5);
  });

  it('keys cover 5 expected fields', () => {
    const keys = DL_PACKAGING_FIELDS.map((f) => f.key);
    expect(keys).toContain('brand');
    expect(keys).toContain('tone');
    expect(keys).toContain('format');
    expect(keys).toContain('topic');
    expect(keys).toContain('differentiation');
  });

  it('每个 entry 的 label 以全角冒号 "：" 结尾', () => {
    for (const f of DL_PACKAGING_FIELDS) {
      expect(f.label.endsWith('：')).toBe(true);
    }
  });
});

describe('DL_HIGHLIGHTS', () => {
  it('has 4 quotes', () => {
    expect(DL_HIGHLIGHTS).toHaveLength(4);
  });

  it('第1 quote 含 "为什么美业老板"', () => {
    expect(DL_HIGHLIGHTS[0]).toContain('为什么美业老板');
  });

  it('第2 quote 含 "20万"', () => {
    expect(DL_HIGHLIGHTS[1]).toContain('20万');
  });
});

describe('DL_USAGE_SECTIONS', () => {
  it('has 3 sections', () => {
    expect(DL_USAGE_SECTIONS).toHaveLength(3);
  });

  it('total bullets = 7', () => {
    const total = DL_USAGE_SECTIONS.reduce((sum, s) => sum + s.bullets.length, 0);
    expect(total).toBe(7);
  });

  it('section 0 title = "文件上传模式："', () => {
    const s = DL_USAGE_SECTIONS[0];
    expect(s).toBeDefined();
    expect(s?.title).toBe('文件上传模式：');
  });

  it('section 1 title = "文案粘贴模式："', () => {
    const s = DL_USAGE_SECTIONS[1];
    expect(s).toBeDefined();
    expect(s?.title).toBe('文案粘贴模式：');
  });

  it('section 2 title = "通用说明："', () => {
    const s = DL_USAGE_SECTIONS[2];
    expect(s).toBeDefined();
    expect(s?.title).toBe('通用说明：');
  });
});

describe('DL_ARCHIVE_MOCK', () => {
  it('id = "archive-1"', () => {
    expect(DL_ARCHIVE_MOCK.id).toBe('archive-1');
  });

  it('title 含 "文案学习 2026/5/25"', () => {
    expect(DL_ARCHIVE_MOCK.title).toContain('文案学习 2026/5/25');
  });

  it('logic fields = DL_LOGIC_FIELDS (9 entry)', () => {
    expect(DL_ARCHIVE_MOCK.logic).toHaveLength(9);
  });

  it('packaging fields = DL_PACKAGING_FIELDS (5 entry)', () => {
    expect(DL_ARCHIVE_MOCK.packaging).toHaveLength(5);
  });

  it('highlights = DL_HIGHLIGHTS (4 quote)', () => {
    expect(DL_ARCHIVE_MOCK.highlights).toHaveLength(4);
  });
});

describe('header constants 字面锁', () => {
  it('DEEP_LEARNING_CHIP = "深度学习"', () => {
    expect(DEEP_LEARNING_CHIP).toBe('深度学习');
  });

  it('DEEP_LEARNING_H1 = "文案深度学习"', () => {
    expect(DEEP_LEARNING_H1).toBe('文案深度学习');
  });

  it('DEEP_LEARNING_SUBTITLE 含关键词 "深度分析文案逻辑"', () => {
    expect(DEEP_LEARNING_SUBTITLE).toContain('深度分析文案逻辑');
  });

  it('DL_STYLE_PORTRAIT_BODY 含 "智者型"', () => {
    expect(DL_STYLE_PORTRAIT_BODY).toContain('智者型');
  });

  it('DL_STYLE_PORTRAIT_BODY 含 "深谙美业"', () => {
    expect(DL_STYLE_PORTRAIT_BODY).toContain('深谙美业');
  });
});
