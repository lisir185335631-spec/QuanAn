import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Generate() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">AI 智能生成</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">智能生成符合 IP 定位的高质量内容脚本</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
