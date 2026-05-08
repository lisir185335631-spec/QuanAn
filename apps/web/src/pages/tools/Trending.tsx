import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function Trending() {
  const { data, isLoading } = trpc.trending.fetch.useQuery({});

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">全网爆款库</h1>
      {isLoading ? (
        <p className="text-body-md text-muted-foreground">加载中…</p>
      ) : data && data.length > 0 ? (
        <div className="space-y-4 max-w-2xl">
          {data.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <span className="text-label-sm font-label text-primary uppercase tracking-wide">
                  {item.platform}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-body-md text-on-surface">{item.title}</p>
                <p className="text-body-sm text-muted-foreground mt-1">
                  {item.likeCount} 赞 · {item.shareCount} 转发
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <span className="text-label-sm font-label text-primary uppercase tracking-wide">市场洞察</span>
          </CardHeader>
          <CardContent>
            <p className="text-body-md text-muted-foreground">实时追踪全平台爆款内容，洞察流行趋势</p>
            <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
