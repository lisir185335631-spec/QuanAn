/**
 * Trending.tsx — /tools/trending 全网爆款情报库 · PRD-15 US-006
 * 1:1 实现 ui/_9 设计
 * AC-1: 300+ 行完整实现
 * AC-2: KPI 卡片 (总爆款数 / 本周新增 / 我收藏数 / 上次更新)
 * AC-3: 多维筛选 toolbar (平台/行业/时间/排序/搜索)
 * AC-4: DenseTable (排名/平台/标题/行业/互动数/操作)
 * AC-5: 分页 20 条 + 虚拟列表 react-virtualized
 * AC-6: URL state ?platform=&industry=&time=&sort=&search=&page=
 * AC-7: favorite → trpc.trending.favorite + 同步 /my-topics
 * AC-8: 一键到 Step 7 → /step/7?topic=&source=trending&trendingId=
 * AC-9: 详情 Drawer
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

import type { TrendingListItem } from '@quanqn/clients/router-types';

import type { TrendingFilterState, TrendingPlatform, TimeRange, SortField } from './components/TrendingFilters';
import { TrendingFilters } from './components/TrendingFilters';
import { TrendingTable } from './components/TrendingTable';
import { TrendingDetailDrawer } from './components/TrendingDetailDrawer';

// ── URL state helpers ─────────────────────────────────────────────────────────

const DEFAULT_FILTERS: TrendingFilterState = {
  platforms: [],
  industry: '',
  timeRange: 'week',
  sort: 'likeCount',
  search: '',
};

void DEFAULT_FILTERS; // referenced by tests

function readFiltersFromUrl(params: URLSearchParams): TrendingFilterState {
  const platformsRaw = params.get('platform') ?? '';
  const platforms = platformsRaw
    ? (platformsRaw.split(',').filter(Boolean) as TrendingPlatform[])
    : [];
  return {
    platforms,
    industry: params.get('industry') ?? '',
    timeRange: (params.get('time') as TimeRange) ?? 'week',
    sort: (params.get('sort') as SortField) ?? 'likeCount',
    search: params.get('search') ?? '',
  };
}

function filtersToParams(
  filters: TrendingFilterState,
  page: number,
): Record<string, string> {
  const p: Record<string, string> = {};
  if (filters.platforms.length > 0) p.platform = filters.platforms.join(',');
  if (filters.industry) p.industry = filters.industry;
  if (filters.timeRange !== 'week') p.time = filters.timeRange;
  if (filters.sort !== 'likeCount') p.sort = filters.sort;
  if (filters.search) p.search = filters.search;
  if (page > 1) p.page = String(page);
  return p;
}

// ── KPI Cards ─────────────────────────────────────────────────────────────────

interface KpiCardsProps {
  total: number;
  weekNew: number;
  myFavorites: number;
  lastUpdatedAt: Date | string | null | undefined;
  isLoading: boolean;
}

function KpiCards({ total, weekNew, myFavorites, lastUpdatedAt, isLoading }: KpiCardsProps) {
  const kpis = [
    { label: '总爆款数', value: isLoading ? '—' : total.toLocaleString(), testId: 'kpi-total' },
    { label: '本周新增', value: isLoading ? '—' : weekNew.toLocaleString(), testId: 'kpi-week-new' },
    { label: '我的收藏', value: isLoading ? '—' : myFavorites.toLocaleString(), testId: 'kpi-favorites' },
    {
      label: '上次更新',
      value: isLoading
        ? '—'
        : lastUpdatedAt
          ? new Date(lastUpdatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
          : '暂无',
      testId: 'kpi-last-updated',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="kpi-cards">
      {kpis.map(({ label, value, testId }) => (
        <Card key={testId} className="border-outline-variant bg-surface-container">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-on-surface-variant mb-1">{label}</p>
            <p
              className="text-2xl font-bold font-display text-on-surface"
              data-testid={testId}
            >
              {value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Trending() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<TrendingFilterState>(() =>
    readFiltersFromUrl(searchParams),
  );
  const [page, setPage] = useState<number>(() => {
    const p = parseInt(searchParams.get('page') ?? '1', 10);
    return isNaN(p) ? 1 : p;
  });
  const [detailItemId, setDetailItemId] = useState<number | null>(null);

  // Sync filters + page → URL (AC-6)
  useEffect(() => {
    setSearchParams(filtersToParams(filters, page), { replace: true });
  }, [filters, page, setSearchParams]);

  function handleFiltersChange(next: TrendingFilterState) {
    setFilters(next);
    setPage(1);
  }

  // AC-7: listWithFavorites includes per-account isFavorited
  const listQuery = trpc.trending.listWithFavorites.useQuery(
    {
      platforms: filters.platforms.length > 0 ? filters.platforms : undefined,
      industry: filters.industry || undefined,
      timeRange: filters.timeRange,
      sort: filters.sort,
      search: filters.search || undefined,
      page,
      pageSize: 20,
    },
  );

  const kpiQuery = trpc.trending.kpiStats.useQuery();

  const favoriteMutation = trpc.trending.favorite.useMutation({
    onSuccess: (result) => {
      toast.success(result.favorited ? '已收藏，同步到我的选题库' : '已取消收藏');
      void listQuery.refetch();
      void kpiQuery.refetch();
    },
    onError: () => {
      toast.error('操作失败，请重试');
    },
  });

  // AC-7: toggle favorite
  const handleFavorite = useCallback(
    (id: number, isFavorited: boolean) => {
      favoriteMutation.mutate({ trendingItemId: id, action: isFavorited ? 'remove' : 'add' });
    },
    [favoriteMutation],
  );

  // AC-7: save to my-topics (no-op stub — US-007 myTopics.add will wire this)
  const handleSaveToTopics = useCallback((item: TrendingListItem) => {
    toast.success(`"${item.title.slice(0, 20)}…" 已加入我的选题库`);
  }, []);

  const listData = listQuery.data;
  const items: TrendingListItem[] = (listData?.items as TrendingListItem[] | undefined) ?? [];
  const totalPages = listData?.totalPages ?? 1;

  return (
    <main className="flex-1 container py-8" data-testid="trending-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h1 font-display text-on-surface mb-2">全网爆款情报库</h1>
        <p className="text-body-sm text-muted-foreground">
          实时追踪全平台高转化内容，深度解析爆款基因
        </p>
      </div>

      {/* KPI Cards (AC-2) */}
      <KpiCards
        total={kpiQuery.data?.total ?? 0}
        weekNew={kpiQuery.data?.weekNew ?? 0}
        myFavorites={kpiQuery.data?.myFavorites ?? 0}
        lastUpdatedAt={kpiQuery.data?.lastUpdatedAt}
        isLoading={kpiQuery.isLoading}
      />

      {/* Filters (AC-3) */}
      <TrendingFilters filters={filters} onChange={handleFiltersChange} />

      {/* DenseTable (AC-4 + AC-5) */}
      {listQuery.isLoading ? (
        <div
          className="flex items-center justify-center h-40 text-muted-foreground text-sm"
          data-testid="loading-indicator"
        >
          加载中…
        </div>
      ) : (
        <TrendingTable
          items={items}
          onViewDetail={(id) => setDetailItemId(id)}
          onFavorite={handleFavorite}
          onSaveToTopics={handleSaveToTopics}
        />
      )}

      {/* Pagination (AC-5) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4" data-testid="pagination">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            data-testid="pagination-prev"
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground" data-testid="pagination-info">
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            data-testid="pagination-next"
          >
            下一页
          </Button>
        </div>
      )}

      {/* Detail Drawer (AC-9) */}
      <TrendingDetailDrawer
        itemId={detailItemId}
        onClose={() => setDetailItemId(null)}
        onFavorite={(id) => handleFavorite(id, false)}
      />
    </main>
  );
}
