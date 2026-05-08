import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BioItem {
  platform?: string;
  text?: string;
}
interface Step3Data {
  nickname?: string[];
  avatar?: { prompt?: string; style?: string };
  background?: { prompt?: string; platformVersions?: string[] };
  bio?: BioItem[];
  overallStrategy?: string;
}

interface Props {
  data: unknown;
  isFallback: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted h-4', className)} />;
}

export function Step3Result({ data, isFallback }: Props) {
  if (data === null || data === undefined) {
    return (
      <div data-testid="step-result-step3" className="space-y-4 max-w-2xl">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-20" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const d = data as Step3Data;
  const nicknames = d.nickname ?? [];
  const bio = d.bio ?? [];

  return (
    <div data-testid="step-result-step3" className="space-y-4 max-w-2xl">
      {isFallback && (
        <p className="text-body-xs text-muted-foreground rounded border border-border px-3 py-1">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">推荐昵称</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {nicknames.length > 0 ? nicknames.map((n, i) => (
              <span key={i} className="rounded-full border border-border px-3 py-1 text-body-sm text-on-surface">
                {n}
              </span>
            )) : <span className="text-body-sm text-muted-foreground">—</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">头像建议</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-body-sm text-muted-foreground">
            <span className="font-medium text-on-surface">风格：</span>{d.avatar?.style ?? '—'}
          </p>
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-on-surface">描述：</span>{d.avatar?.prompt ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">背景图</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            {d.background?.prompt ?? '—'}
          </p>
          {(d.background?.platformVersions ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(d.background?.platformVersions ?? []).map((v, i) => (
                <span key={i} className="text-body-xs rounded border border-border px-2 py-0.5 text-muted-foreground">{v}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">简介文案</CardTitle>
        </CardHeader>
        <CardContent>
          {bio.length > 0 ? (
            <div className="space-y-3">
              {bio.map((b, i) => (
                <div key={i} className="rounded border border-border p-3">
                  <p className="text-body-xs font-medium text-muted-foreground mb-1">{b.platform ?? ''}</p>
                  <p className="text-body-sm text-on-surface leading-relaxed">{b.text ?? '—'}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-body-sm text-muted-foreground">—</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">整体策略</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            {d.overallStrategy ?? '—'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
