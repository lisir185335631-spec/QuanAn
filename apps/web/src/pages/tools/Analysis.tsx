/**
 * Analysis.tsx — /analysis · 文案结构分析
 * 先锋白·工业精密版 · PioneerLayout · inline 软卡 · 逻辑零改动
 * 样板: VideoAnalysis.tsx + Step3.tsx
 */
import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
import {
  ANALYSIS_CONS,
  ANALYSIS_CONS_TITLE,
  ANALYSIS_CTA,
  ANALYSIS_DEFAULT_COPY,
  ANALYSIS_DIMENSIONS,
  ANALYSIS_DIMENSIONS_TITLE,
  ANALYSIS_ELEMENTS,
  ANALYSIS_ELEMENTS_TITLE,
  ANALYSIS_FEEDBACK_PROMPT,
  ANALYSIS_H1,
  ANALYSIS_OVERALL_LABEL,
  ANALYSIS_OVERALL_SCORE,
  ANALYSIS_PROS,
  ANALYSIS_PROS_TITLE,
  ANALYSIS_STRUCTURE,
  ANALYSIS_STRUCTURE_TITLE,
  ANALYSIS_SUBTITLE,
  ANALYSIS_SUGGESTIONS,
  ANALYSIS_SUGGESTIONS_TITLE,
} from '@/lib/constants/analysis';

// ── Radar dims derived from ANALYSIS_DIMENSIONS ───────────────────────────────
// map 5 analysis dims → 6 radar dims (ANALYSIS_DIMENSIONS has exactly 5 entries per constants)
const RADAR_DIMS_AN = [
  { label: '开头吸引力', value: ANALYSIS_DIMENSIONS[0]!.score, color: '#002fa7' },
  { label: '情感张力',   value: ANALYSIS_DIMENSIONS[1]!.score, color: '#781621' },
  { label: '节奏感',     value: ANALYSIS_DIMENSIONS[2]!.score, color: '#F6D300' },
  { label: '完播率预测', value: ANALYSIS_DIMENSIONS[3]!.score, color: '#002fa7' },
  { label: '爆款元素运用', value: ANALYSIS_DIMENSIONS[4]!.score, color: '#781621' },
  { label: '综合评分',   value: ANALYSIS_OVERALL_SCORE,        color: '#F6D300' },
] as const;

// ── Main Component ────────────────────────────────────────────────────────────

export default function Analysis() {
  const [copy, setCopy] = useState<string>(ANALYSIS_DEFAULT_COPY);

  function handleAnalyze() {
    toast.success('分析完成');
  }

  function handleFeedbackUp() {
    toast.success('感谢反馈!');
  }

  function handleFeedbackDown() {
    toast.info('我们会持续改进');
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  return (
    <PioneerLayout>
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
              工具
            </span>
            <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
              拆解器
            </span>
          </div>
          <h1 className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]">
            {ANALYSIS_H1}
          </h1>
          <p className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]">
            {ANALYSIS_SUBTITLE}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!copy.trim()}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-[#002fa7]/25 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">analytics</span>
            重新分析
          </button>
        </div>
      </header>

      {/* ── 使用方法提示卡 ───────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-[#dbe2ff] bg-[#002fa7]/5 p-4">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-[#002fa7]" aria-hidden="true">info</span>
        <p className="text-[14px] leading-relaxed text-[#1b2a5e]">
          <span className="font-bold">使用方法：</span>
          粘贴任意短视频文案/口播稿 → AI 将从结构、节奏、爆款元素等多维度深度分析
        </p>
      </div>

      {/* ── 输入卡 (AnalysisInputCard) ───────────────────────────────────────── */}
      <section
        data-testid="analysis-input-card"
        className="relative mb-12 overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />

        <div className="relative mb-6 flex items-center justify-between border-b border-[#eef1f6] pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
              <span className="material-symbols-outlined" aria-hidden="true">content_paste_search</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-[#111827]">输入文案内容</h2>
              <p className="text-[12px] text-[#9ca3af]">粘贴短视频文案 · AI 多维度深度分析</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            待分析
          </span>
        </div>

        <div className="relative">
          {/* 文案 textarea */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="an-copy"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                文案内容 <span className="ml-1 text-[#781621]">*</span>
              </label>
              <span className="flex items-center gap-1 text-[11px] text-[#9ca3af]" aria-hidden="true">
                <span className="material-symbols-outlined text-[14px] text-[#781621]">auto_awesome</span>
                AI 据此深度拆解
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
              <textarea
                id="an-copy"
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                rows={10}
                placeholder="粘贴短视频文案/口播稿"
                className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
              />
              <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#9ca3af]">支持</span>
                  {['口播稿', '字幕', '描述文案', '评论区文案'].map((t) => (
                    <span key={t} className="rounded-full bg-[#f1f3f9] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280]">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-[#9ca3af]">{copy.length} 字</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!copy.trim()}
              className="flex items-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">analytics</span>
              {ANALYSIS_CTA}
            </button>
          </div>
        </div>
      </section>

      {/* ── 数据洞察 band ────────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">insights</span>
        <h2 className="text-[16px] font-bold text-[#111827]">数据洞察</h2>
        <span className="text-[12px] text-[#9ca3af]">· AI 综合评估 · 实时测算</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
          模型已就绪
        </span>
      </div>

      {/* ── 雷达 + KPI 一行 ──────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* AnalysisDimensions · 先锋白雷达 · col-span-5 */}
        <div
          data-testid="analysis-dimensions"
          className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft"
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">{ANALYSIS_DIMENSIONS_TITLE}</h3>
                <p className="text-[11px] text-[#9ca3af]">六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-bold leading-none text-[#002fa7]">
                {ANALYSIS_OVERALL_SCORE}
              </p>
              <p className="text-[10px] text-[#9ca3af]">{ANALYSIS_OVERALL_LABEL}</p>
            </div>
          </div>
          {(() => {
            const dims = RADAR_DIMS_AN;
            const cx = 130;
            const cy = 122;
            const R = 88;
            const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
            const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
            const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
            const dataPoly = dims.map((d, i) => pt(i, R * (Math.min(d.value, 100) / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
            return (
              <svg viewBox="0 0 260 244" className="w-full">
                <defs>
                  <linearGradient id="radarFillAN" x1="0" y1="0" x2="0" y2="1">
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
                <polygon points={dataPoly} fill="url(#radarFillAN)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
                {dims.map((d, i) => {
                  const [x, y] = pt(i, R * (Math.min(d.value, 100) / 100));
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
            {RADAR_DIMS_AN.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AnalysisScoreCard + KPI 卡 · col-span-7 */}
        <div className="col-span-7 flex flex-col gap-6">
          {/* 综合评分大卡 */}
          <div
            data-testid="analysis-score-card"
            className="flex-1 rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-6 pw-shadow-soft"
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">grade</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">{ANALYSIS_OVERALL_LABEL}</h3>
                <p className="text-[11px] text-[#9ca3af]">综合 AI 评估</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
                已分析
              </span>
            </div>
            <div className="flex items-end gap-6">
              <div>
                <p className="text-[64px] font-bold leading-none text-[#111827]">
                  {ANALYSIS_OVERALL_SCORE}
                  <span className="text-[24px] text-[#9ca3af]">/100</span>
                </p>
              </div>
              {/* 环形进度 */}
              <div className="h-20 w-20 shrink-0">
                <svg viewBox="0 0 36 36" className="-rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#002fa7"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(100, ANALYSIS_OVERALL_SCORE)} 100`}
                  />
                </svg>
              </div>
            </div>
            {/* 维度评分 bars */}
            <div className="mt-4 space-y-2.5">
              {ANALYSIS_DIMENSIONS.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="w-[90px] shrink-0 text-[12px] text-[#6b7280]">{d.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f1f3f9]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#002fa7] to-[#3654c8]"
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[12px] font-bold text-[#111827]">{d.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 小 KPI 一排 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 爆款元素数 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 pw-shadow-soft">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">stars</span>
                </span>
                <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[10px] font-bold text-[#781621]">已提取</span>
              </div>
              <p className="mt-3 text-[24px] font-bold leading-none text-[#111827]">
                {ANALYSIS_ELEMENTS.length}
                <span className="text-[13px] text-[#9ca3af]"> 个</span>
              </p>
              <p className="mt-1 text-[11px] text-[#6b7280]">爆款元素</p>
            </div>
            {/* 优点数 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 pw-shadow-soft">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10b981]/10 text-[#10b981]">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>
                </span>
                <span className="rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-bold text-[#10b981]">优点</span>
              </div>
              <p className="mt-3 text-[24px] font-bold leading-none text-[#111827]">
                {ANALYSIS_PROS.length}
                <span className="text-[13px] text-[#9ca3af]"> 条</span>
              </p>
              <p className="mt-1 text-[11px] text-[#6b7280]">亮点</p>
            </div>
            {/* 建议数 */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 pw-shadow-soft">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">lightbulb</span>
                </span>
                <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[10px] font-bold text-[#8a6a00]">建议</span>
              </div>
              <p className="mt-3 text-[24px] font-bold leading-none text-[#111827]">
                {ANALYSIS_SUGGESTIONS.length}
                <span className="text-[13px] text-[#9ca3af]"> 条</span>
              </p>
              <p className="mt-1 text-[11px] text-[#6b7280]">优化建议</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 解析结果区 ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6">

        {/* ── AnalysisStructure · 结构拆解 ─────────────────────────────────── */}
        <section
          data-testid="analysis-structure"
          className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft"
        >
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#F6D300] to-[#e8c800] px-6 py-4 text-[#221b00]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221b00]/10">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">timeline</span>
            </span>
            <h3 className="text-[16px] font-bold">{ANALYSIS_STRUCTURE_TITLE}</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {ANALYSIS_STRUCTURE.map((it, idx) => {
                // 品牌三色轮转: 0→蓝, 1→勃艮第, 2→暖黄(深字), 3→蓝
                const palette = [
                  { bg: '#002fa7', badgeBg: '#002fa7', text: '#ffffff', badgeText: '#ffffff' },
                  { bg: '#781621', badgeBg: '#781621', text: '#ffffff', badgeText: '#ffffff' },
                  { bg: '#F6D300', badgeBg: '#F6D300', text: '#221b00', badgeText: '#221b00' },
                  { bg: '#002fa7', badgeBg: '#002fa7', text: '#ffffff', badgeText: '#ffffff' },
                ] as const;
                const { bg, badgeBg, text, badgeText } = palette[idx % palette.length]!;
                return (
                  <div key={it.stage} className="overflow-hidden rounded-xl border border-[#eef1f6] bg-[#f9faff]">
                    <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ backgroundColor: bg }}>
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                          style={{ backgroundColor: `rgba(255,255,255,0.18)`, color: text }}
                        >
                          {idx + 1}
                        </span>
                        <h4 className="text-[15px] font-bold" style={{ color: text }}>{it.stage}</h4>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold"
                        style={{ backgroundColor: badgeBg, color: badgeText, border: `1px solid rgba(255,255,255,0.25)` }}
                      >
                        {it.score}分
                      </span>
                    </div>
                    <div className="p-4">
                      {it.type !== undefined && (
                        <p className="mb-1.5 text-[12px] text-[#6b7280]">类型：{it.type}</p>
                      )}
                      <p className="text-[14px] leading-relaxed text-[#374151]">{it.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── AnalysisElements · 识别到的爆款元素 ─────────────────────────── */}
        <section
          data-testid="analysis-elements"
          className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft"
        >
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#002fa7] to-[#781621] px-6 py-4 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">stars</span>
            </span>
            <h3 className="text-[16px] font-bold">{ANALYSIS_ELEMENTS_TITLE}</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {ANALYSIS_ELEMENTS.map((e) => (
                <span
                  key={e}
                  className="rounded-full border border-[#dbe2ff] bg-[#002fa7]/5 px-4 py-2 text-[13px] font-semibold text-[#002fa7]"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── AnalysisProsCons · 优点 / 不足 双栏 ─────────────────────────── */}
        <div
          data-testid="analysis-pros-cons"
          className="grid grid-cols-2 gap-6"
        >
          {/* 优点 · 绿 */}
          <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#059669] to-[#10b981] px-6 py-4 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>
              </span>
              <h3 className="text-[16px] font-bold">{ANALYSIS_PROS_TITLE}</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {ANALYSIS_PROS.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#374151]">
                    <span className="mt-0.5 shrink-0 text-[16px] font-bold text-[#10b981]">+</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 不足 · 勃艮第 */}
          <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft">
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#781621] to-[#a02030] px-6 py-4 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">warning</span>
              </span>
              <h3 className="text-[16px] font-bold">{ANALYSIS_CONS_TITLE}</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {ANALYSIS_CONS.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#374151]">
                    <span className="mt-0.5 shrink-0 text-[16px] font-bold text-[#781621]">−</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* ── AnalysisSuggestions · 优化建议 ──────────────────────────────── */}
        <section
          data-testid="analysis-suggestions"
          className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white pw-shadow-soft"
        >
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#002fa7] to-[#3654c8] px-6 py-4 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">lightbulb</span>
            </span>
            <h3 className="text-[16px] font-bold">{ANALYSIS_SUGGESTIONS_TITLE}</h3>
          </div>
          <div className="p-6">
            <ol className="space-y-4">
              {ANALYSIS_SUGGESTIONS.map((s, i) => (
                <li key={s} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#002fa7] text-[12px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[14px] leading-relaxed text-[#374151]">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* ── AnalysisFeedback · 反馈 footer ──────────────────────────────────── */}
      <div
        data-testid="analysis-feedback"
        className="mt-8 flex items-center gap-3 border-t border-[#eef1f6] pt-6"
      >
        <p className="text-[13px] text-[#9ca3af]">{ANALYSIS_FEEDBACK_PROMPT}</p>
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
