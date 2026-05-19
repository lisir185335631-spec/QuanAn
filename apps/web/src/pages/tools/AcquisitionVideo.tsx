/**
 * AcquisitionVideo.tsx — /acquisition-video · PRD-23 US-007
 * Stub: local state form (no tRPC) + 3-plan grid output
 * AC-1: H1 '获客型视频制作' + subtitle 字面锁
 * AC-2: select '选择行业' (default from account.industry) + 2 textareas
 * AC-3: CTA '生成获客方案' disabled if !industry || !audience || !sellingPoints
 * AC-4: stub 3 方案 grid · 每方案 4 H4(主题角度/钩子/内容结构/CTA)
 * AC-5: industry default from useActiveAccount().industry
 */
import { useEffect, useState } from 'react';

import { useActiveAccount } from '@/hooks/useActiveAccount';
import { INDUSTRIES } from '@/lib/constants/industries';

import type { ActiveAccountOutput } from '@quanan/clients/router-types';

const SUBTITLE = '专为获客设计的短视频方案，让精准客户主动找上门';

const PLAN_HEADINGS = ['主题角度', '钩子', '内容结构', 'CTA'] as const;

const STUB_PLANS = [
  { label: '方案一' },
  { label: '方案二' },
  { label: '方案三' },
] as const;

export default function AcquisitionVideo() {
  const { account } = useActiveAccount();
  const accountIndustry = (account as ActiveAccountOutput | null)?.industry ?? '';

  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [sellingPoints, setSellingPoints] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // AC-5: sync default industry from account (async load in real browser)
  useEffect(() => {
    if (accountIndustry && !industry) {
      setIndustry(accountIndustry);
    }
  }, [accountIndustry]);

  const isDisabled = !industry || !audience.trim() || !sellingPoints.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDisabled) return;
    setSubmitted(true);
  }

  return (
    <main className="flex-1 container py-8 space-y-8">
      {/* Header — AC-1 */}
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">内容创作</span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">获客型视频制作</h1>
        <p className="mt-2 text-body-md text-muted-foreground">{SUBTITLE}</p>
      </div>

      {/* Form — AC-2/3 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* AC-2(1): industry dropdown */}
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

        {/* AC-2(2): audience textarea */}
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

        {/* AC-2(3): selling points textarea */}
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

        {/* AC-3: CTA */}
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-label-md font-label disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          生成获客方案
        </button>
      </form>

      {/* AC-4: stub 3-plan grid */}
      {submitted && (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          data-testid="acquisition-video-output"
        >
          {STUB_PLANS.map(({ label }) => (
            <div key={label} className="glass-card rounded-xl p-5 space-y-4">
              <p className="text-label-sm font-label text-primary uppercase tracking-wide">{label}</p>
              {PLAN_HEADINGS.map(heading => (
                <div key={heading} className="space-y-1">
                  <h4 className="text-h4 font-display text-on-surface">{heading}</h4>
                  <p className="text-body-sm text-muted-foreground italic">AI 生成中…</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
