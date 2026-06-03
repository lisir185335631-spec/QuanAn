/**
 * AcquisitionVideo.tsx — /acquisition-video 获客型视频制作
 * 阶段2 接真: trpc.acquisitionVideo.generate
 * hasResult 门控 · 三态 + isFallback · 先锋白 · 品牌三主色
 * 2026-06-02
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import {
  ACQUISITION_VIDEO_CTA_GENERATE,
  ACQUISITION_VIDEO_CUSTOMER_LABEL,
  ACQUISITION_VIDEO_FOOTER_FEEDBACK,
  ACQUISITION_VIDEO_H1,
  ACQUISITION_VIDEO_INDUSTRY_LABEL,
  ACQUISITION_VIDEO_PRODUCT_LABEL,
  ACQUISITION_VIDEO_SUBTITLE,
} from '@/lib/constants/acquisition-video';
import { trpc, type RouterOutputs } from '@/lib/trpc';

// ── RouterOutputs 推导真结果类型 ──────────────────────────────────────────────
type AcquisitionVideoHistoryRow = RouterOutputs['acquisitionVideo']['generate'];

// ── AcquisitionVideoContent — 从 content JSON 解析后的形状 ───────────────────
interface AcquisitionVideoContent {
  script: string;
  ctaScript: string;
  conversionPath: string;
  keyMessages: string[];
}

// ── parseContent — content JSON string → AcquisitionVideoContent (运行时守卫) ─
function parseContent(row: AcquisitionVideoHistoryRow | undefined): AcquisitionVideoContent | undefined {
  if (!row) return undefined;
  try {
    const parsed = JSON.parse(row.content) as unknown;
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !('script' in parsed) ||
      !('ctaScript' in parsed) ||
      !('conversionPath' in parsed) ||
      !('keyMessages' in parsed) ||
      typeof (parsed as AcquisitionVideoContent).script !== 'string' ||
      typeof (parsed as AcquisitionVideoContent).ctaScript !== 'string' ||
      typeof (parsed as AcquisitionVideoContent).conversionPath !== 'string' ||
      !Array.isArray((parsed as AcquisitionVideoContent).keyMessages)
    ) {
      return undefined;
    }
    const p = parsed as AcquisitionVideoContent;
    return {
      script: p.script,
      ctaScript: p.ctaScript,
      conversionPath: p.conversionPath,
      keyMessages: Array.isArray(p.keyMessages)
        ? p.keyMessages.filter((m): m is string => typeof m === 'string')
        : [],
    };
  } catch {
    return undefined;
  }
}

// ── Form state & constants ────────────────────────────────────────────────────

interface AcquisitionVideoFormData {
  industry: string;
  customerProfile: string;
  productHighlights: string;
  conversionGoal: string;
}

const DEFAULT_FORM: AcquisitionVideoFormData = {
  industry: 'beauty',
  customerProfile: '想要创业的3-45岁宝妈群体，有一定积蓄但缺乏方向',
  productHighlights: '零基础可学、3个月回本、一对一指导',
  conversionGoal: 'add_follower',
};

const INDUSTRY_OPTIONS = [
  { value: 'beauty',    label: '💅 美业' },
  { value: 'fitness',   label: '💪 健身' },
  { value: 'education', label: '📚 教育培训' },
  { value: 'food',      label: '🍔 餐饮' },
  { value: 'fashion',   label: '👗 时尚' },
  { value: 'tech',      label: '💻 科技' },
  { value: 'other',     label: '✨ 其他' },
];

const CONVERSION_GOAL_OPTIONS = [
  { value: 'add_follower',   label: '引流加粉' },
  { value: 'dm_consult',     label: '私信咨询' },
  { value: 'direct_sales',   label: '直接成交' },
  { value: 'brand_exposure', label: '品牌曝光' },
] as const;

// Minimum character length for text fields
const MIN_FIELD_LENGTH = 10;

// ── radar dims (decorative 示例) ──────────────────────────────────────────────

const RADAR_DIMS_AV = [
  { label: '钩子力',   value: 90, color: '#002fa7' },
  { label: '痛点共鸣', value: 85, color: '#781621' },
  { label: '信任塑造', value: 80, color: '#F6D300' },
  { label: 'CTA引导',  value: 88, color: '#002fa7' },
  { label: '真实感',   value: 78, color: '#781621' },
  { label: '转化预期', value: 82, color: '#F6D300' },
];

const TREND_DATA_AV = [20, 35, 55, 72, 68, 85, 92, 80, 95, 88, 100, 96];
const TREND_LABELS_AV = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

// ── AcquisitionVideoResult component ─────────────────────────────────────────

interface AcquisitionVideoResultProps {
  result: AcquisitionVideoContent;
  isFallback: boolean;
}

function AcquisitionVideoResult({ result, isFallback }: AcquisitionVideoResultProps) {
  return (
    <section aria-label="获客方案结果" data-testid="av-result-panel">
      {/* isFallback 降级提示 */}
      {isFallback && (
        <div
          data-testid="av-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#F3E08A] bg-[#fdf6cc] px-5 py-4 text-[14px] text-[#8a6a00]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">info</span>
          当前为降级结果，AI 模型暂时不可用，已使用备用方案。
        </div>
      )}

      {/* 获客脚本 */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">movie</span>
          <h2 className="text-[16px] font-bold text-[#111827]">获客视频脚本</h2>
        </div>
        <div
          data-testid="av-script"
          className="rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-[#eff4ff] via-white to-[#f7f1ff] p-6 pw-shadow-soft"
        >
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-[#1f2937]">{result.script}</p>
        </div>
      </div>

      {/* CTA 脚本 */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#781621]" aria-hidden="true">ads_click</span>
          <h2 className="text-[16px] font-bold text-[#111827]">行动号召 (CTA)</h2>
        </div>
        <div
          data-testid="av-cta-script"
          className="rounded-xl border border-[#781621]/20 bg-[#781621]/[0.04] p-5 pw-shadow-soft"
        >
          <p className="text-[14px] leading-relaxed text-[#1f2937]">{result.ctaScript}</p>
        </div>
      </div>

      {/* 转化路径 */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#8a6a00]" aria-hidden="true">conversion_path</span>
          <h2 className="text-[16px] font-bold text-[#111827]">转化路径</h2>
        </div>
        <div
          data-testid="av-conversion-path"
          className="rounded-xl border border-[#F3E08A] bg-[#fdf6cc] p-5 pw-shadow-soft"
        >
          <p className="text-[14px] leading-relaxed text-[#1f2937]">{result.conversionPath}</p>
        </div>
      </div>

      {/* 核心卖点 keyMessages */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">lightbulb</span>
          <h2 className="text-[16px] font-bold text-[#111827]">核心卖点</h2>
        </div>
        <div data-testid="av-key-messages" className="space-y-3">
          {result.keyMessages.map((msg, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 pw-shadow-soft">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold"
                style={{
                  backgroundColor: i % 3 === 0 ? '#002fa7' : i % 3 === 1 ? '#781621' : '#F6D300',
                  color: i % 3 === 2 ? '#221b00' : '#ffffff',
                }}
              >
                {i + 1}
              </span>
              <p className="text-[14px] leading-relaxed text-[#1f2937]">{msg}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── AcquisitionVideoEmptyState component ──────────────────────────────────────

function AcquisitionVideoEmptyState() {
  return (
    <div
      data-testid="av-empty-state"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafa] py-20 text-center"
    >
      <span className="material-symbols-outlined mb-4 text-[48px] text-[#9ca3af]" aria-hidden="true">
        movie
      </span>
      <p className="text-[16px] font-bold text-[#6b7280]">填写左侧信息，点击「生成获客方案」</p>
      <p className="mt-2 text-[13px] text-[#9ca3af]">AI 将为你生成转化导向的获客视频脚本</p>
    </div>
  );
}

// ── page component ─────────────────────────────────────────────────────────────

export default function AcquisitionVideo() {
  const [industry, setIndustry] = useState(DEFAULT_FORM.industry);
  const [customerProfile, setCustomerProfile] = useState(DEFAULT_FORM.customerProfile);
  const [productHighlights, setProductHighlights] = useState(DEFAULT_FORM.productHighlights);
  const [conversionGoal, setConversionGoal] = useState(DEFAULT_FORM.conversionGoal);

  // ── 最小字数校验错误 ───────────────────────────────────────────────────────
  const customerProfileError =
    customerProfile.trim().length > 0 && customerProfile.trim().length < MIN_FIELD_LENGTH
      ? `目标客户画像至少 ${MIN_FIELD_LENGTH} 字`
      : null;
  const productHighlightsError =
    productHighlights.trim().length > 0 && productHighlights.trim().length < MIN_FIELD_LENGTH
      ? `产品/服务卖点至少 ${MIN_FIELD_LENGTH} 字`
      : null;

  // 表单是否可提交
  const isFormValid =
    customerProfile.trim().length >= MIN_FIELD_LENGTH &&
    productHighlights.trim().length >= MIN_FIELD_LENGTH;

  // ── 真 generate mutation ────────────────────────────────────────────────────
  const generateMutation = trpc.acquisitionVideo.generate.useMutation({
    onSuccess: () => {
      toast.success('已生成获客方案');
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message || '生成失败，请重试');
    },
  });

  const isPending = generateMutation.isPending;
  const isError = generateMutation.isError;
  const historyRow: AcquisitionVideoHistoryRow | undefined = generateMutation.data;
  const acquisitionContent = parseContent(historyRow);
  const hasResult = acquisitionContent !== undefined;
  const isFallback = historyRow?.isFallback ?? false;

  function handleGenerate() {
    if (isPending) return;
    if (!isFormValid) return;
    // 将页面表单字段映射到 acquisitionVideoInput schema
    // sourceCopy: 汇合行业 + 客户画像 + 产品卖点 (用 value 避免 emoji 污染)
    const industryLabel = INDUSTRY_OPTIONS.find((o) => o.value === industry)?.label ?? industry;
    const goalLabel = CONVERSION_GOAL_OPTIONS.find((o) => o.value === conversionGoal)?.label ?? conversionGoal;
    const sourceCopy = `行业: ${industryLabel}\n目标客户: ${customerProfile}\n产品卖点: ${productHighlights}`;
    // conversionGoal: 用户选定的干净文案(无 emoji)
    const conversionGoalText = `${goalLabel}`;
    generateMutation.mutate({
      sourceCopy,
      conversionGoal: conversionGoalText,
    });
  }

  function handleFeedbackUp() { toast.success('感谢反馈!'); }
  function handleFeedbackDown() { toast.info('我们会持续改进'); }

  function handleCopyPlan() {
    if (!acquisitionContent) {
      toast.error('暂无方案可复制');
      return;
    }
    void navigator.clipboard
      .writeText(JSON.stringify(acquisitionContent, null, 2))
      .then(() => toast.success('已复制方案到剪贴板'))
      .catch(() => toast.error('复制失败'));
  }

  const btnSecondary =
    'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b] transition-colors hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <PioneerLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              创作引擎
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              获客视频
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {ACQUISITION_VIDEO_H1}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {ACQUISITION_VIDEO_SUBTITLE}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            aria-label="智能优化功能开发中"
            data-testid="av-optimize-btn"
            disabled
            onClick={() => toast.info('优化功能开发中')}
            className={btnSecondary}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            data-testid="av-copy-btn"
            disabled={!hasResult}
            onClick={handleCopyPlan}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
            复制方案
          </button>
        </div>
      </header>

      {/* ── loading banner ───────────────────────────────────── */}
      {isPending && (
        <div
          data-testid="av-loading-banner"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#dbe2ff] bg-[#eff4ff] px-5 py-4 text-[14px] text-[#002fa7]"
        >
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          AI 正在生成获客方案，大约需要 15-30 秒…
        </div>
      )}

      {/* ── error notice ─────────────────────────────────────── */}
      {isError && (
        <div
          data-testid="av-error-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#f5d0d4] bg-[#fef5f5] px-5 py-4 text-[14px] text-[#781621]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">error</span>
          生成失败，请检查网络后重试。
          <button
            type="button"
            onClick={handleGenerate}
            className="ml-auto rounded-lg bg-[#781621] px-3 py-1 text-[12px] font-bold text-white hover:bg-[#5a1018]"
          >
            重试
          </button>
        </div>
      )}

      {/* ── 输入卡 ───────────────────────────────────────────── */}
      <section className="relative mb-12 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />
        <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined" aria-hidden="true">movie</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">获客信息</h2>
              <p className="text-[12px] text-[#9ca3af]">填写行业与客户信息 · AI 据此生成精准获客视频方案</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            待生成
          </span>
        </div>

        <div className="relative space-y-7">
          {/* 行业 · 可视化选择卡 */}
          <div>
            <p id="av-industry-label" className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
              {ACQUISITION_VIDEO_INDUSTRY_LABEL}
            </p>
            <div role="group" aria-labelledby="av-industry-label" className="grid grid-cols-4 gap-3">
              {INDUSTRY_OPTIONS.map((opt) => {
                const active = industry === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setIndustry(opt.value)}
                    aria-pressed={active}
                    className={`group relative flex items-center gap-2.5 overflow-hidden rounded-xl border p-3 text-left transition-all ${active ? 'border-[#002fa7] bg-[#002fa7]/[0.04] shadow-sm' : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe] hover:bg-[#f8faff]'}`}
                  >
                    <span className="text-[20px]">{opt.label.split(' ')[0]}</span>
                    <span className="text-[13px] font-bold text-[#111827]">{opt.label.split(' ').slice(1).join(' ')}</span>
                    <span
                      className={`absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full transition-all ${active ? 'bg-[#002fa7] text-white' : 'border border-[#e5e7eb] bg-white text-transparent'}`}
                    >
                      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">check</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 转化目标 · 下拉选择 */}
          <div>
            <label
              htmlFor="av-conversion-goal"
              className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
            >
              转化目标
            </label>
            <select
              id="av-conversion-goal"
              data-testid="av-conversion-goal-select"
              value={conversionGoal}
              onChange={(e) => setConversionGoal(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-[14px] text-[#1b1b1b] outline-none transition-all focus:border-[#002fa7] focus:ring-1 focus:ring-[#002fa7]"
            >
              {CONVERSION_GOAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 客户画像 · 框式编辑器 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="av-customer-profile"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                {ACQUISITION_VIDEO_CUSTOMER_LABEL}
                <span className="ml-1 text-[#781621] font-normal text-[12px]">*</span>
              </label>
              <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                <span className="material-symbols-outlined text-[14px] text-[#781621]" aria-hidden="true">auto_awesome</span>
                AI 据此精准定位受众
              </span>
            </div>
            <div className={`overflow-hidden rounded-xl border bg-[#f9f9f9] transition-all focus-within:bg-white focus-within:ring-1 ${customerProfileError ? 'border-[#781621] focus-within:border-[#781621] focus-within:ring-[#781621]' : 'border-[#e5e7eb] focus-within:border-[#002fa7] focus-within:ring-[#002fa7]'}`}>
              <textarea
                id="av-customer-profile"
                data-testid="av-customer-profile-input"
                value={customerProfile}
                onChange={(e) => setCustomerProfile(e.target.value)}
                rows={3}
                placeholder="例如：想要创业的 25-40 岁宝妈，有积蓄但缺方向"
                className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                required
              />
              <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                {customerProfileError ? (
                  <span data-testid="av-customer-profile-error" className="text-[11px] text-[#781621]">{customerProfileError}</span>
                ) : (
                  <span className="text-[11px] text-[#9ca3af]">可包含年龄段、职业、痛点、消费能力</span>
                )}
                <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">{customerProfile.length} 字</span>
              </div>
            </div>
          </div>

          {/* 产品亮点 · 框式编辑器 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="av-product-highlights"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                {ACQUISITION_VIDEO_PRODUCT_LABEL}
                <span className="ml-1 text-[#781621] font-normal text-[12px]">*</span>
              </label>
              <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                <span className="material-symbols-outlined text-[14px] text-[#781621]" aria-hidden="true">auto_awesome</span>
                AI 据此塑造信任感
              </span>
            </div>
            <div className={`overflow-hidden rounded-xl border bg-[#f9f9f9] transition-all focus-within:bg-white focus-within:ring-1 ${productHighlightsError ? 'border-[#781621] focus-within:border-[#781621] focus-within:ring-[#781621]' : 'border-[#e5e7eb] focus-within:border-[#002fa7] focus-within:ring-[#002fa7]'}`}>
              <textarea
                id="av-product-highlights"
                data-testid="av-product-highlights-input"
                value={productHighlights}
                onChange={(e) => setProductHighlights(e.target.value)}
                rows={3}
                placeholder="例如：零基础可学、3个月回本、一对一指导"
                className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                required
              />
              <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                {productHighlightsError ? (
                  <span data-testid="av-product-highlights-error" className="text-[11px] text-[#781621]">{productHighlightsError}</span>
                ) : (
                  <span className="text-[11px] text-[#9ca3af]">可包含核心优势、回本周期、服务保障</span>
                )}
                <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">{productHighlights.length} 字</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              data-testid="av-generate-btn"
              onClick={handleGenerate}
              disabled={isPending || !isFormValid}
              className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">movie</span>
              {ACQUISITION_VIDEO_CTA_GENERATE}
            </button>
          </div>
        </div>
      </section>

      {/* ── 数据洞察(雷达 + 趋势) · 示例/参考 ──────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· 行业参考数据 · 示例</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#e5e7eb]/80 px-3 py-1 text-[12px] font-semibold text-[#6b7280]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
          示例数据
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 获客视频力雷达 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">获客视频力雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">行业参考模型 · 示例</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">84</p>
              <p className="text-[10px] text-[#9ca3af]">参考分</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_AV;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full">
                <defs>
                  <linearGradient id="radarFillAV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#radarFillAV)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (d.value / 100));
                  return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                })}
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R + 16);
                  return (
                    <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            );
          })()}
          <div className="mt-2 grid grid-cols-3 gap-y-2">
            {RADAR_DIMS_AV.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 获客转化漏斗 / 注意力曲线 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">获客转化漏斗 / 注意力曲线</h3>
                <p className="text-[11px] text-[#9ca3af]">12 周行业参考预估 · 示例</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {['注意力', '互动', '转化'].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? 'bg-[#002fa7] text-white' : 'bg-[#f1f3f9] text-[#6b7280]'}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none text-[#111827]">96%</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>+380%
            </span>
            <span className="mb-1 text-[12px] text-[#9ca3af]">参考值 · 第 12 周</span>
          </div>
          {(() => {
            const data = TREND_DATA_AV;
            const W = 560;
            const H = 168;
            const padL = 6;
            const padR = 6;
            const padT = 12;
            const padB = 8;
            const innerW = W - padL - padR;
            const innerH = H - padT - padB;
            const max = 110;
            const x = (i: number) => padL + (innerW * i) / (data.length - 1);
            const y = (v: number) => padT + innerH * (1 - v / max);
            const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
            const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <defs>
                  <linearGradient id="trendFillAV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trendLineAV" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#002fa7" />
                    <stop offset="100%" stopColor="#781621" />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line
                    key={f}
                    x1={padL}
                    x2={W - padR}
                    y1={(padT + innerH * f).toFixed(1)}
                    y2={(padT + innerH * f).toFixed(1)}
                    stroke="#f1f3f9"
                    strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#trendFillAV)" />
                <path d={line} fill="none" stroke="url(#trendLineAV)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) =>
                  i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {TREND_LABELS_AV.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 结果区 · hasResult 门控 ─────────────────────────────── */}
      {hasResult ? (
        <AcquisitionVideoResult result={acquisitionContent} isFallback={isFallback} />
      ) : (
        <AcquisitionVideoEmptyState />
      )}

      {/* ── 反馈 footer ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-[#eef1f6] pt-6">
        <p className="text-[13px] text-[#6b7280]">{ACQUISITION_VIDEO_FOOTER_FEEDBACK}</p>
        <button
          type="button"
          onClick={handleFeedbackUp}
          aria-label="有帮助"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-[#002fa7] hover:text-[#002fa7]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">thumb_up</span>
        </button>
        <button
          type="button"
          onClick={handleFeedbackDown}
          aria-label="无帮助"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-[#781621] hover:text-[#781621]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">thumb_down</span>
        </button>
      </div>
    </PioneerLayout>
  );
}
