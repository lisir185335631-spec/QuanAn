/**
 * Knowledge.test.tsx — PRD-22 US-005 AC-1~AC-6
 * Source-inspection tests: 4-tab structure + search + case count buttons + elements picker
 * Replaces PRD-9 US-004 tests (3-tab structure no longer valid)
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');
const PAGE = `${ROOT}/apps/web/src/pages/tools/Knowledge.tsx`;

function src(): string {
  return readFileSync(PAGE, 'utf-8');
}

// ── 1 · H1 + subtitle 字面锁 (AC-1) ──────────────────────────────────────────

describe('AC-1: H1 + subtitle 字面锁', () => {
  it('H1 字面锁 "AIP 文案方法论"', () => {
    expect(src()).toContain('AIP 文案方法论');
  });

  it('副标题字面锁含 AIP 短视频文案创作方法论', () => {
    expect(src()).toContain('系统学习 AIP 的短视频文案创作方法论');
  });

  it('副标题字面锁含 掌握爆款文案的核心技巧', () => {
    expect(src()).toContain('掌握爆款文案的核心技巧');
  });
});

// ── 2 · 4 tab 字面锁 (AC-2 D-217) ───────────────────────────────────────────

describe('AC-2: 4 tab 字面锁 D-217', () => {
  it('引入 shadcn Tabs 组件', () => {
    const s = src();
    expect(s).toContain('Tabs');
    expect(s).toContain('TabsList');
    expect(s).toContain('TabsTrigger');
    expect(s).toContain('TabsContent');
  });

  it('data-testid="knowledge-tabs" 存在', () => {
    expect(src()).toContain('data-testid="knowledge-tabs"');
  });

  it('tab 1 字面锁 "20 类脚本"(默认 active)', () => {
    const s = src();
    expect(s).toContain('20 类脚本');
    expect(s).toContain("defaultValue");
  });

  it('tab 2 字面锁 "20 大爆款"', () => {
    expect(src()).toContain('20 大爆款');
  });

  it('tab 3 字面锁 "开头公式"', () => {
    expect(src()).toContain('开头公式');
  });

  it('tab 4 字面锁 "核心公式"', () => {
    expect(src()).toContain('核心公式');
  });

  it('选中态 data-[state=active]:bg-primary/10', () => {
    expect(src()).toContain('data-[state=active]:bg-primary/10');
  });
});

// ── 3 · tab 1: search + 20 脚本卡 + 案例计数 button (AC-3) ──────────────────

describe('AC-3: tab 1 · search + 脚本卡 + 案例计数 button', () => {
  it('search input placeholder "搜索脚本类型..."', () => {
    expect(src()).toContain('搜索脚本类型...');
  });

  it('data-testid="script-search" 存在', () => {
    expect(src()).toContain('data-testid="script-search"');
  });

  it('引入 SCRIPT_TYPES 常量(20 脚本卡数据源)', () => {
    expect(src()).toContain('SCRIPT_TYPES');
  });

  it('案例计数 button 字面锁含 "实战案例"', () => {
    expect(src()).toContain('实战案例');
  });

  it('方法论 details 折叠存在', () => {
    expect(src()).toContain('<details');
    expect(src()).toContain('方法论');
  });

  it('5 列网格 lg:grid-cols-5', () => {
    expect(src()).toContain('lg:grid-cols-5');
  });

  it('filter 逻辑含 toLowerCase', () => {
    expect(src()).toContain('toLowerCase');
  });
});

// ── 4 · tab 2: ElementsInlineMultiPicker disabled (AC-4) ─────────────────────

describe('AC-4: tab 2 · ElementsInlineMultiPicker 纯展示态', () => {
  it('引入 ElementsInlineMultiPicker', () => {
    expect(src()).toContain('ElementsInlineMultiPicker');
  });

  it('layout="grouped" 传递', () => {
    expect(src()).toContain('layout="grouped"');
  });

  it('disabled 属性传递', () => {
    expect(src()).toContain('disabled');
  });
});

// ── 5 · tab 3/4 stub placeholder (AC-5) ──────────────────────────────────────

describe('AC-5: tab 3/4 stub placeholder', () => {
  it('tab 3 stub 含 "5 类开头公式"', () => {
    expect(src()).toContain('5 类开头公式');
  });

  it('tab 3 stub 含 PRD-23 标记', () => {
    expect(src()).toContain('PRD-23');
  });

  it('tab 4 stub 含 "AIP 起承转合公式"', () => {
    expect(src()).toContain('AIP 起承转合公式');
  });
});

// ── 6 · forceMount 保证 DOM button 计数 (AC-6) ────────────────────────────────

describe('AC-6: forceMount 保证 DOM button 总数', () => {
  it('TabsContent 使用 forceMount', () => {
    expect(src()).toContain('forceMount');
  });

  it('inactive tab hidden via data-[state=inactive]:hidden', () => {
    expect(src()).toContain('data-[state=inactive]:hidden');
  });
});
