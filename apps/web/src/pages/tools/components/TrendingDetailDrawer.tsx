/**
 * TrendingDetailDrawer — PRD-15 US-006 AC-9
 * 右侧 Drawer · 显示原文链接 + 完整内容 + 3 操作按钮
 * 液态玻璃皮
 */

import { Bookmark, Copy, ExternalLink, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { C, F } from '@/components/home-next/ikb/system';
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
const CHIP_COLOURS = [C.ikb, C.yellow, C.accent3] as const;

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
        style={{
          background: 'linear-gradient(180deg, rgba(20,34,70,0.95) 0%, rgba(16,28,56,0.98) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderLeft: `0.5px solid rgba(255,255,255,0.18)`,
        }}
      >
        {/* Header */}
        <SheetHeader
          className="px-6 pt-6 pb-4"
          style={{ borderBottom: `0.5px solid rgba(255,255,255,0.15)` }}
        >
          <SheetTitle
            style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
          >
            爆款详情
          </SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, fontSize: 14, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>
            加载中…
          </div>
        )}

        {isError && !isLoading && (
          <div
            data-testid="drawer-error"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 12, textAlign: 'center', padding: '0 24px' }}
          >
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>加载失败，请重试</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(0)}
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: C.ink, fontFamily: F.cn, background: 'rgba(255,255,255,0.08)', fontSize: 12 }}
            >
              重试
            </Button>
          </div>
        )}

        {!isLoading && !isError && !detail && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, fontSize: 14, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>
            暂无数据
          </div>
        )}

        {detail && !isLoading && !isError && (
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Platform badge + industry chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Platform badge — identity colour preserved */}
                <span
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontWeight: 700,
                    color: CHIP_COLOURS[0],
                    backgroundColor: 'rgba(168,197,224,0.15)',
                    border: `1px solid rgba(168,197,224,0.3)`,
                    fontFamily: F.mono,
                  }}
                >
                  {PLATFORM_LABELS[detail.platform] ?? detail.platform}
                </span>
                {detail.industry && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      color: CHIP_COLOURS[1],
                      backgroundColor: 'rgba(228,238,255,0.12)',
                      border: `1px solid rgba(228,238,255,0.25)`,
                      fontFamily: F.mono,
                    }}
                  >
                    {detail.industry}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2
                data-testid="drawer-title"
                style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.45, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}
              >
                {detail.title}
              </h2>

              {/* Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: F.mono }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.ikb, fontFamily: F.cn, textDecoration: 'none' }}
                  data-testid="drawer-source-url"
                >
                  <ExternalLink style={{ height: 14, width: 14 }} />
                  查看原文
                </a>
              )}

              {/* Content block */}
              <div
                className="lg-glass"
                style={{ borderRadius: 12, padding: 12 }}
              >
                <p style={{ fontSize: 12, marginBottom: 6, color: 'rgba(255,255,255,0.5)', fontFamily: F.mono }}>完整内容</p>
                <p
                  data-testid="drawer-content"
                  style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.65, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow, margin: 0 }}
                >
                  {detail.contentText ?? '暂无内容文本'}
                </p>
              </div>

              {/* Crawled at */}
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>
                抓取时间：{new Date(detail.crawledAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </ScrollArea>
        )}

        {/* Action buttons */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            display: 'flex',
            gap: 8,
            borderTop: `0.5px solid rgba(255,255,255,0.15)`,
            backgroundColor: 'rgba(16,28,56,0.95)',
          }}
        >
          {/* 次按钮 — 液态玻璃描边 */}
          <Button
            variant="outline"
            size="sm"
            style={{ flex: 1, gap: 6, fontSize: 12, borderColor: 'rgba(255,255,255,0.2)', color: C.ink, fontFamily: F.cn, background: 'rgba(255,255,255,0.07)' }}
            onClick={handleCopyContent}
            data-testid="drawer-copy-btn"
            disabled={!detail}
          >
            <Copy style={{ height: 14, width: 14 }} />
            复制内容
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={{ flex: 1, gap: 6, fontSize: 12, borderColor: 'rgba(255,255,255,0.2)', color: C.ink, fontFamily: F.cn, background: 'rgba(255,255,255,0.07)' }}
            onClick={handleSaveToLibrary}
            data-testid="drawer-save-btn"
            disabled={!detail}
          >
            <Bookmark style={{ height: 14, width: 14 }} />
            保存到我的库
          </Button>
          {/* 主按钮 — lg-gradbtn 紫粉渐变 */}
          <button
            type="button"
            className="lg-gradbtn"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, borderRadius: 6, padding: '8px 12px', fontWeight: 700, fontFamily: F.cn, cursor: 'pointer', opacity: !detail ? 0.5 : 1 }}
            onClick={handleStep7}
            data-testid="drawer-step7-btn"
            disabled={!detail}
          >
            <Zap style={{ height: 14, width: 14 }} />
            一键到 Step 7
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
