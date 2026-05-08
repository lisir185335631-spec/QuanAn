import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LadderItem {
  stage?: string;
  revenue?: string;
  action?: string;
}
interface CaseItem {
  title?: string;
  summary?: string;
}
interface Step4bData {
  currentAnalysis?: string;
  ladder?: LadderItem[];
  revenueStructure?: { primary?: string; secondary?: string[] };
  successCases?: CaseItem[];
}

interface Props {
  data: unknown;
  isFallback: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted h-4', className)} />;
}

export function Step4bResult({ data, isFallback }: Props) {
  if (data === null || data === undefined) {
    return (
      <div data-testid="step-result-step4b" className="space-y-4 max-w-2xl">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const d = data as Step4bData;
  const ladder = d.ladder ?? [];
  const cases = d.successCases ?? [];
  const rs = d.revenueStructure ?? {};

  return (
    <div data-testid="step-result-step4b" className="space-y-4 max-w-2xl">
      {isFallback && (
        <p className="text-body-xs text-muted-foreground rounded border border-border px-3 py-1">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">现状分析</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            {d.currentAnalysis ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">变现阶梯</CardTitle>
        </CardHeader>
        <CardContent>
          {ladder.length > 0 ? (
            <div className="space-y-3">
              {ladder.map((item, i) => (
                <div key={i} className="rounded border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-body-sm font-medium text-on-surface">{item.stage ?? `阶段 ${i + 1}`}</span>
                    <span className="text-body-xs text-primary font-semibold">{item.revenue ?? ''}</span>
                  </div>
                  <p className="text-body-sm text-muted-foreground">{item.action ?? '—'}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-body-sm text-muted-foreground">—</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">营收结构</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-body-sm text-on-surface">
            <span className="font-medium">主营：</span>
            <span className="text-muted-foreground">{rs.primary ?? '—'}</span>
          </p>
          {(rs.secondary ?? []).length > 0 && (
            <div>
              <p className="text-body-sm font-medium text-on-surface mb-1">辅助：</p>
              <ul className="space-y-1">
                {(rs.secondary ?? []).map((s, i) => (
                  <li key={i} className="text-body-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {cases.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-lg">成功案例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cases.map((c, i) => (
                <div key={i} className="rounded border border-border p-3">
                  <p className="text-body-sm font-medium text-on-surface mb-1">{c.title ?? `案例 ${i + 1}`}</p>
                  <p className="text-body-sm text-muted-foreground">{c.summary ?? '—'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
