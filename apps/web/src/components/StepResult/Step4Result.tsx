import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

interface Step4Data {
  markdown?: string;
}

interface Props {
  data: unknown;
  isFallback: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted h-4', className)} />;
}

export function Step4Result({ data, isFallback }: Props) {
  if (data === null || data === undefined) {
    return (
      <div data-testid="step-result-step4" className="space-y-3 max-w-2xl">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  const d = data as Step4Data;
  const md = d.markdown ?? '';

  return (
    <div data-testid="step-result-step4" className="max-w-2xl">
      {isFallback && (
        <p className="mb-4 text-body-xs text-muted-foreground rounded border border-border px-3 py-1">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}
      <article className="prose prose-sm max-w-none text-on-surface prose-headings:text-on-surface prose-p:text-muted-foreground prose-strong:text-on-surface prose-li:text-muted-foreground prose-a:text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
      </article>
    </div>
  );
}
