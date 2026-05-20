import { type FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import Step3bOutputContent, {
  type Step3bResult,
} from '@/components/step3b/Step3bOutputContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import {
  STEP3B_AUDIENCE,
  STEP3B_BUTTON_COPY,
  STEP3B_BUTTON_COPY_ALL,
  STEP3B_BUTTON_OPTIMIZE,
  STEP3B_BUTTON_REGEN_ALL,
  STEP3B_BUTTON_REGENERATE,
  STEP3B_CTA_LABEL,
  STEP3B_H1,
  STEP3B_LOADING_TEXT,
  STEP3B_OUTPUT_H3_6,
  STEP3B_STEP_TAG,
  STEP3B_SUBTITLE_TEMPLATE,
  STEP3B_TEXTAREAS_3,
  type Step3bOutputBlock,
} from '@/lib/constants/step3b';

// ── Backend Step3bOutput → frontend Step3bResult adapter ──────────────────────
function adaptStep3bResult(raw: Record<string, unknown>): Step3bResult {
  return {
    personaPosition: typeof raw.personaPosition === 'string' ? raw.personaPosition
      : typeof raw.coreIdentity === 'string' ? raw.coreIdentity : undefined,
    personaTags: Array.isArray(raw.personaTags) ? (raw.personaTags as string[])
      : Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    contentDirection: Array.isArray(raw.contentDirection) ? (raw.contentDirection as string[])
      : Array.isArray(raw.contentPillars) ? (raw.contentPillars as string[]) : [],
    differentiationStrategy: typeof raw.differentiationStrategy === 'string' ? raw.differentiationStrategy : undefined,
    contentDirectionAdvice: Array.isArray(raw.contentDirectionAdvice) ? (raw.contentDirectionAdvice as string[]) : [],
    ipStoryFramework: typeof raw.ipStoryFramework === 'string' ? raw.ipStoryFramework : undefined,
  };
}

function generateMockResult(): Step3bResult {
  return {
    personaPosition: '深耕行业 10 年、专注客户结果的专业实践者，「亲测派」IP 标签',
    personaTags: ['结果导向', '真实案例', '专业讲师', '抗衰达人', '皮肤管理师'],
    contentDirection: ['行业干货拆解', '真实案例复盘', '避坑指南', '工具/方法推荐'],
    differentiationStrategy: '不卖课不带货，只分享真实落地经验与成果案例，形成与同行的鲜明区隔',
    contentDirectionAdvice: [
      '深度干货 + 案例拆解（每周 2 条）',
      '互动问答 + 粉丝故事（每周 1 条）',
      '避坑指南 + 工具推荐（每两周 1 条）',
    ],
    ipStoryFramework: '从零开始 → 踩坑无数 → 找到方法 → 帮助他人 → 成为标杆的"逆袭故事"框架',
  };
}

function getBlockText(blockId: Step3bOutputBlock['id'], result: Step3bResult): string {
  if (blockId === 'personaPosition') return result.personaPosition ?? '—';
  if (blockId === 'personaTags') return (result.personaTags ?? []).join('、');
  if (blockId === 'contentDirection') return (result.contentDirection ?? []).join('\n');
  if (blockId === 'differentiationStrategy') return result.differentiationStrategy ?? '—';
  if (blockId === 'contentDirectionAdvice') return (result.contentDirectionAdvice ?? []).join('\n');
  if (blockId === 'ipStoryFramework') return result.ipStoryFramework ?? '—';
  return '';
}

function mergeBlockResult(prev: Step3bResult, blockId: Step3bOutputBlock['id'], fresh: Step3bResult): Step3bResult {
  return { ...prev, [blockId]: fresh[blockId as keyof Step3bResult] };
}

interface FormData {
  personalInfo: string;
  advantages: string;
  story: string;
  audience: string;
}

export default function Step3b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step3b');

  const [formData, setFormData] = useState<FormData>({
    personalInfo: '',
    advantages: '',
    story: '',
    audience: '',
  });
  const [result, setResult] = useState<Step3bResult | null>(null);
  const [regenLoadingBlocks, setRegenLoadingBlocks] = useState<string[]>([]);
  const [regenAllLoading, setRegenAllLoading] = useState(false);

  const prevIsSavingRef = useRef(false);

  // Cross-step prefill: industry from step1, personalInfo from step3
  const step1Data = readOtherStep<{ industryLabel?: string }>(accountId, 'step1');
  const industryLabel = step1Data?.industryLabel ?? '(未选择)';
  const subtitle = STEP3B_SUBTITLE_TEMPLATE.replace('{industry}', industryLabel);
  const isCtaDisabled = !formData.personalInfo.trim() || isSaving;

  // Prefill from new namespaced LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const step3Data = readOtherStep<{ personalInfo?: string }>(accountId, 'step3');
    const step3bData = readOtherStep<FormData>(accountId, 'step3b');
    if (step3bData?.personalInfo) {
      setFormData({
        personalInfo: step3bData.personalInfo,
        advantages: step3bData.advantages ?? '',
        story: step3bData.story ?? '',
        audience: step3bData.audience ?? '',
      });
    } else if (step3Data?.personalInfo) {
      setFormData((prev) => ({ ...prev, personalInfo: step3Data.personalInfo ?? '' }));
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
    const raw = dbQuery.data.result;
    setResult(adaptStep3bResult(raw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data?.result]);

  function setField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isCtaDisabled) return;
    save(formData as unknown as Record<string, unknown>);
    // Stub mode: show mock result immediately (本 PRD 不接 LLM)
    setResult(generateMockResult());
    document.getElementById('step3b-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleCopy(blockId: Step3bOutputBlock['id']) {
    if (!result) return;
    const text = getBlockText(blockId, result);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制');
    } catch {
      toast.error('复制失败 · 请手动');
    }
  }

  async function handleRegen(blockId: Step3bOutputBlock['id']) {
    setRegenLoadingBlocks((prev) => [...prev, blockId]);
    toast.info('重新生成中...');
    await new Promise<void>((r) => setTimeout(r, 1500));
    const fresh = generateMockResult();
    setResult((prev) => (prev ? mergeBlockResult(prev, blockId, fresh) : fresh));
    setRegenLoadingBlocks((prev) => prev.filter((id) => id !== blockId));
  }

  function handleOptimize(blockId: Step3bOutputBlock['id']) {
    toast.info(`智能优化 ${blockId} 中...`);
    void new Promise<void>((r) => setTimeout(r, 1500)).then(() => {
      const fresh = generateMockResult();
      setResult((prev) => (prev ? mergeBlockResult(prev, blockId, fresh) : fresh));
    });
  }

  async function handleRegenAll() {
    setRegenAllLoading(true);
    toast.info('全部模块重新生成中...');
    await new Promise<void>((r) => setTimeout(r, 1500));
    setResult(generateMockResult());
    setRegenAllLoading(false);
  }

  async function handleCopyAll() {
    if (!result) return;
    const allText = STEP3B_OUTPUT_H3_6.map((block) => {
      const label = block.h3Label;
      const content = getBlockText(block.id, result);
      return `${label}\n${content}`;
    }).join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(allText);
      toast.success('已复制全部 6 个模块');
    } catch {
      toast.error('复制失败 · 请手动');
    }
  }

  return (
    <main className="flex-1 container py-8">
      {/* AC-1: Header with FadeInWrapper stagger */}
      <FadeInWrapper delay={0} from="up">
        <div>
          <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
            {STEP3B_STEP_TAG}
          </p>
          <h1 className="text-h1 font-display text-on-surface mb-2">{STEP3B_H1}</h1>
          <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>
        </div>
      </FadeInWrapper>

      <FadeInWrapper delay={0.05} from="up">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* 3 textarea from STEP3B_TEXTAREAS_3 (AC-4) */}
        {STEP3B_TEXTAREAS_3.map((ta) => (
          <div key={ta.id}>
            <label className="block text-body-sm font-label text-on-surface mb-2">
              {ta.label}
              {ta.required && <span className="text-destructive ml-1">*</span>}
            </label>
            <textarea
              required={ta.required}
              value={formData[ta.id]}
              onChange={(e) => setField(ta.id, e.target.value)}
              placeholder={ta.placeholder}
              className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-cn resize-y"
              style={{ minHeight: ta.id === 'personalInfo' ? '160px' : '100px' }}
            />
          </div>
        ))}

        {/* 目标受众 input (AC-4) */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP3B_AUDIENCE.label}
          </label>
          <Input
            value={formData.audience}
            onChange={(e) => setField('audience', e.target.value)}
            placeholder={STEP3B_AUDIENCE.placeholder}
          />
        </div>

        {/* Main CTA */}
        <div>
          <Button
            type="submit"
            disabled={isCtaDisabled}
            className={`w-full${!isCtaDisabled ? ' bg-gradient-to-r from-primary to-primary/80' : ''}`}
          >
            {STEP3B_CTA_LABEL}
          </Button>
        </div>
      </form>
      </FadeInWrapper>

      {/* Result area */}
      <div className="mt-8">
        {isSaving ? (
          <LoadingState text="正在分析人设方案 · 请稍候 ..." size="lg" />
        ) : dbQuery.isError ? (
          <ErrorState
            message={dbQuery.error instanceof Error ? dbQuery.error.message : '加载失败'}
            onRetry={() => { void dbQuery.refetch(); }}
          />
        ) : result ? (
          <section id="step3b-output" className="mt-2 max-w-4xl">
            {/* AC-5: H3 "人设定制方案"(顶部总览) with [一键重新生成] + [复制全部] */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-display text-on-surface">人设定制方案</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { void handleRegenAll(); }} disabled={regenAllLoading}>
                  {STEP3B_BUTTON_REGEN_ALL}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { void handleCopyAll(); }}>
                  {STEP3B_BUTTON_COPY_ALL}
                </Button>
              </div>
            </div>

            {/* AC-7: 6 H3 content blocks with glass-card + FadeInWrapper */}
            <div className="space-y-4">
              {STEP3B_OUTPUT_H3_6.map((block, idx) => (
                <FadeInWrapper key={block.id} delay={0.05 * idx} from="up">
                  <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-lg p-6 mb-4">
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <h3 className="font-display text-2xl text-on-surface">{block.h3Label}</h3>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                        <Button variant="outline" size="sm" onClick={() => { void handleCopy(block.id); }}>
                          {STEP3B_BUTTON_COPY}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { void handleRegen(block.id); }}
                          disabled={regenLoadingBlocks.includes(block.id)}
                        >
                          {regenLoadingBlocks.includes(block.id) ? '生成中...' : STEP3B_BUTTON_REGENERATE}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOptimize(block.id)}>
                          {STEP3B_BUTTON_OPTIMIZE}
                        </Button>
                      </div>
                    </div>
                    <Step3bOutputContent blockId={block.id} result={result} />
                  </div>
                </FadeInWrapper>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState title={`提交表单后查看${STEP3B_H1}`} />
        )}
      </div>

      {isSaving && (
        <div className="mt-2 text-center text-body-sm text-muted-foreground">
          {STEP3B_LOADING_TEXT}
        </div>
      )}
    </main>
  );
}
