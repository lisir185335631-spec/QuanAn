import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import {
  STEP4_BUTTON_COPY,
  STEP4_BUTTON_GENERATE,
  STEP4_H1,
  STEP4_INPUTS_3,
  STEP4_PLATFORMS_5,
  STEP4_RADIO_LABEL,
  STEP4_STEP_TAG,
  STEP4_SUBTITLE_TEMPLATE,
} from '@/lib/constants/step4';
import { cn } from '@/lib/utils';

interface Step4FormData {
  platform: string;
  follower_count: string;
  goal: string;
  personal_info: string;
}

export default function Step4() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step4');

  const [platform, setPlatform] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    follower_count: '',
    goal: '',
    personal_info: '',
  });
  const [result, setResult] = useState<{ markdown: string } | null>(null);

  const prevIsSavingRef = useRef(false);

  // Cross-step prefill: industry from step1 for subtitle
  const step1Data = readOtherStep<{ industryLabel?: string }>(accountId, 'step1');
  const industryLabel = step1Data?.industryLabel ?? '(未选择)';
  const subtitle = STEP4_SUBTITLE_TEMPLATE.replace('{industry}', industryLabel);
  const isCtaDisabled = !platform || isSaving;

  // Prefill form from namespaced LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step4FormData>(accountId, 'step4');
    if (saved) {
      if (saved.platform) setPlatform(saved.platform);
      setFieldValues({
        follower_count: saved.follower_count ?? '',
        goal: saved.goal ?? '',
        personal_info: saved.personal_info ?? '',
      });
    }
  }, [accountId]);

  // Refetch after save completes (isSaving: true → false)
  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      void dbQuery.refetch();
    }
    prevIsSavingRef.current = isSaving;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  // Sync markdown result from DB
  useEffect(() => {
    if (!dbQuery.data?.result) return;
    const raw = dbQuery.data.result as Record<string, unknown>;
    if (typeof raw.markdown === 'string') {
      setResult({ markdown: raw.markdown });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data?.result]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isCtaDisabled) return;
    const formData: Step4FormData = {
      platform,
      follower_count: fieldValues['follower_count'] ?? '',
      goal: fieldValues['goal'] ?? '',
      personal_info: fieldValues['personal_info'] ?? '',
    };
    save(formData as unknown as Record<string, unknown>);
    document.getElementById('step4-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.markdown);
      toast.success('已复制');
    } catch {
      toast.error('复制失败 · 请手动');
    }
  }

  return (
    <main className="flex-1 container py-8">
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP4_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP4_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        {/* Platform radio — required */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP4_RADIO_LABEL}
            <span className="text-destructive ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {STEP4_PLATFORMS_5.map((p) => (
              <label
                key={p.id}
                htmlFor={`step4-platform-${p.id}`}
                className={cn(
                  'glass-card rounded-lg p-3 flex flex-col items-center text-center cursor-pointer transition-colors',
                  platform === p.id
                    ? 'border-primary/60 bg-primary/10'
                    : 'hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  id={`step4-platform-${p.id}`}
                  name="step4-platform"
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

        {STEP4_INPUTS_3.map((input) => (
          <div key={input.id}>
            <label className="block text-body-sm font-label text-on-surface mb-2">
              {input.label}
            </label>
            {input.type === 'textarea' ? (
              <textarea
                value={fieldValues[input.id] ?? ''}
                onChange={(e) =>
                  setFieldValues((prev) => ({ ...prev, [input.id]: e.target.value }))
                }
                placeholder={input.placeholder}
                className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] font-cn resize-y"
              />
            ) : (
              <Input
                value={fieldValues[input.id] ?? ''}
                onChange={(e) =>
                  setFieldValues((prev) => ({ ...prev, [input.id]: e.target.value }))
                }
                placeholder={input.placeholder}
              />
            )}
          </div>
        ))}

        <Button
          type="submit"
          disabled={isCtaDisabled}
          className={cn('w-full', !isCtaDisabled && 'bg-gradient-to-r from-primary to-primary/80')}
        >
          {STEP4_BUTTON_GENERATE}
        </Button>
      </form>

      {/* State feedback */}
      <div className="mt-8 max-w-2xl">
        {isSaving && <LoadingState text="AI 正在制定执行计划 ..." size="lg" />}
        {!isSaving && dbQuery.isError && (
          <ErrorState
            message={dbQuery.error instanceof Error ? dbQuery.error.message : '生成失败 · 请重试'}
            onRetry={dbQuery.refetch}
          />
        )}
        {!isSaving && !dbQuery.isError && !result && (
          <EmptyState title={`提交表单后查看${STEP4_H1}`} />
        )}
      </div>

      {/* Output section — markdown rendered */}
      {!isSaving && result && (
        <section id="step4-output" className="mt-10 max-w-4xl">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl text-on-surface">{STEP4_H1}</h3>
              <Button variant="outline" size="sm" onClick={() => { void handleCopy(); }}>
                <Copy className="h-4 w-4 mr-1" />
                {STEP4_BUTTON_COPY}
              </Button>
            </div>
            <article className="prose prose-sm max-w-none text-on-surface prose-headings:text-on-surface prose-p:text-muted-foreground prose-strong:text-on-surface prose-li:text-muted-foreground prose-a:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.markdown}</ReactMarkdown>
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
