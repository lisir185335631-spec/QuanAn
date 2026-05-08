import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function PresentStyles() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">14 呈现形式</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">市场洞察</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">14 种内容呈现形式，找到最适合你 IP 的表达方式</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
