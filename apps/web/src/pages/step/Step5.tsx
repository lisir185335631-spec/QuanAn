import { type FormEvent, useEffect, useRef, useState } from 'react';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { FileUpload } from '@/components/file-upload/FileUpload';
import { Step5TopicGrid } from '@/components/step5/Step5TopicGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { stepLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';
import {
  STEP5_BUTTON_GENERATE,
  STEP5_FILE_UPLOADS_2,
  STEP5_H1,
  STEP5_INPUTS_2,
  STEP5_LOADING_TEXT,
  STEP5_STEP_TAG,
  STEP5_SUBTITLE,
  type Step5Result,
  type Step5Topic,
} from '@/lib/constants/step5';

export interface Step5FormData {
  industry: string;
  product: string;
}

export type CategoryKey = 'traffic' | 'monetize' | 'persona' | 'cognition' | 'case';
export type StreamStatus = 'idle' | 'loading' | 'done' | 'error';

const ALL_CATEGORIES: CategoryKey[] = ['traffic', 'monetize', 'persona', 'cognition', 'case'];
const IDLE_STATUSES: Record<CategoryKey, StreamStatus> = {
  traffic: 'idle', monetize: 'idle', persona: 'idle', cognition: 'idle', case: 'idle',
};

const PLATFORMS: Step5Topic['platform'][] = ['抖音', '小红书', '视频号', '快手', 'B站'];
const DIFFICULTIES: Step5Topic['difficulty'][] = ['简单', '中等', '困难'];

function adaptTopicResult(
  raw: Record<string, unknown>,
  category: CategoryKey,
): Step5Topic[] {
  const rawTopics = (raw['topics'] ?? []) as Array<Record<string, unknown>>;
  return rawTopics.map((t, i) => ({
    id: `${category}_${i}`,
    category,
    title: String(t['title'] ?? ''),
    hook: String(t['hook'] ?? ''),
    structure: String(t['structure'] ?? ''),
    formula: String(t['formula'] ?? ''),
    platform: PLATFORMS[i % PLATFORMS.length]!,
    difficulty: DIFFICULTIES[i % DIFFICULTIES.length]!,
    potential_stars: (
      t['viralPotential'] === 'high' ? 4 :
      t['viralPotential'] === 'medium' ? 3 : 2
    ) as Step5Topic['potential_stars'],
  }));
}

export default function Step5() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving } = useStepData(accountId, 'step5');

  const [formData, setFormData] = useState<Step5FormData>({ industry: '', product: '' });
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('traffic');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [streamStatuses, setStreamStatuses] = useState<Record<CategoryKey, StreamStatus>>(IDLE_STATUSES);
  const [categoryResults, setCategoryResults] = useState<Partial<Record<CategoryKey, Step5Topic[]>>>({});

  const activeCategoryRef = useRef(activeCategory);
  activeCategoryRef.current = activeCategory;

  // Prefill from step1 + restore prior session LS data
  useEffect(() => {
    const step1 = readOtherStep<{ industry?: string }>(accountId, 'step1');
    if (step1?.industry) {
      setFormData((prev) => ({ ...prev, industry: prev.industry || step1.industry! }));
    }

    if (accountId === null) return;

    try {
      const raw = localStorage.getItem(stepLsKey(accountId, 'step5'));
      if (raw) {
        const parsed = JSON.parse(raw) as Step5FormData;
        setFormData((prev) => ({
          industry: prev.industry || parsed.industry || '',
          product: prev.product || parsed.product || '',
        }));
      }
    } catch { /* ignore */ }

    const loaded: Partial<Record<CategoryKey, Step5Topic[]>> = {};
    for (const cat of ALL_CATEGORIES) {
      try {
        const raw = localStorage.getItem(stepLsKey(accountId, `step5.${cat}`));
        if (raw) loaded[cat] = JSON.parse(raw) as Step5Topic[];
      } catch { /* ignore */ }
    }
    if (Object.keys(loaded).length > 0) {
      setCategoryResults(loaded);
      setHasSubmitted(true);
      const statuses = { ...IDLE_STATUSES };
      for (const cat of Object.keys(loaded) as CategoryKey[]) {
        statuses[cat] = 'done';
      }
      setStreamStatuses(statuses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Auto-advance to next idle category when current finishes streaming
  useEffect(() => {
    if (!hasSubmitted) return;
    if (streamStatuses[activeCategory] !== 'done') return;
    const nextIdle = ALL_CATEGORIES.find(
      (cat) => streamStatuses[cat] === 'idle' && categoryResults[cat] === undefined,
    );
    if (nextIdle) {
      setActiveCategory(nextIdle);
    }
  }, [streamStatuses, activeCategory, hasSubmitted, categoryResults]);

  // Single SSE subscription — re-subscribes when activeCategory changes
  trpc.stepData.saveStream.useSubscription(
    { stepKey: 'step5', category: activeCategory, inputs: formData as unknown as Record<string, unknown> },
    {
      enabled: hasSubmitted && streamStatuses[activeCategory] === 'idle',
      onData(data) {
        const cat = activeCategoryRef.current;
        if (data.type === 'started') {
          setStreamStatuses((prev) => ({ ...prev, [cat]: 'loading' }));
        } else if (data.type === 'done') {
          const result = data.result as Record<string, unknown>;
          const topics = adaptTopicResult(result, cat);
          setCategoryResults((prev) => ({ ...prev, [cat]: topics }));
          setStreamStatuses((prev) => ({ ...prev, [cat]: 'done' }));
          if (accountId !== null) {
            localStorage.setItem(stepLsKey(accountId, `step5.${cat}`), JSON.stringify(topics));
          }
        } else if (data.type === 'error') {
          setStreamStatuses((prev) => ({ ...prev, [cat]: 'error' }));
        }
      },
      onError() {
        const cat = activeCategoryRef.current;
        setStreamStatuses((prev) => ({ ...prev, [cat]: 'error' }));
      },
    },
  );

  function setField(field: keyof Step5FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleCategoryChange(newCat: CategoryKey) {
    if (newCat === activeCategory) return;
    if (streamStatuses[activeCategory] === 'loading') {
      setStreamStatuses((prev) => ({ ...prev, [activeCategory]: 'idle' }));
    }
    setActiveCategory(newCat);
  }

  const isFormValid = formData.industry.trim() !== '' && formData.product.trim() !== '';
  const generateDisabled = !isFormValid || isSaving;
  const hasAnyResult = Object.values(categoryResults).some(Boolean);
  const isAnyLoading = Object.values(streamStatuses).some((s) => s === 'loading');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;
    setCategoryResults({});
    setStreamStatuses(IDLE_STATUSES);
    setActiveCategory('traffic');
    setHasSubmitted(true);
    save(formData as unknown as Record<string, unknown>);
    document.getElementById('step5-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  const mergedTopics = ALL_CATEGORIES.flatMap((cat) => categoryResults[cat] ?? []);
  const fullResult: Step5Result | null = hasAnyResult
    ? { topics: mergedTopics, generated_at: new Date().toISOString() }
    : null;

  return (
    <main className="flex-1 container py-8">
      {/* AC-1 字面锁: STEP 05 · 爆款选题库 */}
      <FadeInWrapper delay={0} from="up">
        <div>
          <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
            {STEP5_STEP_TAG}
          </p>
          {/* AC-11: H1 */}
          <h1 className="text-h1 font-display text-on-surface mb-2">{STEP5_H1}</h1>
          <p className="text-body-md text-muted-foreground mb-8">{STEP5_SUBTITLE}</p>
        </div>
      </FadeInWrapper>

      <FadeInWrapper delay={0.05} from="up">
      <form
        onSubmit={(e) => { void handleSubmit(e); }}
        className="glass-card rounded-xl p-6 space-y-6 max-w-2xl"
      >
        {/* AC-2: 2 inputs — 行业领域 + 产品/服务 */}
        {STEP5_INPUTS_2.map((input) => (
          <div key={input.id}>
            <label className="block text-body-sm font-label text-on-surface mb-2">
              {input.label}
              {input.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <Input
              required={input.required}
              value={formData[input.id as keyof Step5FormData]}
              onChange={(e) => setField(input.id as keyof Step5FormData, e.target.value)}
              placeholder={input.placeholder}
              data-testid={`step5-input-${input.id}`}
            />
          </div>
        ))}

        {/* AC-2 + AC-4: 2 image FileUploads — 产品图 + 案例图 */}
        {STEP5_FILE_UPLOADS_2.map((upload) => (
          <FileUpload
            key={upload.id}
            label={upload.label}
            multiple
            accept="image/*"
            onChange={() => { /* file bytes not sent in this phase */ }}
          />
        ))}

        {/* AC-2 CTA: 生成爆款选题库 */}
        <Button
          type="submit"
          disabled={generateDisabled}
          className="w-full bg-gradient-to-r from-primary to-primary/80"
          data-testid="step5-cta"
        >
          {STEP5_BUTTON_GENERATE}
        </Button>
      </form>
      </FadeInWrapper>

      {/* Output: AC-11 = 1 H1 + 5 H3 = 6 total when submitted */}
      {hasSubmitted && (
        <FadeInWrapper delay={0.1} from="up">
          <section id="step5-output" className="mt-10 max-w-5xl">
            {isAnyLoading && (
              <p className="text-body-sm text-muted-foreground mb-6 animate-pulse">
                {STEP5_LOADING_TEXT}
              </p>
            )}
            <Step5TopicGrid
              result={fullResult}
              accountId={accountId}
              streamStatuses={streamStatuses}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </section>
        </FadeInWrapper>
      )}
    </main>
  );
}
