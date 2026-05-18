import { useEffect, useState } from 'react';

import { Step8GeneratePlan } from '@/components/step8/Step8GeneratePlan';
import { Step8OptimizeScript } from '@/components/step8/Step8OptimizeScript';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep } from '@/hooks/useStepData';
import {
  STEP8_H1,
  STEP8_STEP_TAG,
  STEP8_SUBFUNCTIONS_2,
  STEP8_SUBTITLE_TEMPLATE,
} from '@/lib/constants/step8';
import { cn } from '@/lib/utils';

export default function Step8() {
  const [activeIdx, setActiveIdx] = useState(0);
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
  const activeSubfunction = STEP8_SUBFUNCTIONS_2[activeIdx]!;

  return (
    <main className="flex-1 container py-8">
      {/* Header */}
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP8_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP8_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>

      {/* Subfunction H3 switcher */}
      <div className="flex gap-4 mb-8 border-b border-border">
        {STEP8_SUBFUNCTIONS_2.map((sf, idx) => (
          <button
            key={sf.key}
            type="button"
            onClick={() => setActiveIdx(idx)}
            className={cn(
              'pb-3 text-h3 font-display transition-colors border-b-2 -mb-px',
              activeIdx === idx
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-on-surface',
            )}
          >
            {sf.h3Label}
          </button>
        ))}
      </div>

      {/* Active subfunction — sub_function discriminator 严守(PRD-18 §11.11.4) */}
      {activeSubfunction.key === 'generate_plan' && (
        <Step8GeneratePlan subfunctionKey={activeSubfunction.key} accountId={accountId} />
      )}
      {activeSubfunction.key === 'optimize_script' && (
        <Step8OptimizeScript subfunctionKey={activeSubfunction.key} accountId={accountId} />
      )}
    </main>
  );
}
