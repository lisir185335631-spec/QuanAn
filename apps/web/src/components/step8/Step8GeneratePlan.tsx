/**
 * Step8GeneratePlan — PRD-25 US-007 AC-1/AC-2/AC-4
 * AC-1: useMutation → trpc.stepData.save · payload {stepKey:'step8', inputs:{sub_function:'generate_plan',...}}
 * AC-2: 6 模块渲染 result.opening / .warmup / .product / .conversion / .faq / .closing
 * AC-4: isFallback hint + error handling
 */
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { PlatformInlineRadio } from '@/components/inline-pickers/PlatformInlineRadio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  STEP8_BUTTON_GENERATE_PLAN,
  STEP8_EXPERIENCE_RADIO_LABEL,
  STEP8_EXPERIENCES_3,
  STEP8_GENERATE_LOADING_TEXT,
  STEP8_GENERATE_PLAN_INPUT,
  STEP8_GENERATE_PLAN_TEXTAREA,
  STEP8_PLATFORM_RADIO_LABEL,
} from '@/lib/constants/step8';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// 6 modules matching LivestreamAgent generate_plan output schema (D-248 字面锁)
const GENERATE_PLAN_MODULES = [
  { id: 'opening',    label: '开场话术' },
  { id: 'warmup',     label: '暖场互动' },
  { id: 'product',    label: '产品介绍' },
  { id: 'conversion', label: '转化促单' },
  { id: 'faq',        label: '常见问题' },
  { id: 'closing',    label: '收尾' },
] as const;

type GeneratePlanResult = {
  opening: string;
  warmup: string;
  product: string;
  conversion: string;
  faq: string;
  closing: string;
};

interface Props {
  accountId: number | null;
}

export function Step8GeneratePlan({ accountId }: Props) {
  const [productInfo, setProductInfo] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratePlanResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  // AC-1: useMutation → trpc.stepData.save
  const saveMutation = trpc.stepData.save.useMutation({
    onSuccess(data) {
      const raw = data.data.result as GeneratePlanResult | null;
      if (raw?.opening) {
        setResult(raw);
        setIsFallback(data.data.isFallback);
        document.getElementById('step8-generate-output')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        toast.error('AI 返回格式错误 · 请稍后重试');
      }
    },
    onError() {
      toast.error('生成失败 · 请稍后重试');
    },
  });

  // AC-1: disabled if !product || !platform || !experience
  const submitDisabled = !productInfo || !platform || !experience || saveMutation.isPending;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled || !accountId) return;
    setResult(null);
    setIsFallback(false);
    saveMutation.mutate({
      stepKey: 'step8',
      inputs: {
        sub_function: 'generate_plan',
        productInfo,
        targetAudience,
        platform,
        experience,
      },
    });
  }

  function handleRetry() {
    if (!accountId || !productInfo || !platform || !experience) return;
    setResult(null);
    setIsFallback(false);
    saveMutation.mutate({
      stepKey: 'step8',
      inputs: { sub_function: 'generate_plan', productInfo, targetAudience, platform, experience },
    });
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-xl p-6 space-y-4 max-w-2xl"
      >
        {/* (1) Product textarea */}
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

        {/* (2) Audience input */}
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

        {/* (3) Platform radio */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_PLATFORM_RADIO_LABEL}
          </label>
          <PlatformInlineRadio value={platform} onChange={setPlatform} />
        </div>

        {/* (4) Experience radio — 3 buttons dual-line label+subtitle */}
        <div>
          <label className="block text-body-sm font-label text-on-surface mb-2">
            {STEP8_EXPERIENCE_RADIO_LABEL}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STEP8_EXPERIENCES_3.map((exp) => (
              <button
                key={exp.id}
                type="button"
                onClick={() => setExperience(exp.id)}
                className={cn(
                  'glass-card rounded-lg p-3 flex flex-col items-start text-left transition-colors',
                  experience === exp.id
                    ? 'border-primary bg-primary/10'
                    : 'hover:border-primary/40',
                )}
              >
                <span className="text-body-sm font-label text-on-surface">{exp.label}</span>
                <span className="text-body-xs text-muted-foreground">{exp.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={submitDisabled} className="w-full sm:w-auto">
          {saveMutation.isPending ? STEP8_GENERATE_LOADING_TEXT : STEP8_BUTTON_GENERATE_PLAN}
        </Button>
      </form>

      {/* AC-4: isFallback banner */}
      {result && isFallback && (
        <div
          data-testid="step8-generate-fallback-banner"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-body-sm text-amber-600"
        >
          AI 服务繁忙，以下为备用内容 · 建议稍后
          <button
            type="button"
            onClick={handleRetry}
            className="ml-2 underline hover:no-underline"
          >
            重试
          </button>
        </div>
      )}

      {/* AC-2: 6 模块输出 */}
      {result && (
        <div id="step8-generate-output" className="space-y-6" data-testid="step8-generate-output">
          {GENERATE_PLAN_MODULES.map((module) => (
            <div key={module.id} className="glass-card rounded-xl p-6">
              <h3 className="text-h3 font-display text-on-surface mb-3">{module.label}</h3>
              <p className="text-body-sm text-muted-foreground whitespace-pre-wrap">
                {result[module.id]}
              </p>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" type="button" onClick={handleRetry}>
              重新生成
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
