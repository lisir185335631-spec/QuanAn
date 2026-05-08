import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Step7Data {
  markdown?: string;
  structure?: string;
  hooks?: string[];
  cta?: string;
}

interface Props {
  data: unknown;
  isFallback: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted h-4', className)} />;
}

export function Step7Result({ data, isFallback }: Props) {
  if (data === null || data === undefined) {
    return (
      <div data-testid="step-result-step7" className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  const d = data as Step7Data;
  const md = d.markdown ?? '';
  const hooks = d.hooks ?? [];

  return (
    <div data-testid="step-result-step7">
      {isFallback && (
        <p className="mb-4 text-body-xs text-muted-foreground rounded border border-border px-3 py-1">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main markdown content */}
        <div className="lg:col-span-2">
          <article className="prose prose-sm max-w-none text-on-surface prose-headings:text-on-surface prose-p:text-muted-foreground prose-strong:text-on-surface prose-li:text-muted-foreground prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          </article>
        </div>

        {/* Sidebar: structure + hooks + cta */}
        <div className="space-y-4">
          {d.structure && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-body-sm">内容结构</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-xs text-muted-foreground leading-relaxed">{d.structure}</p>
              </CardContent>
            </Card>
          )}

          {hooks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-body-sm">爆款钩子</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {hooks.map((h, i) => (
                    <li key={i} className="text-body-xs text-muted-foreground flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {h}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {d.cta && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-body-sm">行动号召</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-xs text-muted-foreground leading-relaxed">{d.cta}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
