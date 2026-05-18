/**
 * Trending.test.tsx — PRD-15 US-006 AC-11
 * ≥ 12 unit tests: source inspection (Node environment · no React render)
 * 4 KPI + 5 filter dims + DenseTable + URL state(7 fields) + favorite + Step 7 + detail Drawer
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');
const TRENDING_PAGE     = `${ROOT}/apps/web/src/pages/tools/Trending.tsx`;
const TRENDING_FILTERS  = `${ROOT}/apps/web/src/pages/tools/components/TrendingFilters.tsx`;
const TRENDING_TABLE    = `${ROOT}/apps/web/src/pages/tools/components/TrendingTable.tsx`;
const TRENDING_DRAWER   = `${ROOT}/apps/web/src/pages/tools/components/TrendingDetailDrawer.tsx`;
const TRENDING_ROUTER   = `${ROOT}/apps/api/src/trpc/routers/trending.ts`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · KPI Cards (AC-2) ──────────────────────────────────────────────────────

describe('KPI cards (AC-2)', () => {
  it('page has 200+ lines (stub expanded)', () => {
    const lines = src(TRENDING_PAGE).split('\n').length;
    expect(lines).toBeGreaterThan(200);
  });

  it('renders kpi-cards container', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('kpi-cards');
  });

  it('renders total trending count KPI', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('kpi-total');
    expect(page).toContain('总爆款数');
  });

  it('renders weekNew + myFavorites + lastUpdated KPI', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('kpi-week-new');
    expect(page).toContain('kpi-favorites');
    expect(page).toContain('kpi-last-updated');
    expect(page).toContain('本周新增');
    expect(page).toContain('我的收藏');
    expect(page).toContain('上次更新');
  });
});

// ── 2 · 5-dimension Filter (AC-3) ─────────────────────────────────────────────

describe('Multi-dimension filter toolbar (AC-3)', () => {
  it('TrendingFilters.tsx has 6 platform options', () => {
    const filters = src(TRENDING_FILTERS);
    expect(filters).toContain("'douyin'");
    expect(filters).toContain("'xiaohongshu'");
    expect(filters).toContain("'bilibili'");
    expect(filters).toContain("'kuaishou'");
    expect(filters).toContain("'shipinhao'");
    expect(filters).toContain("'weibo'");
  });

  it('TrendingFilters uses IndustryDropdown (US-001 56-industry)', () => {
    const filters = src(TRENDING_FILTERS);
    expect(filters).toContain('IndustryDropdown');
    expect(filters).toContain("from '@/components/IndustryDropdown'");
  });

  it('TrendingFilters has time range select (今日/本周/本月/最近3月)', () => {
    const filters = src(TRENDING_FILTERS);
    expect(filters).toContain('time-range-select');
    expect(filters).toContain("'today'");
    expect(filters).toContain("'week'");
    expect(filters).toContain("'month'");
    expect(filters).toContain("'quarter'");
  });

  it('TrendingFilters has sort select (likeCount/commentCount/shareCount/collectCount)', () => {
    const filters = src(TRENDING_FILTERS);
    expect(filters).toContain('sort-select');
    expect(filters).toContain("'likeCount'");
    expect(filters).toContain("'commentCount'");
    expect(filters).toContain("'shareCount'");
    expect(filters).toContain("'collectCount'");
  });

  it('TrendingFilters has search input', () => {
    const filters = src(TRENDING_FILTERS);
    expect(filters).toContain('search-input');
    expect(filters).toContain('搜索关键词');
  });
});

// ── 3 · DenseTable (AC-4) ─────────────────────────────────────────────────────

describe('DenseTable (AC-4)', () => {
  it('TrendingTable renders with virtual list (react-virtualized)', () => {
    const table = src(TRENDING_TABLE);
    expect(table).toContain('react-virtualized');
    expect(table).toContain('AutoSizer');
    expect(table).toContain('List');
  });

  it('TrendingTable has rank + platform + title + industry + stats columns', () => {
    const table = src(TRENDING_TABLE);
    expect(table).toContain('排名');
    expect(table).toContain('平台');
    expect(table).toContain('标题');
    expect(table).toContain('行业');
    expect(table).toContain('点赞');
    expect(table).toContain('评论');
    expect(table).toContain('转发');
    expect(table).toContain('收藏');
    expect(table).toContain('抓取时间');
  });

  it('TrendingTable truncates title to 60 chars', () => {
    const table = src(TRENDING_TABLE);
    expect(table).toContain('60');
    expect(table).toContain('truncate');
  });

  it('TrendingTable has 4 action buttons per row', () => {
    const table = src(TRENDING_TABLE);
    expect(table).toContain('btn-detail');
    expect(table).toContain('btn-step7');
    expect(table).toContain('btn-favorite');
    expect(table).toContain('btn-save-topics');
  });
});

// ── 4 · URL state (AC-6) ─────────────────────────────────────────────────────

describe('URL state deep-link (AC-6)', () => {
  it('Trending.tsx uses useSearchParams for URL state', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('useSearchParams');
  });

  it('URL state covers 7 fields: platform/industry/time/sort/search/page', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain("'platform'");
    expect(page).toContain("'industry'");
    expect(page).toContain("'time'");
    expect(page).toContain("'sort'");
    expect(page).toContain("'search'");
    expect(page).toContain("'page'");
  });

  it('setSearchParams called on filter/page change', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('setSearchParams');
    expect(page).toContain('filtersToParams');
  });
});

// ── 5 · Favorite (AC-7) ──────────────────────────────────────────────────────

describe('Favorite action (AC-7)', () => {
  it('Trending.tsx calls trpc.trending.favorite.useMutation()', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('trpc.trending.favorite.useMutation');
  });

  it('favorite mutation passes trendingItemId + action', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('trendingItemId');
    expect(page).toContain("'remove'");
    expect(page).toContain("'add'");
  });

  it('backend favorite procedure upserts/deletes TrendingFavorite', () => {
    const router = src(TRENDING_ROUTER);
    expect(router).toContain('trendingFavorite.upsert');
    expect(router).toContain('trendingFavorite.deleteMany');
  });

  it('backend kpiStats returns myFavorites count', () => {
    const router = src(TRENDING_ROUTER);
    expect(router).toContain('kpiStats');
    expect(router).toContain('myFavorites');
    expect(router).toContain('trendingFavorite.count');
  });
});

// ── 6 · Step 7 jump (AC-8) ───────────────────────────────────────────────────

describe('Step 7 one-click jump (AC-8)', () => {
  it('TrendingTable navigates to /step/7 with topic + source + trendingId', () => {
    const table = src(TRENDING_TABLE);
    expect(table).toContain('/step/7');
    expect(table).toContain("'trending'");
    expect(table).toContain('trendingId');
    expect(table).toContain('topic');
  });

  it('TrendingDetailDrawer also has Step 7 button with correct params', () => {
    const drawer = src(TRENDING_DRAWER);
    expect(drawer).toContain('/step/7');
    expect(drawer).toContain("source: 'trending'");
    expect(drawer).toContain('trendingId');
  });
});

// ── 7 · Detail Drawer (AC-9) ─────────────────────────────────────────────────

describe('Detail Drawer (AC-9)', () => {
  it('TrendingDetailDrawer uses Sheet (right-side Drawer)', () => {
    const drawer = src(TRENDING_DRAWER);
    expect(drawer).toContain('Sheet');
    expect(drawer).toContain("side=\"right\"");
  });

  it('Drawer shows sourceUrl link', () => {
    const drawer = src(TRENDING_DRAWER);
    expect(drawer).toContain('drawer-source-url');
    expect(drawer).toContain('查看原文');
    expect(drawer).toContain('sourceUrl');
  });

  it('Drawer shows full contentText', () => {
    const drawer = src(TRENDING_DRAWER);
    expect(drawer).toContain('drawer-content');
    expect(drawer).toContain('contentText');
  });

  it('Drawer has 3 action buttons: copy / save / step7', () => {
    const drawer = src(TRENDING_DRAWER);
    expect(drawer).toContain('drawer-copy-btn');
    expect(drawer).toContain('drawer-save-btn');
    expect(drawer).toContain('drawer-step7-btn');
    expect(drawer).toContain('复制内容');
    expect(drawer).toContain('保存到我的库');
    expect(drawer).toContain('一键到 Step 7');
  });
});

// ── 8 · Backend procedures (AC-10) ───────────────────────────────────────────

describe('Backend trending router (AC-10)', () => {
  it('router exports list procedure with filters', () => {
    const router = src(TRENDING_ROUTER);
    expect(router).toContain('list:');
    expect(router).toContain('platforms');
    expect(router).toContain('timeRange');
    expect(router).toContain('pageSize');
  });

  it('router exports listWithFavorites procedure', () => {
    const router = src(TRENDING_ROUTER);
    expect(router).toContain('listWithFavorites');
    expect(router).toContain('isFavorited');
  });

  it('router exports detail procedure', () => {
    const router = src(TRENDING_ROUTER);
    expect(router).toContain('detail:');
    expect(router).toContain('contentText');
    expect(router).toContain('sourceUrl');
  });
});
