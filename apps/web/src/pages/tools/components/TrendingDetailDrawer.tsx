/**
 * TrendingDetailDrawer — PRD-15 US-006 AC-9
 * 右侧 Drawer · 显示原文链接 + 完整内容 + 3 操作按钮
 * IKB 红蓝紫渐变换皮
 */

import '@/styles/ikb-hero.css';

import { Bookmark, Copy, ExternalLink, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
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

// Three-colour chip rotation for tag badges
const CHIP_COLOURS = [C.ikb, C.burgundy, C.accent3] as const;

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
      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] p-0"
      >
        {/* Header */}
        <SheetHeader
          className="px-6 pt-6 pb-4"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          <SheetTitle
            className="text-base font-semibold"
            style={{ color: C.ink, fontFamily: F.cn }}
          >
            爆款详情
          </SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#6b7280', fontFamily: F.cn }}>
            加载中…
          </div>
        )}

        {isError && !isLoading && (
          <div
            data-testid="drawer-error"
            className="flex flex-col items-center justify-center h-40 gap-3 text-center px-6"
          >
            <p className="text-sm" style={{ color: '#6b7280', fontFamily: F.cn }}>加载失败，请重试</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(0)}
              className="ikb-focusring text-xs"
              style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
            >
              重试
            </Button>
          </div>
        )}

        {!isLoading && !isError && !detail && (
          <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#6b7280', fontFamily: F.cn }}>
            暂无数据
          </div>
        )}

        {detail && !isLoading && !isError && (
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="px-6 py-4 space-y-4">
              {/* Platform badge + industry chip */}
              <div className="flex items-center gap-2">
                {/* Platform badge — identity colour preserved */}
                <span
                  className="text-xs px-2 py-0.5 rounded font-semibold"
                  style={{
                    color: CHIP_COLOURS[0],
                    backgroundColor: `${CHIP_COLOURS[0]}14`,
                    border: `1px solid ${CHIP_COLOURS[0]}30`,
                    fontFamily: F.mono,
                  }}
                >
                  {PLATFORM_LABELS[detail.platform] ?? detail.platform}
                </span>
                {detail.industry && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      color: CHIP_COLOURS[1],
                      backgroundColor: `${CHIP_COLOURS[1]}14`,
                      border: `1px solid ${CHIP_COLOURS[1]}30`,
                      fontFamily: F.mono,
                    }}
                  >
                    {detail.industry}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2
                className="text-body-md font-semibold leading-snug"
                data-testid="drawer-title"
                style={{ color: C.ink, fontFamily: F.display }}
              >
                {detail.title}
              </h2>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs" style={{ color: '#6b7280', fontFamily: F.mono }}>
                <span>👍 <span style={{ color: C.ink, fontWeight: 700 }}>{detail.likeCount.toLocaleString()}</span></span>
                <span>💬 <span style={{ color: C.ink, fontWeight: 700 }}>{detail.commentCount.toLocaleString()}</span></span>
                <span>🔁 <span style={{ color: C.ink, fontWeight: 700 }}>{detail.shareCount.toLocaleString()}</span></span>
              </div>

              {/* Source URL */}
              {detail.sourceUrl && (
                <a
                  href={detail.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs hover:underline"
                  style={{ color: C.ikb, fontFamily: F.cn }}
                  data-testid="drawer-source-url"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  查看原文
                </a>
              )}

              {/* Content block */}
              <div
                className="rounded p-3"
                style={{
                  background: C.base,
                  border: `1px solid ${C.line}`,
                }}
              >
                <p className="text-xs mb-1.5" style={{ color: '#6b7280', fontFamily: F.mono }}>完整内容</p>
                <p
                  className="text-sm whitespace-pre-wrap leading-relaxed"
                  data-testid="drawer-content"
                  style={{ color: C.ink, fontFamily: F.cn }}
                >
                  {detail.contentText ?? '暂无内容文本'}
                </p>
              </div>

              {/* Crawled at */}
              <p className="text-xs" style={{ color: '#6b7280', fontFamily: F.mono }}>
                抓取时间：{new Date(detail.crawledAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </ScrollArea>
        )}

        {/* Action buttons */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 flex gap-2"
          style={{
            borderTop: `1px solid ${C.line}`,
            backgroundColor: C.paper,
          }}
        >
          {/* 次按钮 — IKB 描边 */}
          <Button
            variant="outline"
            size="sm"
            className="ikb-focusring flex-1 gap-1.5 text-xs"
            style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
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
            className="ikb-focusring flex-1 gap-1.5 text-xs"
            style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
            onClick={handleSaveToLibrary}
            data-testid="drawer-save-btn"
            disabled={!detail}
          >
            <Bookmark className="h-3.5 w-3.5" />
            保存到我的库
          </Button>
          {/* 主按钮 — ikb-gradbtn 流光渐变 */}
          <button
            type="button"
            className="ikb-gradbtn ikb-focusring flex-1 flex items-center justify-center gap-1.5 text-xs rounded-md px-3 py-2 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: F.cn }}
            onClick={handleStep7}
            data-testid="drawer-step7-btn"
            disabled={!detail}
          >
            <Zap className="h-3.5 w-3.5" />
            一键到 Step 7
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
