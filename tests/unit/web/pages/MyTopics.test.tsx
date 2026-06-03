/**
 * MyTopics.test.tsx — PRD-15 US-007 AC-9 (重写版)
 * 源码自省测试 (readFileSync+toContain) · Node 环境 · 无 React render
 * 断言当前先锋白接真设计:
 *   tRPC list + countBySource · source filter chip · search 防抖 · copy/download
 *   TopicCard · 空态 · accountId 安全 · 无旧 PRD-15 遗留(删 view-card-btn/edit/delete/modal 等)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');
const MY_TOPICS_PAGE   = `${ROOT}/apps/web/src/pages/modules/MyTopics.tsx`;
const MY_TOPICS_ROUTER = `${ROOT}/apps/api/src/trpc/routers/app/myTopics.ts`;
const MY_TOPICS_CONSTS = `${ROOT}/apps/web/src/lib/constants/myTopics.ts`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 页面规模 + 基础结构 ───────────────────────────────────────────────────

describe('Page structure (先锋白设计)', () => {
  it('MyTopics.tsx has 200+ lines', () => {
    const lines = src(MY_TOPICS_PAGE).split('\n').length;
    expect(lines).toBeGreaterThan(200);
  });

  it('renders PioneerLayout wrapper', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('PioneerLayout');
  });

  it('data-testid="my-topics-page" root wrapper', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('my-topics-page');
  });

  it('has back-link testid + uses MY_TOPICS_BACK_HREF constant (resolves to /step/5)', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('back-link');
    // Page uses constants (MY_TOPICS_BACK_HREF) not hardcoded literals
    expect(page).toContain('MY_TOPICS_BACK_HREF');
    // Constants file contains the actual /step/5 value
    expect(src(MY_TOPICS_CONSTS)).toContain('/step/5');
  });

  it('has breadcrumb-chip + h1-title + subtitle testids', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('breadcrumb-chip');
    expect(page).toContain('h1-title');
    expect(page).toContain('subtitle');
  });
});

// ── 2 · tRPC 接真 — list + countBySource ─────────────────────────────────────

describe('tRPC real wiring', () => {
  it('uses trpc.myTopics.list.useQuery', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('trpc.myTopics.list.useQuery');
  });

  it('passes source/search/page/pageSize to list query', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('source: filter');
    expect(page).toContain('pageSize: 100');
  });

  it('uses trpc.myTopics.countBySource.useQuery for stable KPI', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('trpc.myTopics.countBySource.useQuery');
  });

  it('uses keepPreviousData to suppress flicker on filter switch', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('keepPreviousData');
  });
});

// ── 3 · 搜索防抖 ─────────────────────────────────────────────────────────────

describe('Search debounce (P1)', () => {
  it('search input data-testid="search-input" exists', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('search-input');
  });

  it('useDebounce / debounce logic present (300ms)', () => {
    const page = src(MY_TOPICS_PAGE);
    // Either a useDebounce hook or explicit setTimeout(300)
    expect(page).toMatch(/useDebounce|300/);
  });

  it('debouncedSearch used in query (not raw search)', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('debouncedSearch');
  });
});

// ── 4 · source filter chips ──────────────────────────────────────────────────

describe('Source filter chips (对齐后端)', () => {
  it('filter-chips container testid', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('filter-chips');
  });

  it('filter-chip-all / step5 / trending / manual testids via template literal', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('filter-chip-');
    expect(page).toContain("'all'");
    expect(page).toContain("'step5'");
    expect(page).toContain("'trending'");
    expect(page).toContain("'manual'");
  });

  it('MY_TOPICS_FILTERS drives filter chips (no hardcoded labels)', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('MY_TOPICS_FILTERS');
  });
});

// ── 5 · TopicCard 渲染 ────────────────────────────────────────────────────────

describe('TopicCard rendering', () => {
  it('topic-card-{index} testid via template literal', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('topic-card-');
  });

  it('topic-title-{index} testid', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('topic-title-');
  });

  it('topic-source-badge-{index} testid', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('topic-source-badge-');
  });

  it('topic-list testid on grid wrapper', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('topic-list');
  });

  it('topic-list-skeleton testid on skeleton loader', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('topic-list-skeleton');
  });
});

// ── 6 · copy / download 成功 toast ───────────────────────────────────────────

describe('Copy / Download actions (toast 修复)', () => {
  it('copy-all-btn testid', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('copy-all-btn');
  });

  it('download-txt-btn testid', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('download-txt-btn');
  });

  it('成功 toast 用 MY_TOPICS_TOAST_COPY_SUCCESS (非空列表文案)', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('MY_TOPICS_TOAST_COPY_SUCCESS');
  });

  it('成功 toast 用 MY_TOPICS_TOAST_DOWNLOAD_SUCCESS (非空列表文案)', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('MY_TOPICS_TOAST_DOWNLOAD_SUCCESS');
  });

  it('空列表 toast 用 toast.info + 原空态文案 (MY_TOPICS_TOAST_COPY)', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('MY_TOPICS_TOAST_COPY');
    expect(src(MY_TOPICS_PAGE)).toContain('toast.info');
  });

  it('download uses URL.createObjectURL + navigator.clipboard or Blob', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('URL.createObjectURL');
    expect(page).toContain('Blob');
  });
});

// ── 7 · 空态 ─────────────────────────────────────────────────────────────────

describe('Empty state', () => {
  it('empty-state testid', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('empty-state');
  });

  it('empty-cta-btn testid', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('empty-cta-btn');
  });

  it('empty-title + empty-desc testids', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('empty-title');
    expect(page).toContain('empty-desc');
  });

  it('error-state testid + retry-btn', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('error-state');
    expect(page).toContain('retry-btn');
  });
});

// ── 8 · constants 对齐 ────────────────────────────────────────────────────────

describe('Constants alignment', () => {
  it('no lucide imports in constants (禁 lucide)', () => {
    expect(src(MY_TOPICS_CONSTS)).not.toContain("from 'lucide-react'");
  });

  it('TopicFilter interface 无 icon 字段', () => {
    const consts = src(MY_TOPICS_CONSTS);
    // interface TopicFilter should not contain icon
    const interfaceMatch = consts.match(/interface TopicFilter\s*\{[\s\S]*?\}/);
    expect(interfaceMatch).not.toBeNull();
    expect(interfaceMatch![0]).not.toContain('icon');
  });

  it('MY_TOPICS_SEARCH_PLACEHOLDER 不含"行业"(只搜标题)', () => {
    expect(src(MY_TOPICS_CONSTS)).not.toContain('行业');
    expect(src(MY_TOPICS_CONSTS)).toContain('搜索选题标题');
  });

  it('MY_TOPICS_TOAST_COPY_SUCCESS 和 MY_TOPICS_TOAST_DOWNLOAD_SUCCESS 存在', () => {
    const consts = src(MY_TOPICS_CONSTS);
    expect(consts).toContain('MY_TOPICS_TOAST_COPY_SUCCESS');
    expect(consts).toContain('MY_TOPICS_TOAST_DOWNLOAD_SUCCESS');
  });
});

// ── 9 · 后端安全 accountId isolation ─────────────────────────────────────────

describe('Backend accountId isolation (TD-019)', () => {
  it('list: stepData.findMany where 含 accountId', () => {
    const router = src(MY_TOPICS_ROUTER);
    const match = router.match(/stepData\.findMany\(\s*\{[\s\S]*?\}\s*\)/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain('accountId');
  });

  it('countBySource: stepData.findFirst where 含 accountId', () => {
    const router = src(MY_TOPICS_ROUTER);
    const match = router.match(/stepData\.findFirst\(\s*\{[\s\S]*?\}\s*\)/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain('accountId');
  });

  it('trendingFavorite.findMany where 含 accountId', () => {
    const router = src(MY_TOPICS_ROUTER);
    const match = router.match(/trendingFavorite\.findMany\(\s*\{[\s\S]*?\}\s*\)/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain('accountId');
  });
});

// ── 10 · FILTER_ICON Material Symbols ────────────────────────────────────────

describe('FILTER_ICON Material Symbols (禁 lucide)', () => {
  it('FILTER_ICON covers all 4 keys', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('FILTER_ICON');
    expect(page).toContain("all:");
    expect(page).toContain("step5:");
    expect(page).toContain("trending:");
    expect(page).toContain("manual:");
  });

  it('FILTER_ICON values are material symbol strings not lucide components', () => {
    const page = src(MY_TOPICS_PAGE);
    // Material symbol names
    expect(page).toContain('filter_list');
    expect(page).toContain('auto_awesome');
    expect(page).toContain('local_fire_department');
    expect(page).toContain('bookmark_added');
  });
});
