import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Trending() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">全网爆款库</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">市场洞察</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">实时追踪全平台爆款内容，洞察流行趋势</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
