import { useState } from 'react';

import { Step4InputSchema } from '@quanqn/schemas/specialist-io';

import { StepResult } from '@/components/StepResult/StepResult';
import { StepForm } from '@/components/StepForm/StepForm';
import { stepConfig } from '@/lib/stepConfig';

const data = stepConfig.get('step4')!;

export default function Step4() {
  const [result, setResult] = useState<{ result: unknown; isFallback: boolean } | null>(null);

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-2">{data.title}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{data.description}</p>
      {result ? (
        <StepResult stepKey="step4" data={result.result} isFallback={result.isFallback} />
      ) : (
        <StepForm stepKey="step4" schema={Step4InputSchema} onSuccess={setResult} />
      )}
    </main>
  );
}
