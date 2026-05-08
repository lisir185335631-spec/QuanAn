import { useState } from 'react';

import { Step1InputSchema } from '@quanqn/schemas/specialist-io';

import { StepResult } from '@/components/StepResult/StepResult';
import { StepForm } from '@/components/StepForm/StepForm';
import { stepConfig } from '@/lib/stepConfig';

const data = stepConfig.get('step1')!;

export default function Step1() {
  const [result, setResult] = useState<{ result: unknown; isFallback: boolean } | null>(null);

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-2">{data.title}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{data.description}</p>
      {result ? (
        <StepResult stepKey="step1" data={result.result} isFallback={result.isFallback} />
      ) : (
        <StepForm stepKey="step1" schema={Step1InputSchema} onSuccess={setResult} />
      )}
    </main>
  );
}
