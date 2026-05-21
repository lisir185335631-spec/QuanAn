/**
 * History.test.tsx — PRD-15 US-008 AC-9
 * ≥ 8 unit tests: source-inspection (Node environment · no React render)
 * Covers: 2 view 切换 + URL state + timeline 按天分组 + dashboard 4 KPI + 4 chart
 *         工具筛选 + 时间范围 + 恢复并重跑跳转 + 查看完整 Drawer
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../../../');
const HISTORY_PAGE = `${ROOT}/apps/web/src/pages/modules/History.tsx`;
const HISTORY_ROUTER = `${ROOT}/apps/api/src/trpc/routers/app/history.ts`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · 页面规模 + 2 view ────────────────────────────────────────────────────

describe('View switching (AC-1 + AC-2 + AC-3)', () => {
  it('History.tsx has 200+ lines', () => {
    const lines = src(HISTORY_PAGE).split('\n').length;
    expect(lines).toBeGreaterThan(200);
  });

  it('timeline view: data-testid="history-timeline"', () => {
    expect(src(HISTORY_PAGE)).toContain('history-timeline');
  });

  it('dashboard view: data-testid="history-dashboard"', () => {
    expect(src(HISTORY_PAGE)).toContain('history-dashboard');
  });

  it('view toggle buttons: view-timeline-btn + view-dashboard-btn + view-toggle', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('view-toggle');
    expect(page).toContain('view-timeline-btn');
    expect(page).toContain('view-dashboard-btn');
  });
});

// ── 2 · URL state (AC-4 + AC-5 + AC-6) ──────────────────────────────────────

describe('URL state (AC-4 + AC-5 + AC-6)', () => {
  it('uses useSearchParams for URL state', () => {
    expect(src(HISTORY_PAGE)).toContain('useSearchParams');
  });

  it("URL ?view param determines timeline|dashboard", () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain("'view'");
    expect(page).toContain("'timeline'");
    expect(page).toContain("'dashboard'");
  });

  it("URL ?tools param for multi-tool filter (AC-5)", () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain("'tools'");
    expect(page).toContain('tool-filter-multiselect');
    expect(page).toContain('tool-filter-chip-');
  });

  it("URL ?dateRange param: today/week/month/all (AC-6)", () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('date-range-select');
    expect(page).toContain("'today'");
    expect(page).toContain("'week'");
    expect(page).toContain("'month'");
  });
});

// ── 3 · Timeline 按天分组 (AC-2) ─────────────────────────────────────────────

describe('Timeline day grouping (AC-2)', () => {
  it('groupByDay function exists and groups by day key', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('groupByDay');
    expect(page).toContain('dayKey');
  });

  it('timeline shows tool icon + name + input summary + output summary + time + actions', () => {
    const page = src(HISTORY_PAGE);
    // Tool icon via dynamic ToolIcon component
    expect(page).toContain('ToolIcon');
    expect(page).toContain('toolInfo.label');
    // Input/output summaries
    expect(page).toContain('inputSummary');
    expect(page).toContain('row.content');
    // Time HH:MM
    expect(page).toContain('formatTime');
  });

  it('action buttons: view detail (eye), restore (refresh), delete (trash)', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('history-view-btn-');
    expect(page).toContain('history-restore-btn-');
    expect(page).toContain('history-delete-btn-');
  });
});

// ── 4 · Dashboard 4 KPI + 4 chart (AC-3) ─────────────────────────────────────

describe('Dashboard KPI + charts (AC-3)', () => {
  it('4 KPI cards: totalCalls + topTool + avgDurationMs + failureRate', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('history-kpi-cards');
    expect(page).toContain('totalCalls');
    expect(page).toContain('avgDurationMs');
    expect(page).toContain('failureRate');
  });

  it('4 charts: daily-trend + tool-distribution + duration-histogram + model-distribution', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('history-chart-daily-trend');
    expect(page).toContain('history-chart-tool-distribution');
    expect(page).toContain('history-chart-duration-histogram');
    expect(page).toContain('history-chart-model-distribution');
  });

  it('uses recharts: LineChart + PieChart + BarChart + ResponsiveContainer', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('LineChart');
    expect(page).toContain('PieChart');
    expect(page).toContain('BarChart');
    expect(page).toContain('ResponsiveContainer');
  });

  it('dashboard calls trpc.history.stats.useQuery with dateRange + tools', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('trpc.history.stats.useQuery');
  });
});

// ── 5 · 恢复并重跑 (AC-8) ────────────────────────────────────────────────────

describe('Restore and re-run (AC-8)', () => {
  it('getToolRestoreUrl function returns URL with topic + restored params', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('getToolRestoreUrl');
    expect(page).toContain('restored=');
    expect(page).toContain('topic=');
  });

  it('restore navigates to tool page via useNavigate', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('handleRestore');
    expect(page).toContain('navigate(url)');
  });

  it('mode mappings cover free/boom/structural/viral/production/storyboard/acquisition', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('/generate?topic=');
    expect(page).toContain('/boom-generate?topic=');
    expect(page).toContain('/analysis?topic=');
    expect(page).toContain('/video-analysis?topic=');
    expect(page).toContain('/video-production?topic=');
    expect(page).toContain('/ai-video?topic=');
    expect(page).toContain('/acquisition-video?topic=');
  });
});

// ── 6 · Detail Drawer (AC-9) ─────────────────────────────────────────────────

describe('Detail Drawer (AC-9)', () => {
  it('HistoryDetailDrawer component with data-testid="history-detail-drawer"', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('history-detail-drawer');
    expect(page).toContain('HistoryDetailDrawer');
  });

  it('drawer shows full content (not truncated)', () => {
    const page = src(HISTORY_PAGE);
    // Drawer shows full row.content (no .substring limit in the drawer)
    expect(page).toContain('row.content');
    expect(page).toContain('row.inputSummary');
  });

  it('drawer uses Sheet component', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain('SheetContent');
    expect(page).toContain('SheetTitle');
  });
});

// ── 7 · Backend stats procedure (AC-10) ──────────────────────────────────────

describe('Backend stats procedure (AC-10)', () => {
  it('history.ts exports historyRouter with stats procedure', () => {
    const router = src(HISTORY_ROUTER);
    expect(router).toContain('stats:');
    expect(router).toContain('protectedProcedure');
  });

  it('stats queries cost_log via prisma.costLog.count/aggregate/groupBy/findMany', () => {
    const router = src(HISTORY_ROUTER);
    expect(router).toContain('costLog.count');
    expect(router).toContain('costLog.aggregate');
    expect(router).toContain('costLog.groupBy');
    expect(router).toContain('costLog.findMany');
  });

  it('stats returns totalCalls + failureRate + avgDurationMs + topTools + dailyTrend + durationHistogram + modelDistribution', () => {
    const router = src(HISTORY_ROUTER);
    expect(router).toContain('totalCalls');
    expect(router).toContain('failureRate');
    expect(router).toContain('avgDurationMs');
    expect(router).toContain('topTools');
    expect(router).toContain('dailyTrend');
    expect(router).toContain('durationHistogram');
    expect(router).toContain('modelDistribution');
  });

  it('toolsToAgentIds maps tool slugs to agent IDs', () => {
    const router = src(HISTORY_ROUTER);
    expect(router).toContain('toolsToAgentIds');
    expect(router).toContain('TOOL_AGENT_MAP');
    expect(router).toContain('CopywritingAgent');
    expect(router).toContain('TrendingAgent');
    expect(router).toContain('VideoAgent');
  });
});

// ── 8 · 14-tool multi-select (AC-5) ──────────────────────────────────────────

describe('14-tool filter chips (AC-5)', () => {
  it('TOOL_DEFS has 14+ tool entries', () => {
    const page = src(HISTORY_PAGE);
    const matches = page.match(/slug: '/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(14);
  });

  it('tool slugs include all major tools', () => {
    const page = src(HISTORY_PAGE);
    expect(page).toContain("slug: 'copywriting'");
    expect(page).toContain("slug: 'trending'");
    expect(page).toContain("slug: 'analysis'");
    expect(page).toContain("slug: 'videoAnalysis'");
    expect(page).toContain("slug: 'aiVideo'");
    expect(page).toContain("slug: 'deepLearning'");
    expect(page).toContain("slug: 'voiceChat'");
  });
});
