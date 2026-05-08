import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Step3bData {
  coreIdentity?: string;
  thoughtSystem?: {
    coreBeliefs?: string[];
    uniqueViews?: string[];
    catchphrases?: string[];
  };
  contentPersona?: { contentPillars?: string[] };
  trustBuilding?: string;
  personaRoadmap?: { phase1?: string; phase2?: string; phase3?: string };
}

interface Props {
  data: unknown;
  isFallback: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted h-4', className)} />;
}

function StringList({ items, empty = '—' }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <p className="text-body-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-1">
      {items.map((s, i) => (
        <li key={i} className="text-body-sm text-muted-foreground flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          {s}
        </li>
      ))}
    </ul>
  );
}

export function Step3bResult({ data, isFallback }: Props) {
  if (data === null || data === undefined) {
    return (
      <div data-testid="step-result-step3b" className="space-y-4 max-w-2xl">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-20" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const d = data as Step3bData;
  const ts = d.thoughtSystem ?? {};
  const roadmap = d.personaRoadmap ?? {};

  return (
    <div data-testid="step-result-step3b" className="space-y-4 max-w-2xl">
      {isFallback && (
        <p className="text-body-xs text-muted-foreground rounded border border-border px-3 py-1">
          AI 返回了备用结果 · 内容仅供参考
        </p>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">核心身份</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            {d.coreIdentity ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">思维体系</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-body-xs font-medium text-on-surface mb-2">核心信念</p>
            <StringList items={ts.coreBeliefs ?? []} />
          </div>
          <div>
            <p className="text-body-xs font-medium text-on-surface mb-2">独特观点</p>
            <StringList items={ts.uniqueViews ?? []} />
          </div>
          <div>
            <p className="text-body-xs font-medium text-on-surface mb-2">口头禅</p>
            <StringList items={ts.catchphrases ?? []} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">内容人设 · 内容支柱</CardTitle>
        </CardHeader>
        <CardContent>
          <StringList items={d.contentPersona?.contentPillars ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">信任建立</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-muted-foreground leading-relaxed">
            {d.trustBuilding ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-body-lg">人设路线图</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(['phase1', 'phase2', 'phase3'] as const).map((p, i) => (
            <div key={p} className="flex gap-3">
              <span className="shrink-0 text-body-xs font-semibold text-primary">阶段{i + 1}</span>
              <p className="text-body-sm text-muted-foreground leading-relaxed">{roadmap[p] ?? '—'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
