import { useState } from 'react';

import { Step4bInputSchema } from '@quanqn/schemas/specialist-io';

import { StepResult } from '@/components/StepResult/StepResult';
import { StepForm } from '@/components/StepForm/StepForm';

export default function Step4b() {
  const [result, setResult] = useState<{ result: unknown; isFallback: boolean } | null>(null);

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-2">变现规划</h1>
      <p className="text-body-md text-muted-foreground mb-8">制定你的 IP 变现路径和商业模式</p>
      {result ? (
        <StepResult stepKey="step4b" data={result.result} isFallback={result.isFallback} />
      ) : (
        <StepForm stepKey="step4b" schema={Step4bInputSchema} onSuccess={setResult} />
      )}
    </main>
  );
}
