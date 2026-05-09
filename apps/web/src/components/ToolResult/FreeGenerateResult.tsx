/**
 * FreeGenerateResult — /generate 工具页结果渲染 · PRD-5 US-004
 * Renders history row from copywriting.freeGenerate: markdown content + metadata
 * US-004 AC-5: react-markdown + remark-gfm · 同 Step7Result 模式
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FreeGenerateData {
  /** API response: content field (History row) */
  content?: string;
  /** Legacy/spec field */
  markdown?: string;
  /** isFallback from History row */
  isFallback?: boolean;
  scriptType?: string;
  elements?: string[];
  tokensUsed?: number;
  modelUsed?: string | null;
}

interface FreeGenerateResultProps {
  data: unknown;
  isFallback?: boolean;
}

export function FreeGenerateResult({ data, isFallback }: FreeGenerateResultProps) {
  const d = (data ?? {}) as FreeGenerateData;
  const md = d.content ?? d.markdown ?? '';
  const wordCount = md.replace(/\s+/g, '').length;

  return (
    <div className="space-y-4" data-testid="tool-result-generate">
      {isFallback && (
        <p className="rounded border border-border px-3 py-1 text-body-xs text-muted-foreground">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}

      {(d.scriptType || (d.elements && d.elements.length > 0)) && (
        <div className="flex flex-wrap gap-2 text-body-xs">
          {d.scriptType && (
            <span className="rounded-md bg-surface-container px-2 py-0.5 text-muted-foreground">
              {d.scriptType}
            </span>
          )}
          {(d.elements ?? []).map((el) => (
            <span key={el} className="rounded-md bg-primary/10 px-2 py-0.5 text-primary">
              {el}
            </span>
          ))}
        </div>
      )}

      {wordCount > 0 && (
        <p className="text-body-xs text-muted-foreground">字数：约 {wordCount} 字</p>
      )}

      <div className="rounded-lg border border-border bg-surface-container p-4">
        <article className="prose prose-sm max-w-none text-on-surface prose-headings:text-on-surface prose-p:text-muted-foreground prose-strong:text-on-surface prose-li:text-muted-foreground prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
