import { Step3InputSchema } from '@quanqn/schemas/specialist-io';

import { StepForm } from '@/components/StepForm/StepForm';
import { stepConfig } from '@/lib/stepConfig';

const data = stepConfig.get('step3')!;

export default function Step3() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-2">{data.title}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{data.description}</p>
      <StepForm stepKey="step3" schema={Step3InputSchema} />
    </main>
  );
}
