import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function Evolution() {
  const { data, isLoading } = trpc.evolution.history.useQuery({});

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">进化中心</h1>
      {isLoading ? (
        <p className="text-body-md text-muted-foreground">加载中…</p>
      ) : data && data.length > 0 ? (
        <div className="space-y-4 max-w-2xl">
          {data.map((insight) => (
            <Card key={insight.id}>
              <CardHeader>
                <span className="text-label-sm font-label text-primary uppercase tracking-wide">
                  {insight.triggerType}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-body-md text-on-surface">{insight.content}</p>
                <p className="text-body-sm text-muted-foreground mt-2">
                  {insight.levelBefore} → {insight.levelAfter}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-body-md text-muted-foreground">暂无进化记录</p>
            <p className="mt-4 text-body-sm text-on-surface-variant">实施 PRD-8</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
