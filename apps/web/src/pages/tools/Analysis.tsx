/**
 * Analysis.tsx — /analysis · 文案结构分析
 * IKB 红蓝紫渐变体系重构 · IKBLayout 外壳 · 逻辑零改动 · testid 全保留
 * 参考样板: Generate.tsx / Trending.tsx
 */

import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
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
  { label: '开头吸引力', value: ANALYSIS_DIMENSIONS[0]!.score, color: C.ikb },
  { label: '情感张力',   value: ANALYSIS_DIMENSIONS[1]!.score, color: C.burgundy },
  { label: '节奏感',     value: ANALYSIS_DIMENSIONS[2]!.score, color: C.accent3 },
  { label: '完播率预测', value: ANALYSIS_DIMENSIONS[3]!.score, color: C.ikb },
  { label: '爆款元素运用', value: ANALYSIS_DIMENSIONS[4]!.score, color: C.burgundy },
  { label: '综合评分',   value: ANALYSIS_OVERALL_SCORE,        color: C.accent3 },
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
    <IKBLayout>
      <header className="mb-12 flex flex-row items-center justify-between gap-8">
        <div className="shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
            >
              工具
            </span>
            <span
              className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${C.burgundy}50`, background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
            >
              拆解器
            </span>
          </div>
          <h1
            className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tight"
            style={{ fontFamily: F.display }}
          >
            {ANALYSIS_H1}
          </h1>
          <p
            className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
            style={{ color: '#5A6173', fontFamily: F.cn }}
          >
            {ANALYSIS_SUBTITLE}
          </p>
        </div>
        <div className="flex shrink-0 flex-nowrap gap-3">
          <button
            type="button"
            aria-label="重新分析"
            onClick={handleAnalyze}
            disabled={!copy.trim()}
            className="ikb-gradbtn ikb-focusring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: F.mono }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>analytics</span>
            重新分析
          </button>
        </div>
      </header>

      {/* ── 使用方法提示卡 ───────────────────────────────────────────────────── */}
      <div
        className="mb-8 flex items-start gap-3 rounded-xl border p-4"
        style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}06` }}
      >
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>info</span>
        <p className="text-[14px] leading-relaxed" style={{ color: C.purpleText, fontFamily: F.cn }}>
          <span className="font-bold">使用方法：</span>
          粘贴任意短视频文案/口播稿 → AI 将从结构、节奏、爆款元素等多维度深度分析
        </p>
      </div>

      {/* ── 输入卡 (AnalysisInputCard) ───────────────────────────────────────── */}
      <section
        data-testid="analysis-input-card"
        className="relative mb-12 overflow-hidden rounded-xl border p-6"
        style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl"
          style={{ background: `${C.ikb}08` }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl"
          style={{ background: `${C.burgundy}06` }}
        />

        <div className="relative mb-6 flex items-center justify-between border-b pb-5" style={{ borderColor: C.line }}>
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: C.grad }}
            >
              <span className="material-symbols-outlined" aria-hidden={true}>content_paste_search</span>
            </span>
            <div>
              <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>输入文案内容</h2>
              <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>粘贴短视频文案 · AI 多维度深度分析</p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
          >
            <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
            待分析
          </span>
        </div>

        <div className="relative">
          {/* 文案 textarea */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="an-copy"
                className="flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="mr-1 inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${C.ikb}, ${C.burgundy})` }}
                  aria-hidden={true}
                />
                文案内容 <span className="ml-1" style={{ color: C.burgundyText }}>*</span>
              </label>
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }} aria-hidden={true}>
                <span className="material-symbols-outlined text-[14px]" style={{ color: C.burgundy }} aria-hidden={true}>auto_awesome</span>
                AI 据此深度拆解
              </span>
            </div>
            <div
              className="overflow-hidden rounded-xl border transition-all focus-within:ring-1 focus-within:ring-[#2B53E6]"
              style={{ borderColor: C.line, background: C.base }}
            >
              <textarea
                id="an-copy"
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                rows={10}
                placeholder="粘贴短视频文案/口播稿"
                className="ikb-input w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed"
                style={{ color: C.ink, fontFamily: F.cn }}
              />
              <div
                className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
                style={{ borderColor: C.line, background: `${C.paper}99` }}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>支持</span>
                  {['口播稿', '字幕', '描述文案', '评论区文案'].map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ background: C.base, color: '#6b7280', border: `1px solid ${C.line}`, fontFamily: F.cn }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 tabular-nums text-[11px]" style={{ color: '#6b7280', fontFamily: F.mono }}>{copy.length} 字</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!copy.trim()}
              className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-xl px-8 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px active:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: F.mono }}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>analytics</span>
              {ANALYSIS_CTA}
            </button>
          </div>
        </div>
      </section>

      {/* ── 数据洞察 band ────────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: C.ikb }} aria-hidden={true}>insights</span>
        <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>数据洞察</h2>
        <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
        >
          <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
          模型已就绪
        </span>
      </div>

      {/* ── 雷达 + KPI 一行 ──────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* AnalysisDimensions · 雷达 · col-span-5 */}
        <div
          data-testid="analysis-dimensions"
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
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{ANALYSIS_DIMENSIONS_TITLE}</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估</p>
              </div>
            </div>
            <div className="text-right">
              <p className="ikb-gradtext text-[26px] font-bold leading-none" style={{ fontFamily: F.display }}>
                {ANALYSIS_OVERALL_SCORE}
              </p>
              <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.mono }}>{ANALYSIS_OVERALL_LABEL}</p>
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
              <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="文案分析雷达图">
                <defs>
                  <linearGradient id="anl-radarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                ))}
                {dims.map((_, i) => {
                  const [x, y] = pt(i, R);
                  return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                })}
                <polygon points={dataPoly} fill="url(#anl-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
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
                <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AnalysisScoreCard + KPI 卡 · col-span-7 */}
        <div className="col-span-7 flex flex-col gap-6">
          {/* 综合评分大卡 */}
          <div
            data-testid="analysis-score-card"
            className="flex-1 rounded-xl border p-6 ikb-hovercard"
            style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.ikb}12`, color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>grade</span>
              </span>
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>{ANALYSIS_OVERALL_LABEL}</h3>
                <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>综合 AI 评估</p>
              </div>
              <span
                className="ml-auto inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
              >
                已分析
              </span>
            </div>
            <div className="flex items-end gap-6">
              <div>
                <p className="text-[64px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {ANALYSIS_OVERALL_SCORE}
                  <span className="text-[24px]" style={{ color: '#6b7280', fontFamily: F.cn }}>/100</span>
                </p>
              </div>
              {/* 环形进度 */}
              <div className="h-20 w-20 shrink-0">
                <svg viewBox="0 0 36 36" className="-rotate-90" role="img" aria-label={`综合评分 ${ANALYSIS_OVERALL_SCORE} 分环形进度`}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}22`} strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={C.ikb}
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
                  <span className="w-[90px] shrink-0 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: `${C.ikb}18` }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.score}%`, background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[12px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 小 KPI 一排 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 爆款元素数 · 玫红 */}
            <div
              className="rounded-xl border p-4 ikb-hovercard"
              style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `${C.burgundy}12`, color: C.burgundy }}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>stars</span>
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.mono }}
                >
                  已提取
                </span>
              </div>
              <p className="mt-3 text-[24px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {ANALYSIS_ELEMENTS.length}
                <span className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 个</span>
              </p>
              <p className="mt-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>爆款元素</p>
            </div>
            {/* 优点数 · 深绿(check_circle 建议/成功块保留绿) */}
            <div
              className="rounded-xl border p-4 ikb-hovercard"
              style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0fdf4] text-[#16a34a]">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>check_circle</span>
                </span>
                <span className="rounded-full bg-[#f0fdf4] px-2 py-0.5 text-[10px] font-bold text-[#166534]" style={{ fontFamily: F.mono }}>
                  优点
                </span>
              </div>
              <p className="mt-3 text-[24px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {ANALYSIS_PROS.length}
                <span className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 条</span>
              </p>
              <p className="mt-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>亮点</p>
            </div>
            {/* 建议数 · 紫 */}
            <div
              className="rounded-xl border p-4 ikb-hovercard"
              style={{ borderColor: C.line, background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `${C.accent3}12`, color: C.accent3 }}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>lightbulb</span>
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: `${C.accent3}12`, color: C.purpleText, fontFamily: F.mono }}
                >
                  建议
                </span>
              </div>
              <p className="mt-3 text-[24px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {ANALYSIS_SUGGESTIONS.length}
                <span className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}> 条</span>
              </p>
              <p className="mt-1 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>优化建议</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 解析结果区 ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6">

        {/* ── AnalysisStructure · 结构拆解 ─────────────────────────────────── */}
        <section
          data-testid="analysis-structure"
          className="overflow-hidden rounded-xl border ikb-hovercard"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div
            className="flex items-center gap-2.5 px-6 py-4"
            style={{ background: C.grad }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px] text-white" aria-hidden={true}>timeline</span>
            </span>
            <h3 className="text-[16px] font-bold text-white">{ANALYSIS_STRUCTURE_TITLE}</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {ANALYSIS_STRUCTURE.map((it, idx) => {
                // 品牌三色轮转: 0→蓝, 1→玫红, 2→紫, 3→蓝
                const palette = [
                  { bg: C.ikb, text: '#ffffff' },
                  { bg: C.burgundy, text: '#ffffff' },
                  { bg: C.accent3, text: '#ffffff' },
                  { bg: C.ikb, text: '#ffffff' },
                ] as const;
                const { bg, text } = palette[idx % palette.length]!;
                return (
                  <div key={it.stage} className="overflow-hidden rounded-xl border" style={{ borderColor: C.line, background: C.base }}>
                    <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ backgroundColor: bg }}>
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                          style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: text }}
                        >
                          {idx + 1}
                        </span>
                        <h4 className="text-[15px] font-bold" style={{ color: text }}>{it.stage}</h4>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold"
                        style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: text, border: '1px solid rgba(255,255,255,0.25)' }}
                      >
                        {it.score}分
                      </span>
                    </div>
                    <div className="p-4">
                      {it.type !== undefined && (
                        <p className="mb-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>类型：{it.type}</p>
                      )}
                      <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{it.desc}</p>
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
          className="overflow-hidden rounded-xl border ikb-hovercard"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div
            className="flex items-center gap-2.5 px-6 py-4"
            style={{ background: `linear-gradient(to right, ${C.ikb}, ${C.burgundy})` }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px] text-white" aria-hidden={true}>stars</span>
            </span>
            <h3 className="text-[16px] font-bold text-white">{ANALYSIS_ELEMENTS_TITLE}</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {ANALYSIS_ELEMENTS.map((e) => (
                <span
                  key={e}
                  className="rounded-full border px-4 py-2 text-[13px] font-semibold"
                  style={{ borderColor: `${C.ikb}30`, background: `${C.ikb}06`, color: C.ikb, fontFamily: F.cn }}
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
          {/* 优点 · 深绿(check_circle 建议/成功块保留绿) */}
          <section className="overflow-hidden rounded-xl border ikb-hovercard" style={{ borderColor: C.line, background: C.paper }}>
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#059669] to-[#16a34a] px-6 py-4 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>check_circle</span>
              </span>
              <h3 className="text-[16px] font-bold">{ANALYSIS_PROS_TITLE}</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {ANALYSIS_PROS.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>
                    <span className="mt-0.5 shrink-0 text-[16px] font-bold text-[#16a34a]">+</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 不足 · 玫红(避免/警告红保留) */}
          <section className="overflow-hidden rounded-xl border ikb-hovercard" style={{ borderColor: C.line, background: C.paper }}>
            <div
              className="flex items-center gap-2.5 px-6 py-4 text-white"
              style={{ background: `linear-gradient(to right, ${C.burgundy}, #c4304e)` }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>warning</span>
              </span>
              <h3 className="text-[16px] font-bold">{ANALYSIS_CONS_TITLE}</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {ANALYSIS_CONS.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>
                    <span className="mt-0.5 shrink-0 text-[16px] font-bold" style={{ color: C.burgundy }}>−</span>
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
          className="overflow-hidden rounded-xl border ikb-hovercard"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div
            className="flex items-center gap-2.5 px-6 py-4 text-white"
            style={{ background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})` }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>lightbulb</span>
            </span>
            <h3 className="text-[16px] font-bold">{ANALYSIS_SUGGESTIONS_TITLE}</h3>
          </div>
          <div className="p-6">
            <ol className="space-y-4">
              {ANALYSIS_SUGGESTIONS.map((s, i) => (
                <li key={s} className="flex items-start gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                    style={{ background: C.ikb, fontFamily: F.mono }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-[14px] leading-relaxed" style={{ color: '#374151', fontFamily: F.cn }}>{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* ── AnalysisFeedback · 反馈 footer ──────────────────────────────────── */}
      <div
        data-testid="analysis-feedback"
        className="mt-8 flex items-center gap-3 border-t pt-6"
        style={{ borderColor: C.line }}
      >
        <p className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{ANALYSIS_FEEDBACK_PROMPT}</p>
        <button
          type="button"
          onClick={handleFeedbackUp}
          aria-label="有帮助"
          className="ikb-focusring flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:border-[#2B53E6] hover:text-[#2B53E6]"
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
