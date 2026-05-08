import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function Knowledge() {
  const { data, isLoading } = trpc.knowledge.getRecommendations.useQuery({});

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">方法论知识库</h1>
      {isLoading ? (
        <p className="text-body-md text-muted-foreground">加载中…</p>
      ) : data && data.length > 0 ? (
        <div className="space-y-4 max-w-2xl">
          {data.map((item) => (
            <Card key={item.itemKey}>
              <CardHeader>
                <span className="text-label-sm font-label text-primary uppercase tracking-wide">
                  {item.itemType}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-body-md text-on-surface">{item.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <span className="text-label-sm font-label text-primary uppercase tracking-wide">智能工具</span>
          </CardHeader>
          <CardContent>
            <p className="text-body-md text-muted-foreground">沉淀 IP 起号方法论，构建可复用的知识体系</p>
            <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
