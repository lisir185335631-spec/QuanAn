/**
 * Knowledge.test.tsx — PRD-9 US-004 AC-11
 * Source-inspection tests: 15 tests covering 3 tab + search debounce + card renders + empty state
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');
const PAGE = `${ROOT}/apps/web/src/pages/tools/Knowledge.tsx`;
const ROUTER_TYPES = `${ROOT}/packages/clients/src/router-types.ts`;
const KNOWLEDGE_ROUTER = `${ROOT}/apps/api/src/trpc/routers/knowledge.ts`;

function pageSrc(): string {
  return readFileSync(PAGE, 'utf-8');
}

function routerTypesSrc(): string {
  return readFileSync(ROUTER_TYPES, 'utf-8');
}

function apiRouterSrc(): string {
  return readFileSync(KNOWLEDGE_ROUTER, 'utf-8');
}

// ── 1 · Tab 切换 ─────────────────────────────────────────────────────────────

describe('AC-2: 3 tab 渲染 — 案例/公式/元素', () => {
  it('page imports shadcn Tabs components', () => {
    const src = pageSrc();
    expect(src).toContain('Tabs');
    expect(src).toContain('TabsList');
    expect(src).toContain('TabsTrigger');
    expect(src).toContain('TabsContent');
  });

  it('知识库 h1 heading', () => {
    expect(pageSrc()).toContain('知识库');
  });

  it('data-testid="knowledge-tabs" 存在', () => {
    expect(pageSrc()).toContain('data-testid="knowledge-tabs"');
  });

  it('3 tab value: case/formula/element', () => {
    const src = pageSrc();
    expect(src).toContain("'case'");
    expect(src).toContain("'formula'");
    expect(src).toContain("'element'");
  });
});

// ── 2 · Search debounce ───────────────────────────────────────────────────────

describe('AC-3: search debounce 300ms · ≥2 字符', () => {
  it('debounce timer 值为 300ms', () => {
    expect(pageSrc()).toContain('300');
  });

  it('searchInput.length < 2 触发清空逻辑', () => {
    expect(pageSrc()).toContain('searchInput.length < 2');
  });

  it('调用 knowledge.search.useMutation', () => {
    expect(pageSrc()).toContain('knowledge.search.useMutation');
  });

  it('status bar 有 aria-live="polite"', () => {
    expect(pageSrc()).toContain('aria-live="polite"');
  });
});

// ── 3 · Case card ─────────────────────────────────────────────────────────────

describe('AC-4: case card — scriptType badge + industry badge + content 100 字 + 展开', () => {
  it('CaseCard 组件存在', () => {
    expect(pageSrc()).toContain('CaseCard');
  });

  it('case card content slice(0, 100)', () => {
    expect(pageSrc()).toContain('slice(0, 100)');
  });

  it('scriptType badge 渲染', () => {
    expect(pageSrc()).toContain('meta.scriptType');
  });

  it('industry badge 渲染', () => {
    expect(pageSrc()).toContain('meta.industry');
  });
});

// ── 4 · Formula / Element card ────────────────────────────────────────────────

describe('AC-5/AC-6: formula/element card', () => {
  it('FormulaCard 组件存在', () => {
    expect(pageSrc()).toContain('FormulaCard');
  });

  it('formula category badge 渲染', () => {
    expect(pageSrc()).toContain('meta.category');
  });

  it('ElementCard 组件存在', () => {
    expect(pageSrc()).toContain('ElementCard');
  });

  it('element psychologyTag badge 渲染', () => {
    expect(pageSrc()).toContain('meta.psychologyTag');
  });
});

// ── 5 · Empty state ───────────────────────────────────────────────────────────

describe('AC-7: empty state', () => {
  it('EmptyState 组件存在', () => {
    expect(pageSrc()).toContain('EmptyState');
  });

  it('暂无匹配结果提示含关键词', () => {
    const src = pageSrc();
    expect(src).toContain('暂无匹配结果');
    expect(src).toContain('矛盾冲突');
    expect(src).toContain('AIDA');
    expect(src).toContain('稀缺性');
  });
});

// ── 6 · API router + shadow types ────────────────────────────────────────────

describe('AC-1/AC-8: tRPC router procedures + shadow types', () => {
  it('knowledge router 包含 list procedure', () => {
    expect(apiRouterSrc()).toContain('list:');
    expect(apiRouterSrc()).toContain('publicProcedure');
  });

  it('knowledge router 包含 search mutation', () => {
    expect(apiRouterSrc()).toContain('search:');
    expect(apiRouterSrc()).toContain('ragRetrieveWorker');
  });

  it('knowledge router 包含 getById procedure', () => {
    expect(apiRouterSrc()).toContain('getById:');
  });

  it('router-types.ts 包含 KnowledgeChunkContent shadow type', () => {
    expect(routerTypesSrc()).toContain('KnowledgeChunkContent');
  });

  it('router-types.ts knowledge shadow router 包含 list/search/getById', () => {
    const src = routerTypesSrc();
    expect(src).toContain('list:');
    expect(src).toContain('search:');
    expect(src).toContain('getById:');
  });
});
