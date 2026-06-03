/**
 * Trending.test.tsx — 接真后端 · 字面锁 + 接线断言 (source-inspection)
 * 重写自: 旧版本引用已删独立子组件文件(TrendingHero/ItemCard/Grid 独立文件)→ 全报 ENOENT
 * 新策略: 断言当前 table-based 接真设计 —
 *   · Trending.tsx 含 trpc.trending 接线 (listWithFavorites / favorite / kpiStats)
 *   · TrendingTable / TrendingFilters / TrendingDetailDrawer 被引用
 *   · TrendingTable.tsx 含 trending-table testid + btn-favorite-{id} + btn-detail-{id}
 *   · TrendingDetailDrawer.tsx 含 trpc.trending.detail.useQuery + sourceUrl 链接
 *   · constants 字面锁全保留
 * 环境: node (无 jsdom) · 纯 readFileSync source-inspection
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');

const TRENDING_PAGE       = `${ROOT}/apps/web/src/pages/tools/Trending.tsx`;
const TRENDING_CONSTANTS  = `${ROOT}/apps/web/src/lib/constants/trending.ts`;
const TRENDING_TABLE      = `${ROOT}/apps/web/src/pages/tools/components/TrendingTable.tsx`;
const TRENDING_FILTERS    = `${ROOT}/apps/web/src/pages/tools/components/TrendingFilters.tsx`;
const TRENDING_DRAWER     = `${ROOT}/apps/web/src/pages/tools/components/TrendingDetailDrawer.tsx`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · Page 接真后端结构 ────────────────────────────────────────────────────

describe('Trending page · 接真后端结构', () => {
  it('page 含 trpc.trending.listWithFavorites 接线', () => {
    expect(src(TRENDING_PAGE)).toContain('listWithFavorites');
  });

  it('page 含 trpc.trending.favorite', () => {
    expect(src(TRENDING_PAGE)).toContain('favorite');
  });

  it('page 含 trpc.trending.kpiStats', () => {
    expect(src(TRENDING_PAGE)).toContain('kpiStats');
  });

  it('page 使用 trpc 命名空间', () => {
    expect(src(TRENDING_PAGE)).toContain('trpc.trending');
  });

  it('page import TrendingTable', () => {
    expect(src(TRENDING_PAGE)).toContain('TrendingTable');
  });

  it('page import TrendingDetailDrawer', () => {
    expect(src(TRENDING_PAGE)).toContain('TrendingDetailDrawer');
  });

  it('page import TrendingFilters', () => {
    expect(src(TRENDING_PAGE)).toContain('TrendingFilters');
  });

  it('page 有乐观更新 setData / onMutate', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('setData');
    expect(page).toContain('onMutate');
  });

  it('page 有 invalidate 调用', () => {
    expect(src(TRENDING_PAGE)).toContain('invalidate');
  });

  it('page 有三态 isLoading / isError / 空态', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('isLoading');
    expect(page).toContain('isError');
    expect(page).toContain('trending-grid-empty');
  });

  it('page 仍保留 TRENDING_MOCK 引用(字面锁合规)', () => {
    expect(src(TRENDING_PAGE)).toContain('TRENDING_MOCK');
  });

  it('page 仍保留 TRENDING_FAKE_TOTAL 引用(字面锁合规)', () => {
    expect(src(TRENDING_PAGE)).toContain('TRENDING_FAKE_TOTAL');
  });

  it('page 含 trending-skeleton testid', () => {
    expect(src(TRENDING_PAGE)).toContain('trending-skeleton');
  });

  it('page 含 trending-error testid', () => {
    expect(src(TRENDING_PAGE)).toContain('trending-error');
  });
});

// ── 2 · Hero 字面锁 ──────────────────────────────────────────────────────────

describe('Hero · h1 + subtitle 字面锁', () => {
  it('constants 含 全网爆款库', () => {
    expect(src(TRENDING_CONSTANTS)).toContain('全网爆款库');
  });

  it('constants 含完整 subtitle', () => {
    expect(src(TRENDING_CONSTANTS)).toContain(
      '抓取2025-2026年全平台（抖音、小红书、视频号、快手、B站）最新爆款视频和完整文案',
    );
  });

  it('page 含 trending-h1 testid', () => {
    expect(src(TRENDING_PAGE)).toContain('trending-h1');
  });

  it('page 含 trending-subtitle testid', () => {
    expect(src(TRENDING_PAGE)).toContain('trending-subtitle');
  });

  it('page 含 TRENDING_H1 + TRENDING_SUBTITLE 引用', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('TRENDING_H1');
    expect(page).toContain('TRENDING_SUBTITLE');
  });
});

// ── 3 · 筛选卡字面锁 ─────────────────────────────────────────────────────────

describe('大筛选 card · 4 字段字面锁', () => {
  it('constants 含 选择行业 + 筛选平台 + 自定义关键词（可选）+ 多个关键词用逗号分隔', () => {
    const c = src(TRENDING_CONSTANTS);
    expect(c).toContain('选择行业');
    expect(c).toContain('筛选平台');
    expect(c).toContain('自定义关键词（可选）');
    expect(c).toContain('多个关键词用逗号分隔');
  });

  it('constants 含 抓取最新爆款', () => {
    expect(src(TRENDING_CONSTANTS)).toContain('抓取最新爆款');
  });

  it('page 含 trending-filter-card testid', () => {
    expect(src(TRENDING_PAGE)).toContain('trending-filter-card');
  });

  it('page 含 trending-fetch-btn + TRENDING_FETCH_BTN', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('trending-fetch-btn');
    expect(page).toContain('TRENDING_FETCH_BTN');
  });

  it('page 含 trending-keywords-input testid', () => {
    expect(src(TRENDING_PAGE)).toContain('trending-keywords-input');
  });
});

// ── 4 · search row ────────────────────────────────────────────────────────────

describe('search row · testid + placeholder', () => {
  it('constants 含 搜索爆款内容...', () => {
    expect(src(TRENDING_CONSTANTS)).toContain('搜索爆款内容...');
  });

  it('page 含 trending-search-bar + trending-search-input testid', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('trending-search-bar');
    expect(page).toContain('trending-search-input');
  });

  it('page 含 trending-count testid + TRENDING_COUNT_TPL', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('trending-count');
    expect(page).toContain('TRENDING_COUNT_TPL');
  });

  it('page 含 TRENDING_SEARCH_PLACEHOLDER', () => {
    expect(src(TRENDING_PAGE)).toContain('TRENDING_SEARCH_PLACEHOLDER');
  });
});

// ── 5 · TrendingTable 接线设计 ───────────────────────────────────────────────

describe('TrendingTable · table-based 设计锁', () => {
  it('TrendingTable.tsx 含 trending-table testid', () => {
    expect(src(TRENDING_TABLE)).toContain('trending-table');
  });

  it('TrendingTable.tsx 含 trending-row-{id} testid', () => {
    expect(src(TRENDING_TABLE)).toContain('trending-row-');
  });

  it('TrendingTable.tsx 含 btn-detail-{id} testid', () => {
    expect(src(TRENDING_TABLE)).toContain('btn-detail-');
  });

  it('TrendingTable.tsx 含 btn-favorite-{id} + data-favorited', () => {
    const table = src(TRENDING_TABLE);
    expect(table).toContain('btn-favorite-');
    expect(table).toContain('data-favorited');
  });

  it('TrendingTable.tsx 含 isFavorited 字段', () => {
    expect(src(TRENDING_TABLE)).toContain('isFavorited');
  });

  it('TrendingTable.tsx 含 likeCount / commentCount / shareCount 字段', () => {
    const table = src(TRENDING_TABLE);
    expect(table).toContain('likeCount');
    expect(table).toContain('commentCount');
    expect(table).toContain('shareCount');
  });

  it('TrendingTable.tsx 含 rank 字段', () => {
    expect(src(TRENDING_TABLE)).toContain('rank');
  });

  it('TrendingTable.tsx 含 trending-empty testid(空态)', () => {
    expect(src(TRENDING_TABLE)).toContain('trending-empty');
  });

  it('TrendingTable.tsx 含 btn-step7-{id} testid', () => {
    expect(src(TRENDING_TABLE)).toContain('btn-step7-');
  });
});

// ── 6 · TrendingFilters ───────────────────────────────────────────────────────

describe('TrendingFilters · 接线设计', () => {
  it('TrendingFilters.tsx 含 trending-filters testid', () => {
    expect(src(TRENDING_FILTERS)).toContain('trending-filters');
  });

  it('TrendingFilters.tsx 含 platform-filter-{key} testid', () => {
    expect(src(TRENDING_FILTERS)).toContain('platform-filter-');
  });

  it('TrendingFilters.tsx 含 search-input testid', () => {
    expect(src(TRENDING_FILTERS)).toContain('search-input');
  });

  it('TrendingFilters.tsx 含 sort-select testid', () => {
    expect(src(TRENDING_FILTERS)).toContain('sort-select');
  });

  it('TrendingFilters.tsx 含 TrendingFilterState 类型', () => {
    expect(src(TRENDING_FILTERS)).toContain('TrendingFilterState');
  });
});

// ── 7 · TrendingDetailDrawer ──────────────────────────────────────────────────

describe('TrendingDetailDrawer · 真 detail 查询', () => {
  it('TrendingDetailDrawer.tsx 含 trpc.trending.detail.useQuery', () => {
    const drawer = src(TRENDING_DRAWER);
    expect(drawer).toContain('trpc.trending.detail.useQuery');
  });

  it('TrendingDetailDrawer.tsx 含 sourceUrl 原文链接', () => {
    expect(src(TRENDING_DRAWER)).toContain('sourceUrl');
  });

  it('TrendingDetailDrawer.tsx 含 drawer-source-url testid', () => {
    expect(src(TRENDING_DRAWER)).toContain('drawer-source-url');
  });

  it('TrendingDetailDrawer.tsx 含 drawer-title testid', () => {
    expect(src(TRENDING_DRAWER)).toContain('drawer-title');
  });

  it('TrendingDetailDrawer.tsx 含 likeCount / commentCount / shareCount', () => {
    const drawer = src(TRENDING_DRAWER);
    expect(drawer).toContain('likeCount');
    expect(drawer).toContain('commentCount');
    expect(drawer).toContain('shareCount');
  });

  it('TrendingDetailDrawer.tsx 含 drawer-copy-btn + drawer-save-btn + drawer-step7-btn testid', () => {
    const drawer = src(TRENDING_DRAWER);
    expect(drawer).toContain('drawer-copy-btn');
    expect(drawer).toContain('drawer-save-btn');
    expect(drawer).toContain('drawer-step7-btn');
  });
});

// ── 8 · TRENDING_MOCK 9 card 字面锁 ──────────────────────────────────────────

describe('TRENDING_MOCK · 9 card 字面锁', () => {
  it('9 card title 全部命中', () => {
    const c = src(TRENDING_CONSTANTS);
    expect(c).toContain('B站2026年内容趋势：深度+互动，这3类UP主会爆火！');
    expect(c).toContain('B站UP主2026年如何破圈？我用AI做了个实验！');
    expect(c).toContain('快手2026年短剧变现新模式：我用"直播互动"赚翻了！');
    expect(c).toContain('快手2026年新玩法：老铁经济升级，你必须知道的3个点！');
    expect(c).toContain('视频号2026年知识付费：我用"AI导师"模式，月入10万！');
    expect(c).toContain('快手MCN机构2026年新趋势：抱团取暖，这3点是关键！');
    expect(c).toContain('视频号2026年短剧：我用1000块拍出百万播放量！');
    expect(c).toContain('2026年小红书内容创作：普通人如何打造"情绪价值"爆款？');
  });

  it('4 platformLabel 各 ≥1 次', () => {
    const c = src(TRENDING_CONSTANTS);
    expect(c).toContain("platformLabel: 'B站'");
    expect(c).toContain("platformLabel: '快手'");
    expect(c).toContain("platformLabel: '视频号'");
    expect(c).toContain("platformLabel: '小红书'");
  });

  it('4 type 各 ≥1 次', () => {
    const c = src(TRENDING_CONSTANTS);
    expect(c).toContain("type: '口播'");
    expect(c).toContain("type: '混剪'");
    expect(c).toContain("type: '剧情'");
    expect(c).toContain("type: 'vlog'");
  });

  it('9 likes 数字全部命中', () => {
    const c = src(TRENDING_CONSTANTS);
    expect(c).toContain('18.1万');
    expect(c).toContain('21.5万');
    expect(c).toContain('7.2万');
    expect(c).toContain('7.8万');
    expect(c).toContain('9.5万');
    expect(c).toContain('6.5万');
    expect(c).toContain('8.9万');
    expect(c).toContain('10.1万');
    expect(c).toContain('14.9万');
  });

  it('9 card 各首 tag 命中', () => {
    const c = src(TRENDING_CONSTANTS);
    expect(c).toContain('B站爆款');
    expect(c).toContain('B站破圈');
    expect(c).toContain('快手短剧');
    expect(c).toContain('快手运营');
    expect(c).toContain('视频号知识付费');
    expect(c).toContain('快手MCN');
    expect(c).toContain('快手直播');
    expect(c).toContain('视频号短剧');
    expect(c).toContain('小红书爆款');
  });
});

// ── 9 · 默认 industry · self_media ───────────────────────────────────────────

describe('default industry · self_media', () => {
  it('constants 含 TRENDING_DEFAULT_INDUSTRY_ID = self_media', () => {
    expect(src(TRENDING_CONSTANTS)).toContain('self_media');
  });

  it('page 使用 TRENDING_DEFAULT_INDUSTRY_ID', () => {
    expect(src(TRENDING_PAGE)).toContain('TRENDING_DEFAULT_INDUSTRY_ID');
  });
});

// ── 10 · 平台筛选 testid ─────────────────────────────────────────────────────

describe('平台筛选 · testid 锁', () => {
  it('page 含 trending-platform-all testid', () => {
    expect(src(TRENDING_PAGE)).toContain('trending-platform-all');
  });

  it('page 含 trending-platform-{opt.key} 动态 testid 模板', () => {
    // testid 通过模板字符串生成: data-testid={`trending-platform-${opt.key}`}
    expect(src(TRENDING_PAGE)).toContain('trending-platform-${opt.key}');
  });

  it('page 含 TRENDING_PLATFORM_ALL + TRENDING_PLATFORM_OPTIONS 常量', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('TRENDING_PLATFORM_ALL');
    expect(page).toContain('TRENDING_PLATFORM_OPTIONS');
  });
});

// ── 11 · KPI 概览 · testid ────────────────────────────────────────────────────

describe('KPI 概览 · 接真 kpiStats', () => {
  it('page 含 trending-kpi testid', () => {
    expect(src(TRENDING_PAGE)).toContain('trending-kpi');
  });

  it('page 含 kpiData 变量(接 kpiStats 真数据)', () => {
    expect(src(TRENDING_PAGE)).toContain('kpiData');
  });
});

// ── 12 · 分页 ────────────────────────────────────────────────────────────────

describe('分页 · totalPages', () => {
  it('page 含 totalPages 字段', () => {
    expect(src(TRENDING_PAGE)).toContain('totalPages');
  });

  it('page 含 trending-pagination testid', () => {
    expect(src(TRENDING_PAGE)).toContain('trending-pagination');
  });
});
