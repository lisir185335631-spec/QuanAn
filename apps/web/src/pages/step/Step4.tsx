import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { stepConfig } from '@/lib/stepConfig';

const data = stepConfig.get('step4')!;

export default function Step4() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-6">{data.title}</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">{data.phase}</span>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-muted-foreground">{data.description}</p>
          <p className="mt-4 text-body-sm text-on-surface-variant">PRD-3 占位 · 实施 PRD-4</p>
        </CardContent>
      </Card>
    </main>
  );
}
