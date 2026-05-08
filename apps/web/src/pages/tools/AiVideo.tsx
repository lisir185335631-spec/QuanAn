import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AiVideo() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">一键生成视频</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">智能工具</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">AI 自动生成短视频，降低内容生产门槛</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
