import { type FormEvent, useEffect, useRef, useState } from 'react';

import { FadeInWrapper } from '@/components/FadeInWrapper';

import Step4bOutputContent from '@/components/step4b/Step4bOutputContent';
import type { Step4bResult } from '@/components/step4b/Step4bOutputContent';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlatformInlineRadio } from '@/components/inline-pickers';
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
import { cn } from '@/lib/utils';

export interface Step4bFormData {
  product_description: string;
  industry: string;
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

  function mapLadder(i: number, stageConst: (typeof STEP4B_THREE_STAGES)[number]) {
    const lad = ladder[i] ?? {};
    return {
      range: stageConst.range,
      title: stageConst.title,
      duration: stageConst.duration,
      coreStrategy: lad.action ?? '',
      productMatrix: [] as [],
      trafficStrategy: lad.stage ?? '',
      conversionFlow: [] as string[],
      keyActions: lad.revenue ? [`目标营收：${lad.revenue}`] : [],
      risks: [] as string[],
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

function generateMockResult(): Step4bResult {
  return {
    market_analysis: {
      industry: '通用行业',
      marketSize: '市场规模广阔，增量用户持续涌入',
      competitionLevel: '中高竞争',
      monetizationPotential: '变现潜力强，多元化路径可选',
    },
    three_stages: [
      {
        range: STEP4B_THREE_STAGES[0].range,
        title: STEP4B_THREE_STAGES[0].title,
        duration: STEP4B_THREE_STAGES[0].duration,
        coreStrategy: '私信成交、线下体验、小额引流品',
        productMatrix: [],
        trafficStrategy: '短视频引流 + 私域承接',
        conversionFlow: ['内容种草', '私信沟通', '成交转化'],
        keyActions: ['每日发布1-2条内容', '建立私信话术', '积累100个精准客户'],
        risks: [],
      },
      {
        range: STEP4B_THREE_STAGES[1].range,
        title: STEP4B_THREE_STAGES[1].title,
        duration: STEP4B_THREE_STAGES[1].duration,
        coreStrategy: '知识付费课程、社群运营、代理分销',
        productMatrix: [],
        trafficStrategy: '矩阵号 + 直播 + 私域裂变',
        conversionFlow: ['社群预热', '直播成交', '裂变分销'],
        keyActions: ['搭建3-5人团队', '推出标准化产品', '月营业额破百万'],
        risks: [],
      },
      {
        range: STEP4B_THREE_STAGES[2].range,
        title: STEP4B_THREE_STAGES[2].title,
        duration: STEP4B_THREE_STAGES[2].duration,
        coreStrategy: '品牌IP授权、资本运作、生态合作',
        productMatrix: [],
        trafficStrategy: '全域营销 + 品牌联名 + 媒体矩阵',
        conversionFlow: ['品牌曝光', '生态合作', '资本整合'],
        keyActions: ['品牌化运营', '资本合作', '生态扩张'],
        risks: [],
      },
    ],
    revenue_structure: [
      { category: '知识付费/课程', percent: 50, description: '核心收入来源，稳定可预期' },
      { category: '品牌合作/赞助', percent: 30, description: '规模化后的重要增量来源' },
      { category: '代理/分销', percent: 20, description: '被动收入，杠杆放大效果' },
    ],
    success_cases: [
      {
        name: '张教练',
        type: '健身行业',
        journey: '从健身房教练做短视频，18个月私域沉淀3000人',
        result: '年收入从5万增至200万',
        insight: '垂直深耕 + 案例可视化是关键',
      },
      {
        name: '李美妆',
        type: '美妆行业',
        journey: '美妆博主起号，精准定位25-35岁职场女性',
        result: '私域3000人，月入稳定10万+',
        insight: '人设精准 + 内容一致性是护城河',
      },
    ],
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Step4b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step4b');

  const [formData, setFormData] = useState<Step4bFormData>({
    product_description: '',
    industry: '',
  });
  const [platform, setPlatform] = useState('');
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
        industry: saved.industry ?? '',
      });
    }
  }, [accountId]);

  // Refetch after save completes
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
    save({ ...formData, platform } as unknown as Record<string, unknown>);
    // Stub mode: show mock result immediately (LLM integration in PRD-23+)
    setResult(generateMockResult());
    document.getElementById('step4b-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleOptimize() {
    if (optimizeDisabled) return;
    save({ ...formData, platform, _action: 'optimize' } as unknown as Record<string, unknown>);
  }

  function handleRegenerate() {
    if (regenerateDisabled) return;
    setResult(null);
    save({ ...formData, platform } as unknown as Record<string, unknown>);
    document.getElementById('step4b-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="flex-1 container py-8">
      {/* Header */}
      <FadeInWrapper delay={0} from="up">
        <div>
          <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
            {STEP4B_STEP_TAG}
          </p>
          <h1 className="text-h1 font-display text-on-surface mb-2">{STEP4B_H1}</h1>
          <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>
        </div>
      </FadeInWrapper>

      {/* Form glass-card */}
      <FadeInWrapper delay={0.05} from="up">
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

        {/* 行业领域 input — STEP4B_INPUTS_3[0] */}
        {STEP4B_INPUTS_3.map((input) => (
          <div key={input.id}>
            <label className="block text-body-sm font-label text-on-surface mb-2">
              {input.label}
            </label>
            <Input
              value={formData[input.id as keyof Step4bFormData] ?? ''}
              onChange={(e) => setField(input.id as keyof Step4bFormData, e.target.value)}
              placeholder={input.placeholder}
            />
          </div>
        ))}

        {/* PlatformInlineRadio — US-001 utility */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            平台选择
          </label>
          <PlatformInlineRadio value={platform} onChange={setPlatform} />
        </div>

        {/* Buttons */}
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
      </FadeInWrapper>

      {/* State feedback */}
      <FadeInWrapper delay={0.1} from="up">
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
      </FadeInWrapper>

      {/* Output: 5 H3 blocks — AC-6 · D-220 字面锁 */}
      {hasResult && result && (
        <FadeInWrapper delay={0.15} from="up">
          <section id="step4b-output" className="mt-10 max-w-4xl">
            <Step4bOutputContent result={result} />
          </section>
        </FadeInWrapper>
      )}
    </main>
  );
}
