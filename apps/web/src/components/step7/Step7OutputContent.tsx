import { Copy, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  STEP3_BUTTON_COPY_ALL,
  STEP3_BUTTON_REGENERATE,
} from '@/lib/constants/step3';

// CopywritingOutput from CopywritingAgent (step7 mode)
export interface CopywritingOutput {
  markdown: string;
  structure: string;
  hooks: string[];
  cta: string;
}

interface Props {
  result: CopywritingOutput;
  onRegenerate?: () => void;
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast('已复制');
  } catch {
    toast.error('复制失败 · 请手动');
  }
}

export default function Step7OutputContent({ result, onRegenerate }: Props) {
  const { markdown, cta, hooks } = result;

  function handleCopyAll() {
    const parts: string[] = [markdown];
    if (cta) parts.push(cta);
    if (hooks.length > 0) parts.push(hooks.map((h) => `#${h}`).join(' '));
    void copyToClipboard(parts.join('\n\n'));
  }

  return (
    <div className="space-y-6">
      {/* 顶部: 右侧 [重新生成][复制全部] */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onRegenerate}>
          <RefreshCw className="h-4 w-4 mr-1" />
          {STEP3_BUTTON_REGENERATE}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyAll}>
          <Copy className="h-4 w-4 mr-1" />
          {STEP3_BUTTON_COPY_ALL}
        </Button>
      </div>

      {/* 4 H4 辩论模板 — markdown 渲染 */}
      <div className="glass-card rounded-xl p-5">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-on-surface mb-4">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-label text-on-surface font-bold mt-4 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-label text-on-surface font-bold mt-3 mb-1">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-body-sm text-on-surface leading-relaxed mb-3">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-body-sm text-on-surface mb-3 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-body-sm text-on-surface mb-3 space-y-1">
                {children}
              </ol>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3">
                {children}
              </blockquote>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>

      {/* 评论引导 — AC-2 */}
      {cta && (
        <div className="rounded-lg border border-border bg-surface-container p-4">
          <p className="text-xs font-label text-muted-foreground mb-1">评论区引导</p>
          <p className="text-body-sm text-on-surface">{cta}</p>
        </div>
      )}

      {/* 话题标签 chip — AC-2 · hooks 作为话题标签展示 */}
      {hooks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hooks.map((hook, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"
            >
              #{hook}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
