/**
 * CopywritingPreview — 文案输出预览面板 · PRD-15 US-002 AC-4
 * - 流式 markdown 展示(StreamdownPreview)
 * - 完成后: 复制全文 / 另存为模板 / 保存到历史 三按钮
 * - 失败时 color=error 明确提示
 * - AC-8: SSE meta chunk {type:'meta', meta:{model:actualModel}} 显示
 */

import { lazy, Suspense, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

const StreamdownPreview = lazy(() => import('@/components/StreamdownPreview'));

interface CopywritingPreviewProps {
  content: string | null;
  isStreaming: boolean;
  modelName?: string | null;
  error?: string | null;
  onSaveHistory?: () => void;
  onSaveTemplate?: () => void;
}

export function CopywritingPreview({
  content,
  isStreaming,
  modelName,
  error,
  onSaveHistory,
  onSaveTemplate,
}: CopywritingPreviewProps) {
  const [animComplete, setAnimComplete] = useState(false);

  async function copyAll() {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      toast.success('已复制全文');
    } catch {
      toast.error('复制失败');
    }
  }

  function handleAnimComplete() {
    setAnimComplete(true);
  }

  // reset animComplete when new content arrives
  const showActions = !isStreaming && animComplete && content;

  if (error) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-error/50 bg-error/5 p-8 text-center"
        data-testid="copywriting-error"
      >
        <p className="text-body-sm text-error font-medium">生成失败</p>
        <p className="text-body-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!content && !isStreaming) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8 text-center"
        data-testid="copywriting-placeholder"
      >
        <div className="text-3xl">✨</div>
        <p className="text-body-sm text-muted-foreground">
          配置参数后点击生成，AI 将为你创作爆款文案
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3" data-testid="copywriting-preview">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-body-xs text-muted-foreground p-4">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            加载中…
          </div>
        }
      >
        <div className="flex-1 overflow-auto">
          <StreamdownPreview
            content={content ?? ''}
            isStreaming={isStreaming}
            modelName={modelName}
            onComplete={handleAnimComplete}
          />
        </div>
      </Suspense>

      {showActions && (
        <div
          className="flex flex-wrap gap-2 pt-1"
          data-testid="copywriting-actions"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={copyAll}
            data-testid="copy-all-btn"
          >
            复制全文
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onSaveTemplate}
            data-testid="save-template-btn"
          >
            另存为模板
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onSaveHistory}
            data-testid="save-history-btn"
          >
            保存到历史
          </Button>
        </div>
      )}
    </div>
  );
}
