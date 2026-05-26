/**
 * Trending.test.tsx — mock-first 字面锁测试
 * 验证: h1 / subtitle / 4 字段 label / 9 card title + tag + platform + type / fake total
 * 策略: readFileSync source inspection (Node env · no React render · no trpc mock)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');

const TRENDING_PAGE     = `${ROOT}/apps/web/src/pages/tools/Trending.tsx`;
const TRENDING_CONSTANTS = `${ROOT}/apps/web/src/lib/constants/trending.ts`;
const TRENDING_HERO     = `${ROOT}/apps/web/src/pages/tools/components/trending/TrendingHero.tsx`;
const TRENDING_FILTER   = `${ROOT}/apps/web/src/pages/tools/components/trending/TrendingFilterCard.tsx`;
const TRENDING_SEARCHBAR = `${ROOT}/apps/web/src/pages/tools/components/trending/TrendingSearchBar.tsx`;
const TRENDING_GRID     = `${ROOT}/apps/web/src/pages/tools/components/trending/TrendingGrid.tsx`;
const TRENDING_ITEM     = `${ROOT}/apps/web/src/pages/tools/components/trending/TrendingItemCard.tsx`;
const TRENDING_IND_DD   = `${ROOT}/apps/web/src/pages/tools/components/trending/TrendingIndustryDropdown.tsx`;
const TRENDING_PLT_DD   = `${ROOT}/apps/web/src/pages/tools/components/trending/TrendingPlatformDropdown.tsx`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · Page 结构(mock-first · 无 trpc · 无 KPI) ──────────────────────────────

describe('Trending page · mock-first structure', () => {
  it('page 不含 trpc.trending 引用', () => {
    const page = src(TRENDING_PAGE);
    expect(page).not.toContain('trpc.trending');
  });

  it('page 不含 KpiCards / TrendingTable / TrendingDetailDrawer / useSearchParams', () => {
    const page = src(TRENDING_PAGE);
    expect(page).not.toContain('KpiCards');
    expect(page).not.toContain('TrendingTable');
    expect(page).not.toContain('TrendingDetailDrawer');
    expect(page).not.toContain('useSearchParams');
  });

  it('page 引用 4 sub-component', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('TrendingHero');
    expect(page).toContain('TrendingFilterCard');
    expect(page).toContain('TrendingSearchBar');
    expect(page).toContain('TrendingGrid');
  });

  it('page 使用 TRENDING_MOCK + TRENDING_FAKE_TOTAL', () => {
    const page = src(TRENDING_PAGE);
    expect(page).toContain('TRENDING_MOCK');
    expect(page).toContain('TRENDING_FAKE_TOTAL');
  });
});

// ── 2 · Hero 字面 ──────────────────────────────────────────────────────────────

describe('Hero · h1 + subtitle 字面锁', () => {
  it('constants 含 全网爆款库', () => {
    expect(src(TRENDING_CONSTANTS)).toContain('全网爆款库');
  });

  it('constants 含完整 subtitle', () => {
    expect(src(TRENDING_CONSTANTS)).toContain(
      '抓取2025-2026年全平台（抖音、小红书、视频号、快手、B站）最新爆款视频和完整文案',
    );
  });

  it('TrendingHero.tsx 引用 TRENDING_H1 + TRENDING_SUBTITLE', () => {
    const hero = src(TRENDING_HERO);
    expect(hero).toContain('TRENDING_H1');
    expect(hero).toContain('TRENDING_SUBTITLE');
  });
});

// ── 3 · 大筛选 card 4 字段 ──────────────────────────────────────────────────────

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

  it('TrendingFilterCard.tsx 引用 TRENDING_FETCH_BTN', () => {
    expect(src(TRENDING_FILTER)).toContain('TRENDING_FETCH_BTN');
  });
});

// ── 4 · search row ────────────────────────────────────────────────────────────

describe('search row · 搜索 placeholder + 共 67 条', () => {
  it('constants 含 搜索爆款内容...', () => {
    expect(src(TRENDING_CONSTANTS)).toContain('搜索爆款内容...');
  });

  it('constants 含 TRENDING_FAKE_TOTAL = 67', () => {
    expect(src(TRENDING_CONSTANTS)).toContain('67');
  });

  it('TrendingSearchBar.tsx 引用 TRENDING_COUNT_TPL + TRENDING_SEARCH_PLACEHOLDER', () => {
    const bar = src(TRENDING_SEARCHBAR);
    expect(bar).toContain('TRENDING_COUNT_TPL');
    expect(bar).toContain('TRENDING_SEARCH_PLACEHOLDER');
  });
});

// ── 5 · 行业 dropdown ─────────────────────────────────────────────────────────

describe('TrendingIndustryDropdown', () => {
  it('渲染 TRENDING_IND_TABS 6 chip', () => {
    const dd = src(TRENDING_IND_DD);
    expect(dd).toContain('TRENDING_IND_TABS');
  });

  it('含 共 N 个行业 footer', () => {
    expect(src(TRENDING_IND_DD)).toContain('TRENDING_IND_TOTAL_TPL');
  });

  it('含 TRENDING_IND_SEARCH_PLACEHOLDER', () => {
    expect(src(TRENDING_IND_DD)).toContain('TRENDING_IND_SEARCH_PLACEHOLDER');
  });
});

// ── 6 · 平台 dropdown ─────────────────────────────────────────────────────────

describe('TrendingPlatformDropdown', () => {
  it('含 全部平台 default label', () => {
    expect(src(TRENDING_PLT_DD)).toContain('TRENDING_PLATFORM_ALL');
  });

  it('含 TRENDING_PLATFORM_OPTIONS', () => {
    expect(src(TRENDING_PLT_DD)).toContain('TRENDING_PLATFORM_OPTIONS');
  });

  it('含 Check icon(选中态)', () => {
    expect(src(TRENDING_PLT_DD)).toContain('Check');
  });
});

// ── 7 · 9 card 完整字面锁 ──────────────────────────────────────────────────────

describe('TRENDING_MOCK · 9 card 字面锁', () => {
  it('9 card title 全部命中', () => {
    const c = src(TRENDING_CONSTANTS);
    expect(c).toContain('B站2026年内容趋势：深度+互动，这3类UP主会爆火！');
    expect(c).toContain('B站UP主2026年如何破圈？我用AI做了个实验！');
    expect(c).toContain('快手2026年短剧变现新模式：我用"直播互动"赚翻了！');
    expect(c).toContain('快手2026年新玩法：老铁经济升级，你必须知道的3个点！');
    expect(c).toContain('视频号2026年知识付费：我用"AI导师"模式，月入10万！');
    expect(c).toContain('快手MCN机构2026年新趋势：抱团取暖，这3点是关键！');
    expect(c).toContain('快手直播带货2026：农村电商新机遇，这3点你得抓住！');
    expect(c).toContain('视频号2026年短剧：我用1000块拍出百万播放量！');
    expect(c).toContain('2026年小红书内容创作：普通人如何打造"情绪价值"爆款？');
  });

  it('4 platform label 各 ≥1 次', () => {
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

// ── 8 · TrendingItemCard 渲染结构 ─────────────────────────────────────────────

describe('TrendingItemCard · 结构锁', () => {
  it('含 metrics emoji 👍 💬 🔄', () => {
    const item = src(TRENDING_ITEM);
    expect(item).toContain('👍');
    expect(item).toContain('💬');
    expect(item).toContain('🔄');
  });

  it('含 card.title + card.body + card.tags + card.likes + card.platformLabel', () => {
    const item = src(TRENDING_ITEM);
    expect(item).toContain('card.title');
    expect(item).toContain('card.body');
    expect(item).toContain('card.tags');
    expect(item).toContain('card.likes');
    expect(item).toContain('card.platformLabel');
  });
});

// ── 9 · TrendingGrid 3 col ────────────────────────────────────────────────────

describe('TrendingGrid · 3 col grid', () => {
  it('含 lg:grid-cols-3', () => {
    expect(src(TRENDING_GRID)).toContain('lg:grid-cols-3');
  });

  it('map items → TrendingItemCard', () => {
    const grid = src(TRENDING_GRID);
    expect(grid).toContain('TrendingItemCard');
    expect(grid).toContain('items.map');
  });
});

// ── 10 · 默认 industry · 自媒体运营 ──────────────────────────────────────────

describe('default industry · self_media', () => {
  it('constants 含 TRENDING_DEFAULT_INDUSTRY_ID = self_media', () => {
    expect(src(TRENDING_CONSTANTS)).toContain('self_media');
  });

  it('page 使用 TRENDING_DEFAULT_INDUSTRY_ID', () => {
    expect(src(TRENDING_PAGE)).toContain('TRENDING_DEFAULT_INDUSTRY_ID');
  });
});
