import { useEffect, useState } from 'react';

import { Step8GeneratePlan } from '@/components/step8/Step8GeneratePlan';
import { Step8OptimizeScript } from '@/components/step8/Step8OptimizeScript';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep } from '@/hooks/useStepData';
import {
  STEP8_H1,
  STEP8_STEP_TAG,
  STEP8_SUBTITLE_TEMPLATE,
} from '@/lib/constants/step8';

export default function Step8() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const [industry, setIndustry] = useState('你的行业');

  useEffect(() => {
    if (accountId === null) return;
    const step1Data = readOtherStep<{ industry?: string }>(accountId, 'step1');
    if (step1Data?.industry) {
      setIndustry(step1Data.industry);
    }
  }, [accountId]);

  const subtitle = STEP8_SUBTITLE_TEMPLATE.replace('{industry}', industry);

  return (
    <main className="flex-1 container py-8">
      {/* Header */}
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP8_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP8_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>

      {/* AC-2 · shadcn Tabs · 2 TabsTrigger · tab 1 default active */}
      <Tabs defaultValue="generate">
        <TabsList className="mb-8">
          <TabsTrigger value="generate">生成直播方案</TabsTrigger>
          <TabsTrigger value="optimize">AI 优化话术</TabsTrigger>
        </TabsList>

        {/* forceMount keeps both tabs mounted — state persists on tab switch (anti-pattern避免) */}
        <TabsContent value="generate" forceMount>
          <Step8GeneratePlan accountId={accountId} />
        </TabsContent>
        <TabsContent value="optimize" forceMount>
          <Step8OptimizeScript accountId={accountId} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
