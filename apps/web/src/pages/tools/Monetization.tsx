/**
 * Monetization.tsx — /tools/monetization IP 变现模型 · PRD-27 US-001 (D-259)
 * AC-3: useMutation → trpc.monetization.generate · 4 字段表单(spec §8.2.1)
 * AC-4: isFallback banner + toast.error on network error
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '@/lib/trpc';

// ── Inline types (no server import) ──────────────────────────────────────────

interface MonetizationToolResult {
  productMatrix: string[];
  pricingStrategy: string;
  conversionFunnel: string[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Monetization() {
  const [industryContext, setIndustryContext] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [audienceProfile, setAudienceProfile] = useState('');
  const [ipPositioning, setIpPositioning] = useState('');
  const [result, setResult] = useState<MonetizationToolResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const generateMutation = trpc.monetization.generate.useMutation({
    onSuccess(data) {
      try {
        const parsed = JSON.parse(data.content) as MonetizationToolResult;
        setResult(parsed);
        setIsFallback(data.isFallback);
      } catch {
        toast.error('生成失败 · 请重试');
      }
    },
    onError() {
      toast.error('生成失败 · 请重试');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setIsFallback(false);
    generateMutation.mutate({ industryContext, productDescription, audienceProfile, ipPositioning });
  }

  function handleRetry() {
    setResult(null);
    setIsFallback(false);
    generateMutation.mutate({ industryContext, productDescription, audienceProfile, ipPositioning });
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          变现设计
        </span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">IP 变现模型</h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          设计 IP 变现路径，从流量到收益的转化模型
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="m-industry" className="text-label-sm font-label text-on-surface">
            行业背景
          </label>
          <input
            id="m-industry"
            type="text"
            placeholder="例如：健康养生 / 职场技能 / 亲子教育"
            value={industryContext}
            onChange={e => setIndustryContext(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="monetization-industry"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="m-product" className="text-label-sm font-label text-on-surface">
            产品描述
          </label>
          <textarea
            id="m-product"
            placeholder="描述您的产品或服务，例如：线上减脂训练营，帮助职场女性 3 个月内健康减脂 10 斤"
            value={productDescription}
            onChange={e => setProductDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            data-testid="monetization-product"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="m-audience" className="text-label-sm font-label text-on-surface">
            目标受众
          </label>
          <input
            id="m-audience"
            type="text"
            placeholder="例如：25-35 岁职场女性，有减脂需求但时间有限"
            value={audienceProfile}
            onChange={e => setAudienceProfile(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="monetization-audience"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="m-ip" className="text-label-sm font-label text-on-surface">
            IP 定位
          </label>
          <input
            id="m-ip"
            type="text"
            placeholder="例如：专注职场减脂的营养师博主"
            value={ipPositioning}
            onChange={e => setIpPositioning(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="monetization-ip"
          />
        </div>
        <button
          type="submit"
          disabled={generateMutation.isPending}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-label-md font-label disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          data-testid="monetization-submit"
        >
          {generateMutation.isPending ? 'AI 生成中...' : '生成变现模型'}
        </button>
      </form>

      {/* Loading */}
      {generateMutation.isPending && (
        <div
          className="flex flex-col items-center gap-3 py-8"
          data-testid="monetization-loading"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-body-md text-muted-foreground">AI 生成中...</p>
        </div>
      )}

      {/* isFallback banner — AC-4 */}
      {result && isFallback && (
        <div
          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
          data-testid="monetization-fallback-banner"
        >
          <p className="text-body-sm text-muted-foreground">AI 暂时繁忙 · 显示备用方案</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md border border-border px-3 py-1.5 text-label-sm font-label text-muted-foreground hover:bg-muted/50 transition-colors"
            data-testid="monetization-retry"
          >
            重试
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6" data-testid="monetization-result">
          {/* Product Matrix */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">产品矩阵</h3>
            <ul className="space-y-2">
              {result.productMatrix.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-body-md text-on-surface"
                  data-testid={`monetization-product-item-${i}`}
                >
                  <span className="shrink-0 text-primary font-label">
                    {i + 1}.
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pricing Strategy */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">定价策略</h3>
            <p className="text-body-md text-on-surface" data-testid="monetization-pricing">
              {result.pricingStrategy}
            </p>
          </section>

          {/* Conversion Funnel */}
          <section className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-h3 font-display text-on-surface">转化路径</h3>
            <ol className="space-y-2">
              {result.conversionFunnel.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-body-md text-on-surface"
                  data-testid={`monetization-funnel-item-${i}`}
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-label-sm font-label flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </main>
  );
}
