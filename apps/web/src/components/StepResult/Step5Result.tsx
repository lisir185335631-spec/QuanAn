import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TopicItem {
  title?: string;
  hook?: string;
  structure?: string;
  formula?: string;
  viralPotential?: 'low' | 'medium' | 'high';
}
interface Step5Data {
  category?: string;
  topics?: TopicItem[];
}

interface Props {
  data: unknown;
  isFallback: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted h-4', className)} />;
}

const VIRAL_LABELS = { low: '低', medium: '中', high: '高' } as const;
const VIRAL_COLORS = {
  low: 'text-muted-foreground',
  medium: 'text-warning',
  high: 'text-success',
} as const;

export function Step5Result({ data, isFallback }: Props) {
  if (data === null || data === undefined) {
    return (
      <div data-testid="step-result-step5" className="space-y-3 max-w-2xl">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const d = data as Step5Data;
  const topics = d.topics ?? [];

  return (
    <div data-testid="step-result-step5" className="max-w-2xl space-y-4">
      {isFallback && (
        <p className="text-body-xs text-muted-foreground rounded border border-border px-3 py-1">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">
            选题策略 {d.category ? `· ${d.category}` : ''}
            <span className="ml-2 text-body-xs font-normal text-muted-foreground">
              {topics.length} 个选题
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* AC-11 ScrollArea h-96 防 viewport overflow */}
          <ScrollArea className="h-96 px-6 pb-6">
            <div className="space-y-3 pt-0">
              {topics.length > 0 ? topics.map((t, i) => {
                const vp = t.viralPotential ?? 'medium';
                return (
                  <div key={i} className="rounded border border-border p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-body-sm font-medium text-on-surface leading-snug">
                        {String(i + 1).padStart(2, '0')}. {t.title ?? '—'}
                      </p>
                      <span className={cn('text-body-xs shrink-0 font-medium', VIRAL_COLORS[vp])}>
                        爆款潜力 {VIRAL_LABELS[vp]}
                      </span>
                    </div>
                    {t.hook && (
                      <p className="text-body-xs text-muted-foreground">
                        <span className="font-medium text-on-surface">钩子：</span>{t.hook}
                      </p>
                    )}
                    {t.structure && (
                      <p className="text-body-xs text-muted-foreground">
                        <span className="font-medium text-on-surface">结构：</span>{t.structure}
                      </p>
                    )}
                    {t.formula && (
                      <p className="text-body-xs text-muted-foreground">
                        <span className="font-medium text-on-surface">公式：</span>{t.formula}
                      </p>
                    )}
                  </div>
                );
              }) : (
                <p className="text-body-sm text-muted-foreground py-4 text-center">暂无选题</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
