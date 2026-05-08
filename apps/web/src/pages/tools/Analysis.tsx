import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Analysis() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">文案结构分析</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">拆解爆款文案结构，提炼可复用写作框架</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
