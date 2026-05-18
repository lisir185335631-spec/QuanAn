import { type FormEvent, useEffect, useRef, useState } from 'react';

import { EmptyState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStepData } from '@/hooks/useStepData';
import {
  STEP8_BUTTON_GENERATE_PLAN,
  STEP8_EXPERIENCE_3,
  STEP8_EXPERIENCE_RADIO_LABEL,
  STEP8_GENERATE_LOADING_TEXT,
  STEP8_GENERATE_PLAN_INPUT,
  STEP8_GENERATE_PLAN_TEXTAREA,
  STEP8_H1,
  STEP8_OUTPUT_MODULES_6,
  STEP8_PLATFORM_RADIO_LABEL,
  STEP8_PLATFORMS_5,
  type Step8GeneratePlanResult,
} from '@/lib/constants/step8';
import { cn } from '@/lib/utils';

// experience key → Chinese value sent to LivestreamAgent (AC-2 · 新手|有经验|资深)
const EXPERIENCE_VALUE_MAP: Record<string, string> = {
  novice: '新手',
  experienced: '有经验',
  expert: '资深',
};

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-container p-4">
      <p className="text-body-xs font-label text-primary uppercase tracking-wide mb-2">{label}</p>
      <p className="text-body-sm text-on-surface whitespace-pre-wrap">{value}</p>
    </div>
  );
}

interface Props {
  subfunctionKey: string;
  accountId: number | null;
}

export function Step8GeneratePlan({ subfunctionKey, accountId }: Props) {
  const [productInfo, setProductInfo] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState<string>(STEP8_PLATFORMS_5[0]!.id);
  const [experience, setExperience] = useState<string>(STEP8_EXPERIENCE_3[0]!.key);
  const [result, setResult] = useState<Step8GeneratePlanResult | null>(null);

  const { save, load, isSaving, dbQuery } = useStepData(accountId, 'step8');
  const prevIsSavingRef = useRef(false);

  // Restore form data from LS on mount (sub_function discriminator: prevents cross-contamination)
  useEffect(() => {
    if (accountId === null) return;
    const raw = load();
    if (!raw) return;
    if (raw['sub_function'] !== subfunctionKey) return;
    if (typeof raw['productInfo'] === 'string') setProductInfo(raw['productInfo']);
    if (typeof raw['targetAudience'] === 'string') setTargetAudience(raw['targetAudience']);
    if (typeof raw['platform'] === 'string') setPlatform(raw['platform']);
    if (typeof raw['experience'] === 'string') {
      // Stored as Chinese value ('有经验') — find matching key for radio state
      const expEntry = STEP8_EXPERIENCE_3.find(
        (e) => EXPERIENCE_VALUE_MAP[e.key] === raw['experience'],
      );
      if (expEntry) setExperience(expEntry.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, subfunctionKey]);

  // Refetch after save completes (isSaving: true → false)
  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  // Sync result from DB — check sub_function discriminator to prevent cross-contamination
  useEffect(() => {
    if (!dbQuery.data?.result) return;
    const inputs = dbQuery.data.inputs as Record<string, unknown>;
    if (inputs?.['sub_function'] !== 'generate_plan') return;
    const raw = dbQuery.data.result as Record<string, unknown>;
    if (
      typeof raw['opening'] === 'string' &&
      typeof raw['interaction'] === 'string' &&
      typeof raw['deal'] === 'string' &&
      typeof raw['closing'] === 'string' &&
      typeof raw['traffic'] === 'string' &&
      typeof raw['engagement'] === 'string'
    ) {
      setResult({
        opening: raw['opening'],
        interaction: raw['interaction'],
        deal: raw['deal'],
        closing: raw['closing'],
        traffic: raw['traffic'],
        engagement: raw['engagement'],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save({
      sub_function: 'generate_plan',
      productInfo,
      targetAudience,
      platform,
      experience: EXPERIENCE_VALUE_MAP[experience] ?? '有经验',
    });
    document.getElementById('step8-generate-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={(e) => { handleSubmit(e); }}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        {/* Product textarea */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_GENERATE_PLAN_TEXTAREA.label}
          </label>
          <textarea
            value={productInfo}
            onChange={(e) => setProductInfo(e.target.value)}
            placeholder={STEP8_GENERATE_PLAN_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] font-cn resize-y"
          />
        </div>

        {/* Audience input */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_GENERATE_PLAN_INPUT.label}
          </label>
          <Input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder={STEP8_GENERATE_PLAN_INPUT.placeholder}
          />
        </div>

        {/* Platform radio */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_PLATFORM_RADIO_LABEL}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {STEP8_PLATFORMS_5.map((p) => (
              <label
                key={p.id}
                htmlFor={`step8-platform-${p.id}`}
                className={cn(
                  'glass-card rounded-lg p-3 flex flex-col items-center text-center cursor-pointer transition-colors',
                  platform === p.id
                    ? 'border-primary/60 bg-primary/10'
                    : 'hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  id={`step8-platform-${p.id}`}
                  name="step8-platform"
                  value={p.id}
                  checked={platform === p.id}
                  onChange={() => setPlatform(p.id)}
                  className="sr-only"
                />
                <span className="text-body-sm font-cn text-on-surface">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Experience radio */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_EXPERIENCE_RADIO_LABEL}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STEP8_EXPERIENCE_3.map((exp) => (
              <label
                key={exp.key}
                htmlFor={`step8-experience-${exp.key}`}
                className={cn(
                  'glass-card rounded-lg p-3 flex items-center cursor-pointer transition-colors',
                  experience === exp.key
                    ? 'border-primary/60 bg-primary/10'
                    : 'hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  id={`step8-experience-${exp.key}`}
                  name="step8-experience"
                  value={exp.key}
                  checked={experience === exp.key}
                  onChange={() => setExperience(exp.key)}
                  className="sr-only"
                />
                <span className="text-body-sm font-cn text-on-surface">{exp.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
          {STEP8_BUTTON_GENERATE_PLAN}
        </Button>
      </form>

      {/* Three-state feedback */}
      <div className="max-w-2xl">
        {isSaving && <LoadingState text={STEP8_GENERATE_LOADING_TEXT} size="lg" />}
        {!isSaving && !result && (
          <EmptyState title={`提交表单后查看${STEP8_H1}`} />
        )}
      </div>

      {/* Output: 6 modules */}
      {result && !isSaving && (
        <div id="step8-generate-output" className="space-y-6">
          {STEP8_OUTPUT_MODULES_6.map((module) => (
            <div key={module.id}>
              <h3 className="text-h3 font-display text-on-surface mb-3">{module.h3Label}</h3>
              <InfoCard label={module.h3Label} value={result[module.id]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
