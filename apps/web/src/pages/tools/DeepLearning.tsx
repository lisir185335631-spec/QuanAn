import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DeepLearning() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">深度学习</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">智能工具</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">持续学习 IP 策略与行业动态，构建个人知识体系</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
