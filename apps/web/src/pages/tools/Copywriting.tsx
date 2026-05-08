import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Copywriting() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">爆款文案创作</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">AI 辅助爆款文案创作，覆盖标题、正文、结尾钩子全链路</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
