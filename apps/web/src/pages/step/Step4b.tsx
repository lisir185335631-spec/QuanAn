import { type FormEvent, useEffect, useRef, useState } from 'react';

import Step4bOutputContent from '@/components/step4b/Step4bOutputContent';
import type { Step4bResult } from '@/components/step4b/Step4bOutputContent';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import {
  STEP4B_BUTTON_GENERATE,
  STEP4B_BUTTON_OPTIMIZE,
  STEP4B_BUTTON_REGENERATE,
  STEP4B_H1,
  STEP4B_INPUTS_3,
  STEP4B_STEP_TAG,
  STEP4B_SUBTITLE_TEMPLATE,
  STEP4B_TEXTAREA,
  STEP4B_THREE_STAGES,
} from '@/lib/constants/step4b';
import type { Step4bStageDetail } from '@/lib/constants/step4b';
import { cn } from '@/lib/utils';

export interface Step4bFormData {
  product_description: string;
  target_audience: string;
  ip_positioning: string;
  current_income: string;
}

// ── Adapter: backend Step4bOutput → frontend Step4bResult ────────────────────

export function adaptStep4bResult(
  raw: Record<string, unknown>,
  industryLabel: string,
): Step4bResult {
  const currentAnalysis = typeof raw.currentAnalysis === 'string' ? raw.currentAnalysis : '';
  const ladder = Array.isArray(raw.ladder)
    ? (raw.ladder as Array<{ stage?: string; revenue?: string; action?: string }>)
    : [];
  const rs = (raw.revenueStructure as { primary?: string; secondary?: string[] } | null) ?? {};
  const successCasesRaw = Array.isArray(raw.successCases)
    ? (raw.successCases as Array<{ title?: string; summary?: string }>)
    : [];

  function mapLadder(i: number, stageConst: (typeof STEP4B_THREE_STAGES)[number]): Step4bStageDetail {
    const lad = ladder[i] ?? {};
    return {
      range: stageConst.range,
      title: stageConst.title,
      duration: stageConst.duration,
      coreStrategy: lad.action ?? '',
      productMatrix: [],
      trafficStrategy: lad.stage ?? '',
      conversionFlow: [],
      keyActions: lad.revenue ? [`目标营收：${lad.revenue}`] : [],
      risks: [],
    };
  }

  const revCategories: Step4bResult['revenue_structure'] = [];
  if (rs.primary) {
    revCategories.push({ category: rs.primary, percent: 60, description: '主要收入来源' });
  }
  (rs.secondary ?? []).forEach((cat, i) => {
    revCategories.push({ category: cat, percent: i === 0 ? 25 : 15, description: '辅助收入来源' });
  });

  return {
    market_analysis: {
      industry: industryLabel,
      marketSize: currentAnalysis.slice(0, 200) || '待 AI 分析',
      competitionLevel: '中高竞争',
      monetizationPotential: currentAnalysis || '',
    },
    three_stages: [
      mapLadder(0, STEP4B_THREE_STAGES[0]),
      mapLadder(1, STEP4B_THREE_STAGES[1]),
      mapLadder(2, STEP4B_THREE_STAGES[2]),
    ],
    revenue_structure: revCategories,
    success_cases: successCasesRaw.map((c) => ({
      name: c.title ?? '',
      type: '',
      journey: c.summary ?? '',
      result: c.summary ?? '',
      insight: '',
    })),
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Step4b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step4b');

  const [formData, setFormData] = useState<Step4bFormData>({
    product_description: '',
    target_audience: '',
    ip_positioning: '',
    current_income: '',
  });
  const [result, setResult] = useState<Step4bResult | null>(null);

  const prevIsSavingRef = useRef(false);

  // Cross-step prefill: industry from step1 for subtitle
  const step1Data = readOtherStep<{ industryLabel?: string }>(accountId, 'step1');
  const industryLabel = step1Data?.industryLabel ?? '(未选择)';
  const subtitle = STEP4B_SUBTITLE_TEMPLATE.replace('{industry}', industryLabel);

  const hasResult = result !== null;
  const generateDisabled = hasResult || isSaving || !formData.product_description.trim();
  const optimizeDisabled = !hasResult || isSaving;
  const regenerateDisabled = !hasResult || isSaving;

  // Prefill form from namespaced LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step4bFormData>(accountId, 'step4b');
    if (saved?.product_description) {
      setFormData({
        product_description: saved.product_description,
        target_audience: saved.target_audience ?? '',
        ip_positioning: saved.ip_positioning ?? '',
        current_income: saved.current_income ?? '',
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

  // Sync result from DB
  useEffect(() => {
    if (!dbQuery.data?.result) return;
    const raw = dbQuery.data.result as Record<string, unknown>;
    setResult(adaptStep4bResult(raw, industryLabel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data?.result]);

  function setField(field: keyof Step4bFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (generateDisabled) return;
    save(formData as unknown as Record<string, unknown>);
    document.getElementById('step4b-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleOptimize() {
    if (optimizeDisabled) return;
    save({ ...formData, _action: 'optimize' });
  }

  function handleRegenerate() {
    if (regenerateDisabled) return;
    setResult(null);
    save(formData as unknown as Record<string, unknown>);
    document.getElementById('step4b-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="flex-1 container py-8">
      {/* Header */}
      <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
        {STEP4B_STEP_TAG}
      </p>
      <h1 className="text-h1 font-display text-on-surface mb-2">{STEP4B_H1}</h1>
      <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>

      {/* Form glass-card */}
      <form onSubmit={(e) => { void handleSubmit(e); }} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        {/* Required textarea — STEP4B_TEXTAREA */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP4B_TEXTAREA.label}
            <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            required
            value={formData.product_description}
            onChange={(e) => setField('product_description', e.target.value)}
            placeholder={STEP4B_TEXTAREA.placeholder}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-cn resize-y"
            style={{ minHeight: '100px' }}
          />
        </div>

        {/* 3 optional inputs — STEP4B_INPUTS_3 */}
        {STEP4B_INPUTS_3.map((input) => (
          <div key={input.id}>
            <label className="block text-body-sm font-label text-on-surface mb-2">
              {input.label}
            </label>
            <Input
              value={formData[input.id as keyof Step4bFormData]}
              onChange={(e) => setField(input.id as keyof Step4bFormData, e.target.value)}
              placeholder={input.placeholder}
            />
          </div>
        ))}

        {/* 3 buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={generateDisabled}
            className={cn('flex-1 min-w-[140px]', !generateDisabled && 'bg-gradient-to-r from-primary to-primary/80')}
          >
            {STEP4B_BUTTON_GENERATE}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={optimizeDisabled}
            onClick={handleOptimize}
            className="flex-1 min-w-[120px]"
          >
            {STEP4B_BUTTON_OPTIMIZE}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={regenerateDisabled}
            onClick={handleRegenerate}
            className="flex-1 min-w-[120px]"
          >
            {STEP4B_BUTTON_REGENERATE}
          </Button>
        </div>
      </form>

      {/* State feedback */}
      <div className="mt-8 max-w-2xl">
        {isSaving && <LoadingState text="AI 正在制定变现规划 ..." size="lg" />}
        {!isSaving && dbQuery.isError && (
          <ErrorState
            message={dbQuery.error instanceof Error ? dbQuery.error.message : '生成失败 · 请重试'}
            onRetry={dbQuery.refetch}
          />
        )}
        {!isSaving && !dbQuery.isError && !hasResult && (
          <EmptyState title={`提交表单后查看${STEP4B_H1}`} />
        )}
      </div>

      {/* Output section — 5 H3 blocks */}
      {hasResult && result && (
        <section id="step4b-output" className="mt-10 max-w-4xl">
          <Step4bOutputContent result={result} />
        </section>
      )}
    </main>
  );
}
