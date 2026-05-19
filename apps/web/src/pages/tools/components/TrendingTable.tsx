/**
 * TrendingTable — PRD-15 US-006 AC-4 + AC-5
 * DenseTable: rank + platform icon + title(60 char) + industry + stats + crawledAt + actions
 * Virtual list via react-virtualized AutoSizer + List
 */

import { Bookmark, BookmarkCheck, Eye, PlusCircle, Zap } from 'lucide-react';
import { List, AutoSizer } from 'react-virtualized';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';

import type { TrendingListItem } from '@quanan/clients/router-types';

import 'react-virtualized/styles.css';

const PLATFORM_ICONS: Record<string, string> = {
  douyin: '📱',
  xiaohongshu: '📕',
  bilibili: '📺',
  kuaishou: '🎬',
  shipinhao: '📹',
  weibo: '🌐',
};

const ROW_HEIGHT = 60;

interface TrendingTableProps {
  items: TrendingListItem[];
  onViewDetail: (id: number) => void;
  onFavorite: (id: number, isFavorited: boolean) => void;
  onSaveToTopics: (item: TrendingListItem) => void;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  return String(n);
}

export function TrendingTable({ items, onViewDetail, onFavorite, onSaveToTopics }: TrendingTableProps) {
  const navigate = useNavigate();

  function handleStep7(item: TrendingListItem) {
    const params = new URLSearchParams({
      topic: item.title,
      source: 'trending',
      trendingId: String(item.id),
    });
    navigate(`/step/7?${params.toString()}`);
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm" data-testid="trending-empty">
        暂无数据
      </div>
    );
  }

  function rowRenderer({ index, key, style }: { index: number; key: string; style: React.CSSProperties }) {
    const item = items[index];
    if (!item) return null;

    return (
      <div
        key={key}
        style={style}
        className="flex items-center gap-3 px-4 border-b border-outline-variant/40 hover:bg-surface-container-high/30 transition-colors"
        data-testid={`trending-row-${item.id}`}
      >
        {/* Rank */}
        <span
          className="w-6 text-center text-sm font-bold shrink-0"
          style={{ color: index < 3 ? 'var(--color-primary, #f2ca50)' : 'var(--tw-text-opacity)' }}
        >
          {item.rank}
        </span>

        {/* Platform */}
        <span className="text-base shrink-0 w-6 text-center" title={item.platform}>
          {PLATFORM_ICONS[item.platform] ?? '🌐'}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-on-surface leading-tight" title={item.title}>
            {truncate(item.title, 60)}
          </p>
          {item.industry && (
            <span className="text-xs text-muted-foreground">{item.industry}</span>
          )}
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span title="点赞">👍 {formatCount(item.likeCount)}</span>
          <span title="评论">💬 {formatCount(item.commentCount)}</span>
          <span title="转发">🔁 {formatCount(item.shareCount)}</span>
          <span title="收藏">⭐ {formatCount(item.collectCount ?? 0)}</span>
        </div>

        {/* CrawledAt */}
        <span className="hidden lg:block text-xs text-muted-foreground shrink-0 w-24 text-right">
          {new Date(item.crawledAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="查看详情"
            onClick={() => onViewDetail(item.id)}
            data-testid={`btn-detail-${item.id}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="一键到 Step 7"
            onClick={() => handleStep7(item)}
            data-testid={`btn-step7-${item.id}`}
          >
            <Zap className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${item.isFavorited ? 'text-yellow-400' : ''}`}
            title={item.isFavorited ? '取消收藏' : '收藏'}
            onClick={() => onFavorite(item.id, item.isFavorited)}
            data-testid={`btn-favorite-${item.id}`}
            data-favorited={item.isFavorited}
          >
            {item.isFavorited ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="保存到我的选题库"
            onClick={() => onSaveToTopics(item)}
            data-testid={`btn-save-topics-${item.id}`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-outline-variant overflow-hidden bg-surface-container"
      style={{ height: Math.min(items.length * ROW_HEIGHT, 600) }}
      data-testid="trending-table"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-outline-variant bg-surface-container-high text-xs text-muted-foreground uppercase tracking-wide">
        <span className="w-6 text-center shrink-0">排名</span>
        <span className="w-6 shrink-0">平台</span>
        <span className="flex-1">标题 / 行业</span>
        <span className="hidden md:block w-64 text-right">点赞 · 评论 · 转发 · 收藏</span>
        <span className="hidden lg:block w-24 text-right">抓取时间</span>
        <span className="w-28 text-right">操作</span>
      </div>

      {/* Virtualized rows */}
      <AutoSizer disableHeight>
        {({ width }) => (
          <List
            width={width}
            height={Math.min(items.length * ROW_HEIGHT, 540)}
            rowCount={items.length}
            rowHeight={ROW_HEIGHT}
            rowRenderer={rowRenderer}
            overscanRowCount={5}
          />
        )}
      </AutoSizer>
    </div>
  );
}
