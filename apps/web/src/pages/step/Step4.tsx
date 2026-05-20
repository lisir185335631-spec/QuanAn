import { type FormEvent, useEffect, useRef, useState } from 'react';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import {
  STEP4_BUTTON_GENERATE,
  STEP4_H1,
  STEP4_INPUTS_3,
  STEP4_OUTPUT_H3_3,
  STEP4_STEP_TAG,
  STEP4_SUBTITLE_TEMPLATE,
  type Step4KpiResult,
} from '@/lib/constants/step4';

interface Step4FormData {
  follower_count: string;
  goal: string;
  personal_info: string;
}

function generateMockResult(): Step4KpiResult {
  return {
    daily_kpi: ['发布1-2条内容', '回复20条评论', '分析竞品5分钟'],
    weekly_kpi: ['粉丝净增200+', '完成7条内容', '完成1次数据复盘'],
    phase_kpi: ['1-30天: 完成30条内容 · 积累500粉', '1-3个月: 精准粉丝5000', '3-6个月: 达目标粉丝 · 启动变现'],
  };
}

function adaptKpiResult(raw: Record<string, unknown>): Step4KpiResult {
  return {
    daily_kpi: Array.isArray(raw.daily_kpi) ? (raw.daily_kpi as string[]) : generateMockResult().daily_kpi,
    weekly_kpi: Array.isArray(raw.weekly_kpi) ? (raw.weekly_kpi as string[]) : generateMockResult().weekly_kpi,
    phase_kpi: Array.isArray(raw.phase_kpi) ? (raw.phase_kpi as string[]) : generateMockResult().phase_kpi,
  };
}

export default function Step4() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { save, isSaving, dbQuery } = useStepData(accountId, 'step4');

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({
    follower_count: '',
    goal: '',
    personal_info: '',
  });
  const [result, setResult] = useState<Step4KpiResult | null>(null);

  const prevIsSavingRef = useRef(false);

  // Cross-step prefill: industry from step1 for subtitle
  const step1Data = readOtherStep<{ industryLabel?: string }>(accountId, 'step1');
  const industryLabel = step1Data?.industryLabel ?? '(未选择)';
  const subtitle = STEP4_SUBTITLE_TEMPLATE.replace('{industry}', industryLabel);

  // Prefill form from namespaced LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step4FormData>(accountId, 'step4');
    if (saved) {
      setFieldValues({
        follower_count: saved.follower_count ?? '',
        goal: saved.goal ?? '',
        personal_info: saved.personal_info ?? '',
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
    const raw = dbQuery.data.result;
    setResult(adaptKpiResult(raw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbQuery.data?.result]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSaving) return;
    const formData: Step4FormData = {
      follower_count: fieldValues['follower_count'] ?? '',
      goal: fieldValues['goal'] ?? '',
      personal_info: fieldValues['personal_info'] ?? '',
    };
    save(formData as unknown as Record<string, unknown>);
    // Stub mode: show mock result immediately (LLM integration in PRD-23+)
    setResult(generateMockResult());
    document.getElementById('step4-output')?.scrollIntoView({ behavior: 'smooth' });
  }

  const kpiBlocks = result
    ? [
        { id: STEP4_OUTPUT_H3_3[0].id, h3: STEP4_OUTPUT_H3_3[0].h3Label, items: result.daily_kpi },
        { id: STEP4_OUTPUT_H3_3[1].id, h3: STEP4_OUTPUT_H3_3[1].h3Label, items: result.weekly_kpi },
        { id: STEP4_OUTPUT_H3_3[2].id, h3: STEP4_OUTPUT_H3_3[2].h3Label, items: result.phase_kpi },
      ]
    : [];

  return (
    <main className="flex-1 container py-8">
      {/* AC-1: Header with FadeInWrapper stagger */}
      <FadeInWrapper delay={0} from="up">
        <div>
          <p className="text-label-sm font-label text-primary uppercase tracking-wide mb-2">
            {STEP4_STEP_TAG}
          </p>
          <h1 className="text-h1 font-display text-on-surface mb-2">{STEP4_H1}</h1>
          <p className="text-body-md text-muted-foreground mb-8">{subtitle}</p>
        </div>
      </FadeInWrapper>

      <FadeInWrapper delay={0.05} from="up">
      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
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
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-primary to-primary/80"
        >
          {STEP4_BUTTON_GENERATE}
        </Button>
      </form>
      </FadeInWrapper>

      {/* State feedback */}
      <div className="mt-8 max-w-2xl">
        {isSaving && <LoadingState text="AI 正在制定执行计划 ..." size="lg" />}
        {!isSaving && dbQuery.isError && (
          <ErrorState
            message={dbQuery.error instanceof Error ? dbQuery.error.message : '生成失败 · 请重试'}
            onRetry={() => { void dbQuery.refetch(); }}
          />
        )}
        {!isSaving && !dbQuery.isError && !result && (
          <EmptyState title={`提交表单后查看${STEP4_H1}`} />
        )}
      </div>

      {/* Output: 3 KPI H3 blocks — AC-3 · D-220 字面锁 */}
      {result && (
        <section id="step4-output" className="mt-10 max-w-4xl space-y-4">
          {kpiBlocks.map((block, idx) => (
            <FadeInWrapper key={block.id} delay={0.05 * idx} from="up">
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display text-xl text-on-surface mb-4">{block.h3}</h3>
                <ul className="space-y-2">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-body-sm text-muted-foreground">
                      <span className="text-primary shrink-0 mt-0.5">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInWrapper>
          ))}
        </section>
      )}
    </main>
  );
}
