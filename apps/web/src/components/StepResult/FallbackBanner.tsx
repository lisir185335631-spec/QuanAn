/**
 * US-015 AC-3/AC-4/AC-14
 * FallbackBanner — 显示 isFallback=true 警示 + 重试按钮
 * AC-4: 重试 button → 调 onRetry() → 清空结果 → 表单重新显示 → 用户可重新提交
 * AC-14: 必含'重试'按钮
 */

import { Button } from '@/components/ui/button';

interface FallbackBannerProps {
  onRetry?: () => void;
}

export function FallbackBanner({ onRetry }: FallbackBannerProps) {
  return (
    <div
      data-testid="fallback-banner"
      className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-warning" aria-hidden="true">⚠</span>
        <p className="text-body-sm text-warning">
          系统繁忙 · 此为备用版本 · 内容仅供参考
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          data-testid="fallback-retry-btn"
          className="shrink-0 border-warning/40 text-warning hover:bg-warning/10"
        >
          重试
        </Button>
      )}
    </div>
  );
}
