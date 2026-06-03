/**
 * TrendingDetailDrawer — PRD-15 US-006 AC-9
 * 右侧 Drawer · 显示原文链接 + 完整内容 + 3 操作按钮
 */

import { Bookmark, Copy, ExternalLink, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { trpc } from '@/lib/trpc';

import type { TrendingDetailItem } from '@quanan/clients/router-types';

const PLATFORM_LABELS: Record<string, string> = {
  douyin: '📱 抖音',
  xiaohongshu: '📕 小红书',
  bilibili: '📺 B站',
  kuaishou: '🎬 快手',
  shipinhao: '📹 视频号',
  weibo: '🌐 微博',
};

interface TrendingDetailDrawerProps {
  itemId: number | null;
  onClose: () => void;
  onFavorite?: (id: number) => void;
}

export function TrendingDetailDrawer({ itemId, onClose, onFavorite }: TrendingDetailDrawerProps) {
  const navigate = useNavigate();
  const { data: detail, isLoading, isError } = trpc.trending.detail.useQuery(
    { id: itemId! },
    { enabled: !!itemId },
  ) as { data: TrendingDetailItem | undefined; isLoading: boolean; isError: boolean };

  function handleCopyContent() {
    if (!detail?.contentText) return;
    void navigator.clipboard.writeText(detail.contentText);
    toast.success('内容已复制到剪贴板');
  }

  function handleStep7() {
    if (!detail) return;
    const params = new URLSearchParams({
      topic: detail.title,
      source: 'trending',
      trendingId: String(detail.id),
    });
    navigate(`/step/7?${params.toString()}`);
    onClose();
  }

  function handleSaveToLibrary() {
    if (!detail) return;
    onFavorite?.(detail.id);
    toast.success('已收藏');
  }

  return (
    <Sheet open={!!itemId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] bg-surface-container border-outline-variant p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-outline-variant">
          <SheetTitle className="text-on-surface text-base font-semibold">爆款详情</SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">加载中…</div>
        )}

        {isError && !isLoading && (
          <div
            data-testid="drawer-error"
            className="flex flex-col items-center justify-center h-40 gap-3 text-center px-6"
          >
            <p className="text-sm text-muted-foreground">加载失败，请重试</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(0)}
              className="text-xs"
            >
              重试
            </Button>
          </div>
        )}

        {!isLoading && !isError && !detail && (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">暂无数据</div>
        )}

        {detail && !isLoading && !isError && (
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="px-6 py-4 space-y-4">
              {/* Platform badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                  {PLATFORM_LABELS[detail.platform] ?? detail.platform}
                </span>
                {detail.industry && (
                  <span className="text-xs text-muted-foreground border border-outline-variant px-2 py-0.5 rounded">
                    {detail.industry}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-body-md font-semibold text-on-surface leading-snug" data-testid="drawer-title">
                {detail.title}
              </h2>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>👍 {detail.likeCount.toLocaleString()}</span>
                <span>💬 {detail.commentCount.toLocaleString()}</span>
                <span>🔁 {detail.shareCount.toLocaleString()}</span>
              </div>

              {/* Source URL */}
              {detail.sourceUrl && (
                <a
                  href={detail.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  data-testid="drawer-source-url"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  查看原文
                </a>
              )}

              {/* Content */}
              <div className="bg-surface rounded border border-outline-variant p-3">
                <p className="text-xs text-on-surface-variant mb-1.5">完整内容</p>
                <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed" data-testid="drawer-content">
                  {detail.contentText ?? '暂无内容文本'}
                </p>
              </div>

              {/* Crawled at */}
              <p className="text-xs text-muted-foreground">
                抓取时间：{new Date(detail.crawledAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </ScrollArea>
        )}

        {/* Action buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-outline-variant bg-surface-container flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={handleCopyContent}
            data-testid="drawer-copy-btn"
            disabled={!detail}
          >
            <Copy className="h-3.5 w-3.5" />
            复制内容
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={handleSaveToLibrary}
            data-testid="drawer-save-btn"
            disabled={!detail}
          >
            <Bookmark className="h-3.5 w-3.5" />
            保存到我的库
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleStep7}
            data-testid="drawer-step7-btn"
            disabled={!detail}
          >
            <Zap className="h-3.5 w-3.5" />
            一键到 Step 7
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
