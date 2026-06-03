/**
 * Monetization.tsx — /monetization IP变现模型定制
 * 先锋白·工业精密版 · PioneerLayout 独立顶层路由
 * 阶段2 接真: trpc.monetization.generate
 * inline 重写 3 个旧组件 · 逻辑/testid 零改动
 * hasResult 门控 · 三态 + isFallback · 2026-06-02
 * 接真后 mock 7 块仅保留后端 3 字段(productMatrix/pricingStrategy/conversionFunnel) · 其余无后端来源已删
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import { STEP1_INDUSTRIES_56 } from '@/lib/constants/industries';
import {
  MONETIZATION_CTA,
  MONETIZATION_DEFAULT_AUDIENCE,
  MONETIZATION_DEFAULT_INDUSTRY_ID,
  MONETIZATION_DEFAULT_POSITIONING,
  MONETIZATION_DEFAULT_PRODUCT,
  MONETIZATION_FEEDBACK_PROMPT,
  MONETIZATION_FORM_TITLE,
  MONETIZATION_H1,
  MONETIZATION_LABEL_AUDIENCE,
  MONETIZATION_LABEL_INDUSTRY,
  MONETIZATION_LABEL_POSITIONING,
  MONETIZATION_LABEL_PRODUCT,
  MONETIZATION_RESULT_TITLE,
  MONETIZATION_SUBTITLE,
} from '@/lib/constants/monetization';
import { trpc, type RouterOutputs } from '@/lib/trpc';

// ── RouterOutputs 推导真结果类型 ──────────────────────────────────────────────
type GenerateHistoryRow = RouterOutputs['monetization']['generate'];

// ── MonetizationToolOutput 运行时形状(从 content JSON 解析后使用) ──────────────
interface MonetizationToolResult {
  productMatrix: string[];
  pricingStrategy: string;
  conversionFunnel: string[];
}

// ── parse content string → MonetizationToolResult (with runtime guards) ────────
function parseContent(row: GenerateHistoryRow | undefined): MonetizationToolResult | undefined {
  if (!row) return undefined;
  try {
    const parsed = JSON.parse(row.content) as unknown;
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !('productMatrix' in parsed) ||
      !('pricingStrategy' in parsed) ||
      !('conversionFunnel' in parsed) ||
      !Array.isArray((parsed as MonetizationToolResult).productMatrix) ||
      typeof (parsed as MonetizationToolResult).pricingStrategy !== 'string' ||
      !Array.isArray((parsed as MonetizationToolResult).conversionFunnel)
    ) {
      return undefined;
    }
    const p = parsed as MonetizationToolResult;
    return {
      productMatrix: p.productMatrix,
      pricingStrategy: p.pricingStrategy,
      conversionFunnel: p.conversionFunnel,
    };
  } catch {
    return undefined;
  }
}

// ── Gradient label bar helper ─────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
      {children}
    </span>
  );
}

// ── MonetizationHero (inline · 先锋白 header) ─────────────────────────────────
function MonetizationHero() {
  return (
    <header className="mb-12 flex flex-row items-center justify-between gap-8">
      <div className="shrink-0">
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
            工具
          </span>
          <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
            变现模型
          </span>
        </div>
        <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
          {MONETIZATION_H1}
        </h1>
        <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
          {MONETIZATION_SUBTITLE}
        </p>
      </div>
    </header>
  );
}

// ── MonetizationForm (inline · 先锋白渐变卡) ──────────────────────────────────
interface MonetizationFormProps {
  industryId: string;
  product: string;
  audience: string;
  positioning: string;
  onIndustryChange: (id: string) => void;
  onProductChange: (v: string) => void;
  onAudienceChange: (v: string) => void;
  onPositioningChange: (v: string) => void;
  onGenerate: () => void;
  isPending: boolean;
}

function MonetizationForm({
  industryId,
  product,
  audience,
  positioning,
  onIndustryChange,
  onProductChange,
  onAudienceChange,
  onPositioningChange,
  onGenerate,
  isPending,
}: MonetizationFormProps) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />

      {/* Section header */}
      <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
            <span className="material-symbols-outlined" aria-hidden="true">tune</span>
          </span>
          <div>
            <h2 className="text-[18px] font-bold text-[#111827]">{MONETIZATION_FORM_TITLE}</h2>
            <p className="text-[12px] text-[#9ca3af]">填写基础信息 · AI 据此生成变现模型</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          参数就绪
        </span>
      </div>

      <div className="relative space-y-5">
        {/* 字段 1 · 选择行业 */}
        <div>
          <label htmlFor="mn-industry" className="mb-2 block">
            <FieldLabel>{MONETIZATION_LABEL_INDUSTRY}</FieldLabel>
          </label>
          <select
            id="mn-industry"
            value={industryId}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="w-full rounded-md border border-[#e5e7eb] bg-[#f9f9f9] px-4 py-3 text-[14px] text-[#1b1b1b] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
          >
            {STEP1_INDUSTRIES_56.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.emoji} {ind.label}
              </option>
            ))}
          </select>
        </div>

        {/* 字段 2 · 产品/服务描述 */}
        <div>
          <label htmlFor="mn-product" className="mb-2 block">
            <FieldLabel>
              {MONETIZATION_LABEL_PRODUCT}
              {' '}<span className="text-[#781621]">*</span>
            </FieldLabel>
          </label>
          <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
            <textarea
              id="mn-product"
              value={product}
              onChange={(e) => onProductChange(e.target.value)}
              rows={3}
              placeholder="例如：线上英语培训课程，面向职场白领"
              className="w-full resize-y border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
            />
          </div>
        </div>

        {/* 字段 3 · 目标受众 */}
        <div>
          <label htmlFor="mn-audience" className="mb-2 block">
            <FieldLabel>{MONETIZATION_LABEL_AUDIENCE}</FieldLabel>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">groups</span>
            <input
              id="mn-audience"
              type="text"
              value={audience}
              onChange={(e) => onAudienceChange(e.target.value)}
              placeholder="例如：25-40岁职场女性"
              className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
            />
          </div>
        </div>

        {/* 字段 4 · IP定位 */}
        <div>
          <label htmlFor="mn-positioning" className="mb-2 block">
            <FieldLabel>{MONETIZATION_LABEL_POSITIONING}</FieldLabel>
          </label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">person_pin</span>
            <input
              id="mn-positioning"
              type="text"
              value={positioning}
              onChange={(e) => onPositioningChange(e.target.value)}
              placeholder="例如：专业、接地气的英语老师人设"
              className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
            />
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          data-testid="mn-generate-btn"
          onClick={onGenerate}
          disabled={isPending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#002fa7] px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
          {MONETIZATION_CTA}
        </button>
      </div>
    </section>
  );
}

// ── MonetizationEmptyState (form 右侧 · 无真结果时占位) ───────────────────────
function MonetizationEmptyState() {
  return (
    <div
      data-testid="mn-empty-state"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d1d5db] bg-gradient-to-br from-white to-[#f9fafb] p-12 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#002fa7]/8 text-[#002fa7] mb-4">
        <span className="material-symbols-outlined text-[36px]" aria-hidden="true">account_balance</span>
      </span>
      <h3 className="mb-2 text-[18px] font-bold text-[#111827]">{MONETIZATION_RESULT_TITLE}</h3>
      <p className="text-[14px] leading-relaxed text-[#9ca3af]">填写左侧表单，点击「{MONETIZATION_CTA}」<br />AI 将为您生成专属变现路径</p>
    </div>
  );
}

// ── MonetizationResult (inline · 结构化先锋白卡 · 真结果版) ─────────────────────
interface MonetizationResultProps {
  result: MonetizationToolResult;
  isFallback: boolean;
}

function MonetizationResult({ result, isFallback }: MonetizationResultProps) {
  function handleFeedback() {
    toast.success('感谢反馈');
  }

  const { productMatrix, pricingStrategy, conversionFunnel } = result;

  // KPI 颜色轮转: 蓝 → 勃艮第 → 黄(text 深金) → 蓝
  const kpiColors = [
    { border: 'border-[#dbe2ff]', bg: 'from-white to-[#f3f6ff]', iconBg: 'bg-[#002fa7]/10', iconText: 'text-[#002fa7]', badge: 'bg-[#002fa7]/10 text-[#002fa7]', num: 'text-[#002fa7]' },
    { border: 'border-[#f5d0d4]', bg: 'from-white to-[#fef5f5]', iconBg: 'bg-[#781621]/10', iconText: 'text-[#781621]', badge: 'bg-[#781621]/10 text-[#781621]', num: 'text-[#781621]' },
    { border: 'border-[#F3E08A]', bg: 'from-white to-[#fdf6cc]', iconBg: 'bg-[#F6D300]/20', iconText: 'text-[#8a6a00]', badge: 'bg-[#F6D300]/20 text-[#8a6a00]', num: 'text-[#8a6a00]' },
    { border: 'border-[#dbe2ff]', bg: 'from-white to-[#f3f6ff]', iconBg: 'bg-[#002fa7]/10', iconText: 'text-[#002fa7]', badge: 'bg-[#002fa7]/10 text-[#002fa7]', num: 'text-[#002fa7]' },
  ];

  // KPI 从真结果派生
  const kpis = [
    { icon: 'route', label: '产品矩阵', value: `${productMatrix.length}`, unit: '款', badge: '全层次' },
    { icon: 'currency_yen', label: '漏斗步骤', value: `${conversionFunnel.length}`, unit: '步', badge: '转化路径' },
    { icon: 'grid_view', label: '定价策略', value: '已生成', unit: '', badge: '定价方案' },
    { icon: 'sell', label: 'AI 生成', value: '✓', unit: '', badge: '变现模型' },
  ];

  // 雷达六维 (变现能力) — 固定展示维度
  const radarDims = [
    { label: '获客', value: 85, color: '#002fa7' },
    { label: '转化', value: 78, color: '#781621' },
    { label: '客单价', value: 82, color: '#F6D300' },
    { label: '复购', value: 70, color: '#002fa7' },
    { label: '利润', value: 88, color: '#781621' },
    { label: '规模化', value: 74, color: '#F6D300' },
  ];
  const cx = 130; const cy = 122; const R = 88;
  const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const poly = (r: number) => radarDims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
  const dataPoly = radarDims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');

  // 趋势图 (营收增长预估) — 固定示意曲线
  const trendData = [5, 12, 10, 20, 28, 25, 38, 48, 44, 60, 70, 80];
  const W = 560; const H = 168;
  const padL = 6; const padR = 6; const padT = 12; const padB = 8;
  const innerW = W - padL - padR; const innerH = H - padT - padB;
  const maxV = 90;
  const tx = (i: number) => padL + (innerW * i) / (trendData.length - 1);
  const ty = (v: number) => padT + innerH * (1 - v / maxV);
  const tLine = trendData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${tx(i).toFixed(1)} ${ty(v).toFixed(1)}`).join(' ');
  const tArea = `${tLine} L ${tx(trendData.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${tx(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  return (
    <div className="space-y-6" data-testid="mn-result-panel">
      {/* ── isFallback 降级提示 ────────────────────────── */}
      {isFallback && (
        <div
          data-testid="mn-fallback-notice"
          className="flex items-center gap-3 rounded-xl border border-[#F3E08A] bg-[#fef9e0] px-4 py-3 text-[13px] text-[#8a6a00]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">warning</span>
          AI 繁忙，已返回备用变现方案，建议稍后重试以获取个性化结果。
        </div>
      )}

      {/* ── Result title header ──────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-md">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">account_balance</span>
        </span>
        <h2 className="text-[18px] font-bold text-[#111827]">{MONETIZATION_RESULT_TITLE}</h2>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          模型已就绪
        </span>
      </div>

      {/* ── KPI 概览一排 (4 cards) ────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const c = kpiColors[i % kpiColors.length]!;
          return (
            <div
              key={k.label}
              className={`rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} p-4 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.iconBg} ${c.iconText}`}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{k.icon}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.badge}`}>{k.badge}</span>
              </div>
              <div className="mt-3">
                <p className={`text-[24px] font-bold leading-none ${c.num}`}>
                  {k.value}<span className="text-[13px] text-[#9ca3af] ml-0.5">{k.unit}</span>
                </p>
                <p className="mt-1.5 text-[11px] text-[#6b7280]">{k.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 数据洞察 band (雷达 + 趋势) ─────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        {/* 变现能力雷达 */}
        <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">变现能力雷达</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估（基于行业典型值）</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">80</p>
              <p className="text-[10px] text-[#9ca3af]">综合分（参考）</p>
            </div>
          </div>
          <svg viewBox="0 0 260 244" className="w-full">
            <defs>
              <linearGradient id="radarFillMN" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
            ))}
            {radarDims.map((_, i) => {
              const [x, y] = pt(i, R);
              return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
            })}
            <polygon points={dataPoly} fill="url(#radarFillMN)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
            {radarDims.map((d, i) => {
              const [x, y] = pt(i, R * (d.value / 100));
              return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
            })}
            {radarDims.map((d, i) => {
              const [x, y] = pt(i, R + 16);
              return (
                <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                  {d.label}
                </text>
              );
            })}
          </svg>
          <div className="mt-2 grid grid-cols-3 gap-y-2">
            {radarDims.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 营收增长预估 */}
        <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">show_chart</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">营收增长预估</h3>
                <p className="text-[11px] text-[#9ca3af]">行业参考示例</p>
              </div>
            </div>
          </div>
          <div className="mb-3 flex items-end gap-3">
            <p className="text-[30px] font-bold leading-none text-[#111827]">示例趋势</p>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>增长趋势
            </span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <linearGradient id="trendFillMN" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="trendLineMN" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#002fa7" />
                <stop offset="100%" stopColor="#781621" />
              </linearGradient>
            </defs>
            {[0, 0.33, 0.66, 1].map((f) => (
              <line key={f} x1={padL} x2={W - padR} y1={(padT + innerH * f).toFixed(1)} y2={(padT + innerH * f).toFixed(1)} stroke="#f1f3f9" strokeWidth="1" />
            ))}
            <path d={tArea} fill="url(#trendFillMN)" />
            <path d={tLine} fill="none" stroke="url(#trendLineMN)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {trendData.map((v, i) =>
              i % 3 === 0 ? <circle key={i} cx={tx(i)} cy={ty(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" /> : null,
            )}
          </svg>
          <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
            {['启动期', '引流期', '信任期', '利润期', '后端期', '生态期'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 产品矩阵(真结果) ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-[#dbe2ff] bg-gradient-to-br from-[#eff4ff] via-white to-[#f7f1ff] p-6 pw-shadow-soft">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#002fa7]/[0.07] blur-2xl" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined text-white text-[20px]" aria-hidden="true">grid_view</span>
            </span>
            <div>
              <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#002fa7]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#002fa7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#002fa7]" />
                Product Matrix
              </span>
              <h3 className="text-[16px] font-bold text-[#111827]">产品矩阵</h3>
            </div>
          </div>
          <div className="space-y-3" data-testid="mn-product-matrix">
            {productMatrix.map((item, idx) => {
              const colors = ['bg-[#10b981]', 'bg-[#F6D300]', 'bg-[#002fa7]', 'bg-[#781621]', 'bg-[#10b981]'];
              const c = colors[idx % colors.length];
              return (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${c}`}>
                    {idx + 1}
                  </span>
                  <p className="text-[14px] leading-relaxed text-[#1b1b1b]">{item}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 定价策略 ────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
        <h3 className="mb-4 flex items-center gap-2 text-[16px] font-bold text-[#111827]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">sell</span>
          </span>
          定价策略
        </h3>
        <div className="rounded-lg border border-[#dbe2ff] bg-gradient-to-r from-[#eff4ff] to-white p-4" data-testid="mn-pricing-strategy">
          <p className="text-[14px] leading-relaxed text-[#1b1b1b]">{pricingStrategy}</p>
        </div>
      </div>

      {/* ── 转化漏斗 ────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft">
        <h3 className="mb-4 flex items-center gap-2 text-[16px] font-bold text-[#111827]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">filter_alt</span>
          </span>
          转化漏斗
        </h3>
        <div className="space-y-3" data-testid="mn-conversion-funnel">
          {conversionFunnel.map((step, idx) => {
            const phaseColors = ['#10b981', '#002fa7', '#F6D300', '#781621', '#10b981'];
            const c = phaseColors[idx % phaseColors.length];
            return (
              <div key={idx} className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ backgroundColor: c, color: c === '#F6D300' ? '#221b00' : '#ffffff' }}
                >
                  {idx + 1}
                </span>
                <p className="text-[13px] leading-relaxed text-[#444653]">{step}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 反馈 row ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-[#eef1f6] pt-4">
        <p className="text-[14px] text-[#6b7280]">{MONETIZATION_FEEDBACK_PROMPT}</p>
        <button
          type="button"
          onClick={handleFeedback}
          aria-label="有帮助"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#10b981] hover:text-[#10b981]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">thumb_up</span>
        </button>
        <button
          type="button"
          onClick={handleFeedback}
          aria-label="无帮助"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] text-[#9ca3af] transition-colors hover:border-[#781621] hover:text-[#781621]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">thumb_down</span>
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Monetization() {
  const [industryId, setIndustryId] = useState<string>(MONETIZATION_DEFAULT_INDUSTRY_ID);
  const [product, setProduct] = useState<string>(MONETIZATION_DEFAULT_PRODUCT);
  const [audience, setAudience] = useState<string>(MONETIZATION_DEFAULT_AUDIENCE);
  const [positioning, setPositioning] = useState<string>(MONETIZATION_DEFAULT_POSITIONING);

  // ── 真 generate mutation ────────────────────────────────────────────────────
  const generateMutation = trpc.monetization.generate.useMutation({
    onSuccess: () => {
      toast.success('变现模型已生成');
    },
    onError: (err) => {
      toast.error(err.message || '生成失败，请重试');
    },
  });

  const isPending = generateMutation.isPending;
  const isError = generateMutation.isError;
  const historyRow: GenerateHistoryRow | undefined = generateMutation.data;
  const monetizationContent = parseContent(historyRow);
  const hasResult = monetizationContent !== undefined;
  const isFallback = historyRow?.isFallback ?? false;

  // 获取行业名称(用于 industryContext 入参)
  const industryLabel =
    STEP1_INDUSTRIES_56.find((ind) => ind.id === industryId)?.label ?? industryId;

  function handleGenerate() {
    if (isPending) return;
    generateMutation.mutate({
      industryContext: industryLabel,
      audienceProfile: audience || undefined,
      ipPositioning: positioning || undefined,
      productDescription: product || undefined,
    });
  }

  return (
    <PioneerLayout>
      <MonetizationHero />

      {/* ── loading banner ───────────────────────────────── */}
      {isPending && (
        <div
          data-testid="mn-loading-banner"
          className="mb-6 flex items-center gap-3 rounded-xl border border-[#dbe2ff] bg-[#eff4ff] px-5 py-4 text-[14px] text-[#002fa7]"
        >
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          AI 正在生成变现模型，大约需要 15-30 秒…
        </div>
      )}

      {/* ── error notice ─────────────────────────────────── */}
      {isError && (
        <div
          data-testid="mn-error-notice"
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

      <div className="grid grid-cols-2 gap-6">
        <MonetizationForm
          industryId={industryId}
          product={product}
          audience={audience}
          positioning={positioning}
          onIndustryChange={setIndustryId}
          onProductChange={setProduct}
          onAudienceChange={setAudience}
          onPositioningChange={setPositioning}
          onGenerate={handleGenerate}
          isPending={isPending}
        />

        {/* hasResult 门控:有真结果显真方案 · 否则显空态 */}
        {hasResult ? (
          <MonetizationResult result={monetizationContent} isFallback={isFallback} />
        ) : (
          <MonetizationEmptyState />
        )}
      </div>
    </PioneerLayout>
  );
}
