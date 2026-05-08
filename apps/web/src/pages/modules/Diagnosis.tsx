import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function Diagnosis() {
  const { data, isLoading } = trpc.diagnosis.latest.useQuery();

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">IP 诊断</h1>
      {isLoading ? (
        <p className="text-body-md text-muted-foreground">加载中…</p>
      ) : data ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <span className="text-label-sm font-label text-primary uppercase tracking-wide">最新诊断报告</span>
          </CardHeader>
          <CardContent>
            <p className="text-body-md text-on-surface">总分：{data.overallScore}</p>
            <p className="text-body-sm text-muted-foreground mt-2">阶段：{data.inferredStage}</p>
            <p className="mt-4 text-body-sm text-on-surface-variant">实施 PRD-5</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-body-md text-muted-foreground">暂无诊断记录 · 请先完成 IP 诊断问卷</p>
            <p className="mt-4 text-body-sm text-on-surface-variant">实施 PRD-5</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
