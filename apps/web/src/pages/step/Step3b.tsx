import { Step3bInputSchema } from '@quanqn/schemas/specialist-io';
import { useState } from 'react';


import { StepForm } from '@/components/StepForm/StepForm';
import { StepResult } from '@/components/StepResult/StepResult';

export default function Step3b() {
  const [result, setResult] = useState<{ result: unknown; isFallback: boolean } | null>(null);

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-2">人设深化</h1>
      <p className="text-body-md text-muted-foreground mb-8">深化你的 IP 人设，打造独特的品牌个性</p>
      {result ? (
        <StepResult stepKey="step3b" data={result.result} isFallback={result.isFallback} onRetry={() => setResult(null)} />
      ) : (
        <StepForm stepKey="step3b" schema={Step3bInputSchema} onSuccess={setResult} />
      )}
    </main>
  );
}
