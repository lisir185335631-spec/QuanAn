import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Step8Data {
  lastResult?: string;
  lastOptimizedResult?: string;
}

interface Props {
  data: unknown;
  isFallback: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted h-4', className)} />;
}

export function Step8Result({ data, isFallback }: Props) {
  if (data === null || data === undefined) {
    return (
      <div data-testid="step-result-step8" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-48" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const d = data as Step8Data;

  return (
    <div data-testid="step-result-step8" className="space-y-4">
      {isFallback && (
        <p className="text-body-xs text-muted-foreground rounded border border-border px-3 py-1">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-lg">初版话术</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {d.lastResult ?? '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-body-lg">
              优化版话术
              <span className="ml-2 text-body-xs font-normal text-primary">推荐</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {d.lastOptimizedResult ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
