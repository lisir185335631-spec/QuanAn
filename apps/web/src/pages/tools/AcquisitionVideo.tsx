/**
 * AcquisitionVideo.tsx — /acquisition-video 获客型视频制作
 * 阶段2 接真: trpc.acquisitionVideo.generate
 * hasResult 门控 · 三态 + isFallback · IKB 红蓝紫渐变体系
 * 逻辑零改动 · testid 全保留 · 只换皮
 * 2026-06-04
 */

import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
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
  { label: '钩子力',   value: 90, color: C.ikb },
  { label: '痛点共鸣', value: 85, color: C.burgundy },
  { label: '信任塑造', value: 80, color: C.accent3 },
  { label: 'CTA引导',  value: 88, color: C.ikb },
  { label: '真实感',   value: 78, color: C.burgundy },
  { label: '转化预期', value: 82, color: C.accent3 },
];

const TREND_DATA_AV = [20, 35, 55, 72, 68, 85, 92, 80, 95, 88, 100, 96];
const TREND_LABELS_AV = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

// ── AcquisitionVideoResult component ─────────────────────────────────────────

interface AcquisitionVideoResultProps {
  result: AcquisitionVideoContent;
  isFallback: boolean;
}

function AcquisitionVideoResult({ result, isFallback }: AcquisitionVideoResultProps) {
  // Rotating accent colors for keyMessages badges
  const BADGE_COLORS: [string, string][] = [
    [C.ikb, '#fff'],
    [C.burgundy, '#fff'],
    [C.accent3, '#fff'],
  ];

  return (
    <section aria-label="获客方案结果" data-testid="av-result-panel">
      {/* isFallback 降级提示 */}
      {isFallback && (
        <div
          data-testid="av-fallback-notice"
          className="mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 text-[14px]"
          style={{ borderColor: `${C.accent3}40`, background: `${C.accent3}0a`, color: C.purpleText, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: C.accent3 }}>info</span>
          当前为降级结果，AI 模型暂时不可用，已使用备用方案。
        </div>
      )}

      {/* 获客脚本 */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: C.ikb }}>movie</span>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>获客视频脚本</h2>
        </div>
        <div
          data-testid="av-script"
          className="rounded-xl border p-6 ikb-hovercard"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper}, ${C.base})`, fontFamily: F.cn }}
        >
          <p className="whitespace-pre-line text-[14px] leading-relaxed" style={{ color: C.ink }}>{result.script}</p>
        </div>
      </div>

      {/* CTA 脚本 */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: C.burgundy }}>ads_click</span>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>行动号召 (CTA)</h2>
        </div>
        <div
          data-testid="av-cta-script"
          className="rounded-xl border p-5 ikb-hovercard"
          style={{ borderColor: `${C.burgundy}30`, background: `${C.burgundy}08`, fontFamily: F.cn }}
        >
          <p className="text-[14px] leading-relaxed" style={{ color: C.ink }}>{result.ctaScript}</p>
        </div>
      </div>

      {/* 转化路径 */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: C.accent3 }}>conversion_path</span>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>转化路径</h2>
        </div>
        <div
          data-testid="av-conversion-path"
          className="rounded-xl border p-5 ikb-hovercard"
          style={{ borderColor: `${C.accent3}30`, background: `${C.accent3}08`, fontFamily: F.cn }}
        >
          <p className="text-[14px] leading-relaxed" style={{ color: C.ink }}>{result.conversionPath}</p>
        </div>
      </div>

      {/* 核心卖点 keyMessages */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true} style={{ color: C.ikb }}>lightbulb</span>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>核心卖点</h2>
        </div>
        <div data-testid="av-key-messages" className="space-y-3">
          {result.keyMessages.map((msg, i) => {
            const [bg, fg] = BADGE_COLORS[i % 3]!;
            return (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border p-4 ikb-hovercard"
                style={{ borderColor: C.line, background: C.paper }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold"
                  style={{ backgroundColor: bg, color: fg, fontFamily: F.mono }}
                >
                  {i + 1}
                </span>
                <p className="text-[14px] leading-relaxed" style={{ color: C.ink, fontFamily: F.cn }}>{msg}</p>
              </div>
            );
          })}
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
      className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center"
      style={{ borderColor: C.line, background: C.base }}
    >
      <span className="material-symbols-outlined mb-4 text-[48px]" aria-hidden={true} style={{ color: '#6b7280' }}>
        movie
      </span>
      <p className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>填写左侧信息，点击「生成获客方案」</p>
      <p className="mt-2 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>AI 将为你生成转化导向的获客视频脚本</p>
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

  return (
    <IKBLayout>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
            >
              创作引擎
            </span>
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${C.burgundy}50`, background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
            >
              获客视频
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
            style={{ fontFamily: F.display }}
          >
            {ACQUISITION_VIDEO_H1}
          </h1>
          <p
            className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
            style={{ color: '#5A6173', fontFamily: F.cn }}
          >
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
            className="ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>auto_fix_high</span>
            智能优化
          </button>
          <button
            type="button"
            data-testid="av-copy-btn"
            disabled={!hasResult}
            onClick={handleCopyPlan}
            aria-label="复制方案"
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>download</span>
            复制方案
          </button>
        </div>
      </header>

      {/* ── loading banner ───────────────────────────────────── */}
      {isPending && (
        <div
          data-testid="av-loading-banner"
          className="mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 text-[14px]"
          style={{ borderColor: `${C.ikb}40`, background: `${C.ikb}0a`, color: C.ikb, fontFamily: F.cn }}
        >
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden={true}>
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
          className="mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 text-[14px]"
          style={{ borderColor: `${C.burgundy}40`, background: `${C.burgundy}08`, color: C.burgundyText, fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>error</span>
          生成失败，请检查网络后重试。
          <button
            type="button"
            onClick={handleGenerate}
            className="ikb-focusring ml-auto rounded-lg px-3 py-1 text-[12px] font-bold text-white"
            style={{ background: C.burgundy, fontFamily: F.mono }}
          >
            重试
          </button>
        </div>
      )}

      {/* ── 输入卡 ───────────────────────────────────────────── */}
      <section
        className="relative mb-12 overflow-hidden rounded-xl border p-6"
        style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper}, ${C.base})` }}
      >
        {/* 装饰光晕 — 浅 */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.ikb}08` }} />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl" style={{ background: `${C.burgundy}06` }} />

        <div className="relative mb-6 flex items-center justify-between border-b pb-5" style={{ borderColor: C.line }}>
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: C.grad }}
            >
              <span className="material-symbols-outlined" aria-hidden={true}>movie</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>获客信息</h2>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>填写行业与客户信息 · AI 据此生成精准获客视频方案</p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
          >
            <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
            待生成
          </span>
        </div>

        <div className="relative space-y-7">
          {/* 行业 · 可视化选择卡 */}
          <div>
            <p
              id="av-industry-label"
              className="mb-3 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide before:h-3.5 before:w-1 before:rounded-full before:content-['']"
              style={{ color: C.ink, fontFamily: F.cn, '--tw-gradient-from': C.ikb, '--tw-gradient-to': C.burgundy } as React.CSSProperties}
            >
              <span
                className="mr-1 inline-block h-3.5 w-1 rounded-full"
                style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                aria-hidden={true}
              />
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
                    data-state={active ? 'active' : 'inactive'}
                    className="ikb-focusring group relative flex items-center gap-2.5 overflow-hidden rounded-xl border p-3 text-left transition-all"
                    style={{
                      borderColor: active ? C.ikb : C.line,
                      background: active ? `${C.ikb}06` : C.paper,
                      boxShadow: active ? `0 0 0 1px ${C.ikb}40` : undefined,
                    }}
                  >
                    <span className="text-[20px]">{opt.label.split(' ')[0]}</span>
                    <span className="text-[13px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{opt.label.split(' ').slice(1).join(' ')}</span>
                    <span
                      className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full transition-all"
                      style={{
                        background: active ? C.ikb : 'transparent',
                        border: active ? 'none' : `1px solid ${C.line}`,
                        color: active ? '#fff' : 'transparent',
                      }}
                    >
                      <span className="material-symbols-outlined text-[12px]" aria-hidden={true}>check</span>
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
              className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
              style={{ color: C.ink, fontFamily: F.cn }}
            >
              <span
                className="inline-block h-3.5 w-1 rounded-full"
                style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                aria-hidden={true}
              />
              转化目标
            </label>
            <select
              id="av-conversion-goal"
              data-testid="av-conversion-goal-select"
              value={conversionGoal}
              onChange={(e) => setConversionGoal(e.target.value)}
              className="ikb-input ikb-focusring w-full rounded-xl border px-4 py-3 text-[14px] transition-all"
              style={{ borderColor: C.line, background: C.paper, color: C.ink, fontFamily: F.cn }}
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
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                  aria-hidden={true}
                />
                {ACQUISITION_VIDEO_CUSTOMER_LABEL}
                <span className="ml-1 font-normal text-[12px]" style={{ color: C.burgundyText }}>*</span>
              </label>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[14px]" aria-hidden={true} style={{ color: C.burgundy }}>auto_awesome</span>
                AI 据此精准定位受众
              </span>
            </div>
            <div
              className="overflow-hidden rounded-xl border transition-all focus-within:ring-1"
              style={{
                background: C.base,
                borderColor: customerProfileError ? C.burgundy : C.line,
                ['--tw-ring-color' as string]: customerProfileError ? C.burgundy : C.ikb,
              }}
            >
              <textarea
                id="av-customer-profile"
                data-testid="av-customer-profile-input"
                value={customerProfile}
                onChange={(e) => setCustomerProfile(e.target.value)}
                rows={3}
                placeholder="例如：想要创业的 25-40 岁宝妈，有积蓄但缺方向"
                className="ikb-input w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed"
                style={{ color: C.ink, fontFamily: F.cn }}
                required
              />
              <div
                className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
                style={{ borderColor: C.line, background: `${C.paper}99` }}
              >
                {customerProfileError ? (
                  <span data-testid="av-customer-profile-error" className="text-[11px]" style={{ color: C.burgundyText, fontFamily: F.cn }}>{customerProfileError}</span>
                ) : (
                  <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>可包含年龄段、职业、痛点、消费能力</span>
                )}
                <span className="shrink-0 text-[11px] tabular-nums" style={{ color: '#6b7280', fontFamily: F.mono }}>{customerProfile.length} 字</span>
              </div>
            </div>
          </div>

          {/* 产品亮点 · 框式编辑器 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="av-product-highlights"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                  aria-hidden={true}
                />
                {ACQUISITION_VIDEO_PRODUCT_LABEL}
                <span className="ml-1 font-normal text-[12px]" style={{ color: C.burgundyText }}>*</span>
              </label>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                <span className="material-symbols-outlined text-[14px]" aria-hidden={true} style={{ color: C.burgundy }}>auto_awesome</span>
                AI 据此塑造信任感
              </span>
            </div>
            <div
              className="overflow-hidden rounded-xl border transition-all focus-within:ring-1"
              style={{
                background: C.base,
                borderColor: productHighlightsError ? C.burgundy : C.line,
                ['--tw-ring-color' as string]: productHighlightsError ? C.burgundy : C.ikb,
              }}
            >
              <textarea
                id="av-product-highlights"
                data-testid="av-product-highlights-input"
                value={productHighlights}
                onChange={(e) => setProductHighlights(e.target.value)}
                rows={3}
                placeholder="例如：零基础可学、3个月回本、一对一指导"
                className="ikb-input w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed"
                style={{ color: C.ink, fontFamily: F.cn }}
                required
              />
              <div
                className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
                style={{ borderColor: C.line, background: `${C.paper}99` }}
              >
                {productHighlightsError ? (
                  <span data-testid="av-product-highlights-error" className="text-[11px]" style={{ color: C.burgundyText, fontFamily: F.cn }}>{productHighlightsError}</span>
                ) : (
                  <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>可包含核心优势、回本周期、服务保障</span>
                )}
                <span className="shrink-0 text-[11px] tabular-nums" style={{ color: '#6b7280', fontFamily: F.mono }}>{productHighlights.length} 字</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              data-testid="av-generate-btn"
              onClick={handleGenerate}
              disabled={isPending || !isFormValid}
              className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>movie</span>
              {ACQUISITION_VIDEO_CTA_GENERATE}
            </button>
          </div>
        </div>
      </section>

      {/* ── 数据洞察(雷达 + 趋势) · 示例/参考 ──────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
        <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· 行业参考数据 · 示例</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.line}80`, color: '#6b7280', fontFamily: F.mono }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#6b7280' }} />
          示例数据
        </span>
      </div>
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* 获客视频力雷达 */}
        <div
          className="col-span-5 rounded-xl border p-6 ikb-hovercard"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.ikb}12`, color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>获客视频力雷达</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>行业参考模型 · 示例</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>84</p>
              <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>参考分</p>
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
                  <linearGradient id="acq-radarFillAV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke={C.line} strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.line} strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#acq-radarFillAV)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 获客转化漏斗 / 注意力曲线 */}
        <div
          className="col-span-7 rounded-xl border p-6 ikb-hovercard"
          style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.burgundy}12`, color: C.burgundy }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>获客转化漏斗 / 注意力曲线</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>12 周行业参考预估 · 示例</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(['注意力', '互动', '转化'] as const).map((t, i) => (
                <span
                  key={t}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: i === 0 ? C.ikb : C.base,
                    color: i === 0 ? '#fff' : '#6b7280',
                    fontFamily: F.mono,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>96%</p>
            <span
              className="mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
              style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>+380%
            </span>
            <span className="mb-1 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>参考值 · 第 12 周</span>
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
                  <linearGradient id="acq-trendFillAV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                    <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="acq-trendLineAV" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={C.ikb} />
                    <stop offset="100%" stopColor={C.burgundy} />
                  </linearGradient>
                </defs>
                {[0, 0.33, 0.66, 1].map((f) => (
                  <line
                    key={f}
                    x1={padL}
                    x2={W - padR}
                    y1={(padT + innerH * f).toFixed(1)}
                    y2={(padT + innerH * f).toFixed(1)}
                    stroke={C.line}
                    strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#acq-trendFillAV)" />
                <path d={line} fill="none" stroke="url(#acq-trendLineAV)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((v, i) =>
                  i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                )}
              </svg>
            );
          })()}
          <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>
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
      <div className="flex items-center gap-3 border-t pt-6" style={{ borderColor: C.line }}>
        <p className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{ACQUISITION_VIDEO_FOOTER_FEEDBACK}</p>
        <button
          type="button"
          onClick={handleFeedbackUp}
          aria-label="有帮助"
          className="ikb-focusring flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
          style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>thumb_up</span>
        </button>
        <button
          type="button"
          onClick={handleFeedbackDown}
          aria-label="无帮助"
          className="ikb-focusring flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
          style={{ borderColor: C.line, background: C.paper, color: '#6b7280' }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>thumb_down</span>
        </button>
      </div>
    </IKBLayout>
  );
}
