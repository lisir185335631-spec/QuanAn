/**
 * StreamdownPreview — SSE 流式 markdown 渲染组件 · PRD-15 US-002 AC-9
 * 模拟前端打字机效果(Streamdown 是前端打字机模拟 · spec §ⅩⅬⅢ)
 * - isStreaming=true: 逐字动画直至 content 全部展示
 * - isStreaming=false: 直接渲染全文 markdown
 * AC-8: meta chunk 首显 {model: actualModel}
 * AC-9: lazy import + Suspense — consumer 端使用 const StreamdownPreview = lazy(() => import('@/components/StreamdownPreview'))
 */

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamdownPreviewProps {
  /** 完整 markdown 内容 */
  content: string;
  /** 是否模拟流式打字动画 */
  isStreaming: boolean;
  /** 生成时使用的模型名（meta chunk 显示用） */
  modelName?: string | null;
  /** 流式动画结束回调 */
  onComplete?: () => void;
}

export default function StreamdownPreview({
  content,
  isStreaming,
  modelName,
  onComplete,
}: StreamdownPreviewProps) {
  const [displayed, setDisplayed] = useState('');
  const [animDone, setAnimDone] = useState(false);
  const indexRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayed(content);
      setAnimDone(true);
      return;
    }

    // reset on new streaming session
    indexRef.current = 0;
    setDisplayed('');
    setAnimDone(false);

    // 每帧追加 N 个字符 — 目标约 2-3 秒展示完
    const charsPerFrame = Math.max(1, Math.ceil(content.length / 180));

    function tick() {
      const i = indexRef.current;
      if (i >= content.length) {
        setAnimDone(true);
        onComplete?.();
        return;
      }
      const next = Math.min(i + charsPerFrame, content.length);
      indexRef.current = next;
      setDisplayed(content.slice(0, next));
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, isStreaming]);

  const showCursor = isStreaming && !animDone;

  return (
    <div className="space-y-3">
      {modelName && (
        <div className="flex items-center gap-1.5 text-body-xs text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span data-testid="streamdown-model">{modelName}</span>
        </div>
      )}
      <div className="rounded-lg border border-border bg-surface-container p-4 min-h-[120px]">
        <article className="prose prose-sm max-w-none text-on-surface prose-headings:text-on-surface prose-p:text-muted-foreground prose-strong:text-on-surface prose-li:text-muted-foreground prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayed}
          </ReactMarkdown>
        </article>
        {showCursor && (
          <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}
