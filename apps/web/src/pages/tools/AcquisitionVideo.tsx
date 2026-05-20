/**
 * AcquisitionVideo.tsx — /acquisition-video · PRD-25 US-006
 * AC-3: useMutation → trpc.acquisitionVideo.generate · loading spinner
 * AC-4: acquisition output 4 H4 sections (主题角度/钩子/内容结构/CTA)
 *        SHIELD: fields from VideoAgent.ts acquisition mode:
 *        router stores { script, ctaScript(=cta), conversionPath, keyMessages }
 * AC-5: isFallback banner + retry
 * AC-6: onError toast
 */
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import { INDUSTRIES } from '@/lib/constants/industries';
import { trpc } from '@/lib/trpc';

import type { ActiveAccountOutput } from '@quanan/clients/router-types';

// ── Inline type (no server import · SHIELD pattern) ───────────────────────────

interface AcquisitionContent {
  script?: string;
  ctaScript?: string;       // router renames cta → ctaScript (acquisitionVideo.ts AC-4)
  conversionPath?: string;
  keyMessages?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBTITLE = '专为获客设计的短视频方案，让精准客户主动找上门';

// ── Component ─────────────────────────────────────────────────────────────────

export default function AcquisitionVideo() {
  const { account } = useActiveAccount();
  const accountIndustry = (account as ActiveAccountOutput | null)?.industry ?? '';

  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [sellingPoints, setSellingPoints] = useState('');
  const [result, setResult] = useState<AcquisitionContent | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (accountIndustry && !industry) {
      setIndustry(accountIndustry);
    }
  }, [accountIndustry, industry]);

  const isDisabled = !industry || !audience.trim() || !sellingPoints.trim();

  const generateMutation = trpc.acquisitionVideo.generate.useMutation({
    onSuccess(data) {
      try {
        const parsed = JSON.parse(data.content) as AcquisitionContent;
        setResult(parsed);
        setIsFallback(data.isFallback);
      } catch {
        toast.error('解析失败 · 请稍后再试');
      }
    },
    onError() {
      toast.error('生成失败 · 请稍后再试');
    },
  });

  function buildInput() {
    // Compose sourceCopy from all form fields so it meets acquisitionVideoInput.sourceCopy.min(10)
    return {
      sourceCopy: `行业: ${industry}\n目标客户: ${audience}\n产品卖点: ${sellingPoints}`,
      conversionGoal: audience,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDisabled) return;
    setResult(null);
    setIsFallback(false);
    generateMutation.mutate(buildInput());
  }

  function handleRetry() {
    if (isDisabled) return;
    setResult(null);
    setIsFallback(false);
    generateMutation.mutate(buildInput());
  }

  // Map acquisition output fields to 4 H4 headings (SHIELD: 1:1 field mapping)
  const planData: Array<{ heading: string; content: string | undefined; testId: string }> = result
    ? [
        { heading: '主题角度', content: result.script, testId: 'acq-theme-angle' },
        {
          heading: '钩子',
          content: result.keyMessages?.join('\n'),
          testId: 'acq-hook',
        },
        { heading: '内容结构', content: result.conversionPath, testId: 'acq-content-structure' },
        { heading: 'CTA', content: result.ctaScript, testId: 'acq-cta' },
      ]
    : [];

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* Header — AC-1 字面锁 */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">获客型视频制作</h1>
        <p className="mt-2 text-body-md text-muted-foreground">{SUBTITLE}</p>
      </div>

      {/* Form — AC-2/3 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* industry dropdown */}
        <div className="space-y-1.5">
          <label className="text-label-sm font-label text-on-surface" htmlFor="acq-industry">
            选择行业
            <span className="ml-1 text-red-500">*</span>
          </label>
          <select
            id="acq-industry"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="acq-industry-select"
          >
            <option value="" disabled>📲 自媒体运营</option>
            {INDUSTRIES.map(ind => (
              <option key={ind.id} value={ind.label}>
                {ind.emoji} {ind.label}
              </option>
            ))}
          </select>
        </div>

        {/* audience textarea */}
        <div className="space-y-1.5">
          <label className="text-label-sm font-label text-on-surface" htmlFor="acq-audience">
            目标客户画像
            <span className="ml-1 text-red-500">*</span>
          </label>
          <textarea
            id="acq-audience"
            placeholder="描述您的理想客户，例如：想要创业的30-45岁宝妈群体，有一定积蓄但缺乏方向..."
            value={audience}
            onChange={e => setAudience(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            data-testid="acq-audience-textarea"
          />
        </div>

        {/* selling points textarea */}
        <div className="space-y-1.5">
          <label className="text-label-sm font-label text-on-surface" htmlFor="acq-selling-points">
            产品/服务卖点
            <span className="ml-1 text-red-500">*</span>
          </label>
          <textarea
            id="acq-selling-points"
            placeholder="描述您的核心卖点，例如：0基础可学、3个月回本、一对一指导..."
            value={sellingPoints}
            onChange={e => setSellingPoints(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            data-testid="acq-selling-points-textarea"
          />
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={isDisabled || generateMutation.isPending}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-label-md font-label disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {generateMutation.isPending ? 'AI 生成获客方案中...' : '生成获客方案'}
        </button>
      </form>

      {/* Loading — AC-3 spinner */}
      {generateMutation.isPending && (
        <div
          className="flex flex-col items-center gap-3 py-8"
          data-testid="acquisition-video-loading"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-body-md text-muted-foreground">AI 生成获客方案中...</p>
        </div>
      )}

      {/* isFallback banner — AC-5 */}
      {result && isFallback && (
        <div
          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
          data-testid="acquisition-video-fallback-banner"
        >
          <p className="text-body-sm text-muted-foreground">AI 暂未生成获客方案 · 显示备用模板</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md border border-border px-3 py-1.5 text-label-sm font-label text-muted-foreground hover:bg-muted/50 transition-colors"
            data-testid="acquisition-video-retry"
          >
            重试
          </button>
        </div>
      )}

      {/* Output — plan card with 4 H4 sections · AC-4 */}
      {result && (
        <div
          className="grid grid-cols-1 gap-4"
          data-testid="acquisition-video-output"
        >
          <div className="glass-card rounded-xl p-5 space-y-4">
            <p className="text-label-sm font-label text-primary uppercase tracking-wide">获客方案</p>
            {planData.map(({ heading, content, testId }) => (
              <div key={heading} className="space-y-1">
                <h4 className="text-h4 font-display text-on-surface">{heading}</h4>
                {content ? (
                  <p
                    className="text-body-sm text-on-surface whitespace-pre-line leading-relaxed"
                    data-testid={testId}
                  >
                    {content}
                  </p>
                ) : (
                  <p className="text-body-sm text-muted-foreground italic">暂无数据</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
