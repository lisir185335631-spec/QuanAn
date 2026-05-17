import { Step3InputSchema } from '@quanqn/schemas/specialist-io';
import { useState } from 'react';

import { LoadingState } from '@/components/states';
import { StepForm } from '@/components/StepForm/StepForm';
import { StepResult } from '@/components/StepResult/StepResult';
import { STEP3_LOADING_TEXT } from '@/lib/constants/step3';
import { stepConfig } from '@/lib/stepConfig';

const data = stepConfig.get('step3')!;

export default function Step3() {
  const [result, setResult] = useState<{ result: unknown; isFallback: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-2">{data.title}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{data.description}</p>
      {result ? (
        <StepResult stepKey="step3" data={result.result} isFallback={result.isFallback} onRetry={() => setResult(null)} />
      ) : isSubmitting ? (
        <LoadingState text={STEP3_LOADING_TEXT} size="lg" />
      ) : (
        <StepForm
          stepKey="step3"
          schema={Step3InputSchema}
          onSuccess={setResult}
          onLoadingChange={setIsSubmitting}
        />
      )}
    </main>
  );
}
