import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function BoomGenerate() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">爆款元素生成</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">变现设计</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">自动提取并生成爆款内容的核心元素组合</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
