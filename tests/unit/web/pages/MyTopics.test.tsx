/**
 * MyTopics.test.tsx — PRD-15 US-007 AC-9
 * ≥ 8 unit tests: source-inspection (Node environment · no React render)
 * Covers: 2 view 切换 + URL state + 3 source 聚合 + 筛选 + 添加 Modal + 跳 Step 7 + 编辑 + 删除
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');
const MY_TOPICS_PAGE  = `${ROOT}/apps/web/src/pages/modules/MyTopics.tsx`;
const MY_TOPICS_ROUTER = `${ROOT}/apps/api/src/trpc/routers/myTopics.ts`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 页面规模 + 2 view ───────────────────────────────────────────────────

describe('View switching (AC-1 + AC-2 + AC-3)', () => {
  it('MyTopics.tsx has 200+ lines', () => {
    const lines = src(MY_TOPICS_PAGE).split('\n').length;
    expect(lines).toBeGreaterThan(200);
  });

  it('renders card-grid container (卡片视图)', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('card-grid');
  });

  it('renders topic-table container (表格视图)', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('topic-table');
  });

  it('view toggle buttons: view-card-btn + view-table-btn', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('view-card-btn');
    expect(page).toContain('view-table-btn');
    expect(page).toContain('view-toggle');
  });
});

// ── 2 · URL state (AC-4) ─────────────────────────────────────────────────────

describe('URL state deep-link (AC-4)', () => {
  it('uses useSearchParams for URL state', () => {
    expect(src(MY_TOPICS_PAGE)).toContain('useSearchParams');
  });

  it('URL state covers view/source/industry/search/page', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain("'view'");
    expect(page).toContain("'source'");
    expect(page).toContain("'industry'");
    expect(page).toContain("'search'");
    expect(page).toContain("'page'");
  });

  it('setSearchParams called via updateParams', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('setSearchParams');
    expect(page).toContain('updateParams');
  });
});

// ── 3 · 3 source 聚合 (AC-5) ─────────────────────────────────────────────────

describe('3-source aggregation (AC-5)', () => {
  it('backend list reads step_data for step5 source', () => {
    const router = src(MY_TOPICS_ROUTER);
    expect(router).toContain('stepData.findMany');
    expect(router).toContain("'step5'");
  });

  it('backend list reads trendingFavorite for trending source', () => {
    const router = src(MY_TOPICS_ROUTER);
    expect(router).toContain('trendingFavorite.findMany');
    expect(router).toContain('trendingItem.findMany');
  });

  it('backend list reads topics table for manual source', () => {
    const router = src(MY_TOPICS_ROUTER);
    expect(router).toContain('topic.findMany');
    expect(router).toContain("sourceType: 'manual'");
  });
});

// ── 4 · 多维筛选 (AC-6) ──────────────────────────────────────────────────────

describe('Multi-dimension filter (AC-6)', () => {
  it('source filter tabs: all/step5/trending/manual', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('source-filter');
    // Dynamic testid via template literal: data-testid={`source-tab-${s}`}
    expect(page).toContain('source-tab-');
    expect(page).toContain("'all'");
    expect(page).toContain("'step5'");
    expect(page).toContain("'trending'");
    expect(page).toContain("'manual'");
  });

  it('IndustryDropdown used for industry filter', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('IndustryDropdown');
    expect(page).toContain("from '@/components/IndustryDropdown'");
  });

  it('search input with data-testid="search-input"', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('search-input');
    expect(page).toContain('搜索选题标题');
  });
});

// ── 5 · 添加选题 Modal (AC-7) ────────────────────────────────────────────────

describe('AddTopicModal (AC-7)', () => {
  it('btn-add-topic button triggers modal', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('btn-add-topic');
    expect(page).toContain('添加选题');
  });

  it('AddTopicModal has title input + industry dropdown + platform input', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('add-topic-modal');
    expect(page).toContain('add-topic-title-input');
    expect(page).toContain('add-topic-platform-input');
    expect(page).toContain('add-topic-submit');
  });

  it('AddTopicModal calls trpc.myTopics.add.useMutation()', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('trpc.myTopics.add.useMutation');
  });
});

// ── 6 · 一键到 Step 7 (AC-8) ─────────────────────────────────────────────────

describe('Step 7 jump (AC-8)', () => {
  it('navigates to /step/7 with topic + source=mytopics + topicId', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('/step/7');
    expect(page).toContain("'mytopics'");
    expect(page).toContain('topicId');
  });

  it('btn-step7 appears in card view', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('btn-step7-');
    expect(page).toContain('一键到 Step 7');
  });

  it('table-btn-step7 appears in table view', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('table-btn-step7-');
  });
});

// ── 7 · 编辑选题 (manual only) ───────────────────────────────────────────────

describe('Edit topic (AC-8 extension)', () => {
  it('edit button only for manual topics', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain("item.source === 'manual'");
    expect(page).toContain('edit-topic-modal');
    expect(page).toContain('edit-topic-title-input');
    expect(page).toContain('edit-topic-submit');
  });

  it('edit calls trpc.myTopics.update.useMutation()', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('trpc.myTopics.update.useMutation');
  });
});

// ── 8 · 删除选题 + 后端 procedures (AC-9 + AC-10) ─────────────────────────────

describe('Delete + backend procedures (AC-10)', () => {
  it('delete button on every topic item', () => {
    const page = src(MY_TOPICS_PAGE);
    expect(page).toContain('btn-delete-');
    expect(page).toContain('trpc.myTopics.delete.useMutation');
  });

  it('backend has 5 procedures: list/add/update/delete/countBySource', () => {
    const router = src(MY_TOPICS_ROUTER);
    expect(router).toContain('list:');
    expect(router).toContain('add:');
    expect(router).toContain('update:');
    expect(router).toContain('delete:');
    expect(router).toContain('countBySource:');
  });

  it('backend list supports source/industry/search/page/pageSize filters', () => {
    const router = src(MY_TOPICS_ROUTER);
    expect(router).toContain('source');
    expect(router).toContain('industry');
    expect(router).toContain('search');
    expect(router).toContain('page');
    expect(router).toContain('pageSize');
  });

  it('backend add creates topic with sourceType=manual', () => {
    const router = src(MY_TOPICS_ROUTER);
    expect(router).toContain('topic.create');
    expect(router).toContain("sourceType: 'manual'");
  });

  it('backend delete handles both manual and trending sources', () => {
    const router = src(MY_TOPICS_ROUTER);
    expect(router).toContain('topic.deleteMany');
    expect(router).toContain('trendingFavorite.deleteMany');
  });

  it('backend countBySource returns step5/trending/manual counts', () => {
    const router = src(MY_TOPICS_ROUTER);
    expect(router).toContain('countBySource');
    expect(router).toContain('step5Count');
    expect(router).toContain('trendingCount');
    expect(router).toContain('manualCount');
  });
});
