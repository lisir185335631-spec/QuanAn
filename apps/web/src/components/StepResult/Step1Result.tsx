import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Step1Data {
  industry?: string;
  marketAnalysis?: string;
  competitionLevel?: 'low' | 'medium' | 'high';
  recommendation?: string;
}

interface Props {
  data: unknown;
  isFallback: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted h-4', className)} />;
}

const COMPETITION_LABELS = { low: '低竞争', medium: '中等竞争', high: '高竞争' } as const;
const COMPETITION_COLORS = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-error',
} as const;

export function Step1Result({ data, isFallback }: Props) {
  if (data === null || data === undefined) {
    return (
      <div data-testid="step-result-step1" className="space-y-4 max-w-2xl">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const d = data as Step1Data;
  const level = d.competitionLevel ?? 'medium';

  return (
    <div data-testid="step-result-step1" className="space-y-4 max-w-2xl">
      {isFallback && (
        <p className="text-body-xs text-muted-foreground rounded border border-border px-3 py-1">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">行业定位</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-md font-medium text-on-surface">{d.industry ?? '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">市场分析</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            {d.marketAnalysis ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">竞争程度</CardTitle>
        </CardHeader>
        <CardContent>
          <span className={cn('text-body-md font-semibold', COMPETITION_COLORS[level])}>
            {COMPETITION_LABELS[level]}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">定位建议</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            {d.recommendation ?? '—'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
