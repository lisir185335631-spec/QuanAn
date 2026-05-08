import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function VideoProduction() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">短视频制作</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">全流程短视频制作指导，从策划到剪辑发布</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
