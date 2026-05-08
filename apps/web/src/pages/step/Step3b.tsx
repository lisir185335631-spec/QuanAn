import { Step3bInputSchema } from '@quanqn/schemas/specialist-io';

import { StepForm } from '@/components/StepForm/StepForm';

export default function Step3b() {
  return (
    <main className="flex-1 container py-8">
      <h1 className="text-h1 font-display text-on-surface mb-2">人设深化</h1>
      <p className="text-body-md text-muted-foreground mb-8">深化你的 IP 人设，打造独特的品牌个性</p>
      <StepForm stepKey="step3b" schema={Step3bInputSchema} />
    </main>
  );
}
