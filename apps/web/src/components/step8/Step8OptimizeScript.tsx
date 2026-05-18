import { type FormEvent, useEffect, useRef, useState } from 'react';

import { EmptyState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStepData } from '@/hooks/useStepData';
import {
  STEP8_BUTTON_OPTIMIZE_SCRIPT,
  STEP8_H1,
  STEP8_OPTIMIZE_CHAR_COUNTER_TEMPLATE,
  STEP8_OPTIMIZE_INPUT,
  STEP8_OPTIMIZE_LOADING_TEXT,
  STEP8_OPTIMIZE_MIN_CHARS,
  STEP8_OPTIMIZE_OUTPUT_LABELS_2,
  STEP8_OPTIMIZE_TEXTAREA,
  type Step8OptimizeScriptResult,
} from '@/lib/constants/step8';

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

export function Step8OptimizeScript({ subfunctionKey, accountId }: Props) {
  const [scriptText, setScriptText] = useState('');
  const [optimizeGoal, setOptimizeGoal] = useState('');
  const [result, setResult] = useState<Step8OptimizeScriptResult | null>(null);

  const { save, load, isSaving, dbQuery } = useStepData(accountId, 'step8');
  const prevIsSavingRef = useRef(false);

  // Restore form data from LS on mount (sub_function discriminator: prevents cross-contamination)
  useEffect(() => {
    if (accountId === null) return;
    const raw = load();
    if (!raw) return;
    if (raw['sub_function'] !== subfunctionKey) return;
    if (typeof raw['scriptText'] === 'string') setScriptText(raw['scriptText']);
    if (typeof raw['optimizeGoal'] === 'string') setOptimizeGoal(raw['optimizeGoal']);
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
    if (inputs?.['sub_function'] !== 'optimize_script') return;
    const raw = dbQuery.data.result as Record<string, unknown>;
    if (
      typeof raw['optimized_text'] === 'string' &&
      typeof raw['optimization_notes'] === 'string'
    ) {
      setResult({
        optimized_text: raw['optimized_text'],
        optimization_notes: raw['optimization_notes'],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data]);

  const charCounterText = STEP8_OPTIMIZE_CHAR_COUNTER_TEMPLATE.replace(
    '{count}',
    String(scriptText.length),
  );
  const submitDisabled = isSaving || scriptText.length < STEP8_OPTIMIZE_MIN_CHARS;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled) return;
    save({
      sub_function: 'optimize_script',
      scriptText,
      optimizeGoal,
    });
    document.getElementById('step8-optimize-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={(e) => { handleSubmit(e); }}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        {/* Script textarea */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_OPTIMIZE_TEXTAREA.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            required
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder={STEP8_OPTIMIZE_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[160px] font-cn resize-y"
          />
          <p className="text-body-xs text-muted-foreground mt-1">{charCounterText}</p>
        </div>

        {/* Optimize goal input */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_OPTIMIZE_INPUT.label}
          </label>
          <Input
            value={optimizeGoal}
            onChange={(e) => setOptimizeGoal(e.target.value)}
            placeholder={STEP8_OPTIMIZE_INPUT.placeholder}
          />
        </div>

        {/* CTA */}
        <Button type="submit" disabled={submitDisabled} className="w-full sm:w-auto">
          {STEP8_BUTTON_OPTIMIZE_SCRIPT}
        </Button>
      </form>

      {/* Three-state feedback */}
      <div className="max-w-2xl">
        {isSaving && <LoadingState text={STEP8_OPTIMIZE_LOADING_TEXT} size="lg" />}
        {!isSaving && !result && (
          <EmptyState title={`提交表单后查看${STEP8_H1}`} />
        )}
      </div>

      {/* Output: 2 InfoCards — TD-77 fix: 使用常量 map 禁止 hardcode */}
      {result && !isSaving && (
        <div id="step8-optimize-output" className="space-y-4">
          {STEP8_OPTIMIZE_OUTPUT_LABELS_2.map(({ id, label }) => (
            <InfoCard key={id} label={label} value={result[id]} />
          ))}
        </div>
      )}
    </div>
  );
}
