/**
 * TrendingTable — PRD-15 US-006 AC-4 + AC-5
 * DenseTable: rank + platform icon + title(60 char) + industry + stats + crawledAt + actions
 * Virtual list via react-virtualized AutoSizer + List
 * 液态玻璃皮
 */

import { Bookmark, BookmarkCheck, Eye, PlusCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { List, AutoSizer } from 'react-virtualized';

import { C, F } from '@/components/home-next/ikb/system';
import { Button } from '@/components/ui/button';

import type { TrendingListItem as _TrendingListItemStrict } from '@quanan/clients/router-types';

import 'react-virtualized/styles.css';

// tRPC serializes Date→string on the JSON wire, so crawledAt is string at runtime.
// Widen the type here to accept both to avoid runtime surprises.
type TrendingListItem = Omit<_TrendingListItemStrict, 'crawledAt'> & { crawledAt: Date | string };

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
  /** Pass favMutation.isPending to disable favorite button during in-flight mutation */
  favPending?: boolean;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  return String(n);
}

export function TrendingTable({ items, onViewDetail, onFavorite, onSaveToTopics, favPending = false }: TrendingTableProps) {
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
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, fontSize: 14, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}
        data-testid="trending-empty"
      >
        暂无数据
      </div>
    );
  }

  function rowRenderer({ index, key, style }: { index: number; key: string; style: React.CSSProperties }) {
    const item = items[index];
    if (!item) return null;

    const isTop3 = index < 3;

    return (
      <div
        key={key}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          borderBottom: `0.5px solid rgba(255,255,255,0.08)`,
          transition: 'background 0.2s ease',
        }}
        className="trending-row-hover"
        data-testid={`trending-row-${item.id}`}
      >
        {/* Rank */}
        <span
          style={{
            width: 24,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
            color: isTop3 ? C.ikb : 'rgba(255,255,255,0.84)',
            fontFamily: F.mono,
            textShadow: isTop3 ? C.textShadow : 'none',
          }}
        >
          {item.rank}
        </span>

        {/* Platform */}
        <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center' }} title={item.platform}>
          {PLATFORM_ICONS[item.platform] ?? '🌐'}
        </span>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.35, margin: 0, textShadow: C.textShadow, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.title}>
            {truncate(item.title, 60)}
          </p>
          {item.industry && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{item.industry}</span>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.80)', flexShrink: 0, fontFamily: F.mono }}>
          <span title="点赞">👍 {formatCount(item.likeCount)}</span>
          <span title="评论">💬 {formatCount(item.commentCount)}</span>
          <span title="转发">🔁 {formatCount(item.shareCount)}</span>
          <span title="收藏">⭐ {formatCount(item.collectCount ?? 0)}</span>
        </div>

        {/* CrawledAt */}
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', flexShrink: 0, width: 96, textAlign: 'right', fontFamily: F.mono }}>
          {new Date(item.crawledAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        </span>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="查看详情"
            onClick={() => onViewDetail(item.id)}
            data-testid={`btn-detail-${item.id}`}
            style={{ color: 'rgba(255,255,255,0.80)' }}
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
            style={{ color: 'rgba(255,255,255,0.80)' }}
          >
            <Zap className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={item.isFavorited ? '取消收藏' : '收藏'}
            onClick={() => onFavorite(item.id, item.isFavorited)}
            data-testid={`btn-favorite-${item.id}`}
            data-favorited={item.isFavorited}
            disabled={favPending}
            style={{ color: item.isFavorited ? C.ikb : 'rgba(255,255,255,0.55)' }}
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
            style={{ color: 'rgba(255,255,255,0.80)' }}
          >
            <PlusCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="lg-glass"
      style={{ borderRadius: 16, overflow: 'hidden', height: Math.min(items.length * ROW_HEIGHT, 600) }}
      data-testid="trending-table"
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 16px',
        borderBottom: `0.5px solid rgba(255,255,255,0.15)`,
        background: 'rgba(255,255,255,0.06)',
        fontSize: 12,
        color: 'rgba(255,255,255,0.84)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontFamily: F.mono,
      }}>
        <span style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>排名</span>
        <span style={{ width: 24, flexShrink: 0 }}>平台</span>
        <span style={{ flex: 1 }}>标题 / 行业</span>
        <span style={{ width: 256, textAlign: 'right' }}>点赞 · 评论 · 转发 · 收藏</span>
        <span style={{ width: 96, textAlign: 'right' }}>抓取时间</span>
        <span style={{ width: 112, textAlign: 'right' }}>操作</span>
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
