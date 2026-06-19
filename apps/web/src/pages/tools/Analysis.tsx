/**
 * Analysis.tsx — /analysis · 文案结构分析
 * 液态玻璃皮重构 · LiquidShell 外壳 · 逻辑零改动 · testid 全保留
 * 参考样板: Guide.tsx
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { trpc } from '@/lib/trpc';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function Analysis() {
  const [copy, setCopy] = useState<string>(ANALYSIS_DEFAULT_COPY);

  const analyzeMutation = trpc.analysis.analyze.useMutation({
    onSuccess: () => { toast.success('分析完成'); },
    onError: (err: { message?: string }) => { toast.error(err.message ?? '分析失败，请重试'); },
  });

  const isPending = analyzeMutation.isPending;
  const isError = analyzeMutation.isError;

  function parseAnalysisContent(data: typeof analyzeMutation.data) {
    if (!data) return null;
    try {
      const parsed = JSON.parse(data.content) as unknown;
      if (!parsed || typeof parsed !== 'object') return null;
      const p = parsed as Record<string, unknown>;
      if (!p.scores || !Array.isArray(p.optimizations)) return null;
      return p as {
        scores: { hook: number; structure: number; emotion: number; specificity: number; cta: number; overall: number };
        optimizations: Array<{ dimension: string; issue: string; suggestion: string }>;
        rewriteSnippet: string;
        elements?: string[];
        pros?: string[];
        cons?: string[];
      };
    } catch { return null; }
  }

  const analysisData = parseAnalysisContent(analyzeMutation.data);

  const displayOverall = analysisData?.scores.overall ?? ANALYSIS_OVERALL_SCORE;
  const displayStructure = analysisData
    ? analysisData.optimizations.map((o) => ({ stage: o.dimension, score: 0, desc: `${o.issue} → ${o.suggestion}`, type: undefined as string | undefined }))
    : ANALYSIS_STRUCTURE;
  const displaySuggestions = analysisData
    ? analysisData.optimizations.map((o) => o.suggestion)
    : ANALYSIS_SUGGESTIONS;
  const displayDimensions = analysisData
    ? [
        { label: ANALYSIS_DIMENSIONS[0]!.label, score: analysisData.scores.hook },
        { label: ANALYSIS_DIMENSIONS[1]!.label, score: analysisData.scores.emotion },
        { label: ANALYSIS_DIMENSIONS[2]!.label, score: analysisData.scores.structure },
        { label: ANALYSIS_DIMENSIONS[3]!.label, score: analysisData.scores.specificity },
        { label: ANALYSIS_DIMENSIONS[4]!.label, score: analysisData.scores.cta },
      ]
    : ANALYSIS_DIMENSIONS;
  const radarDims = analysisData
    ? [
        { label: '开头吸引力', value: analysisData.scores.hook, color: C.ikb },
        { label: '情感张力', value: analysisData.scores.emotion, color: C.yellow },
        { label: '节奏感', value: analysisData.scores.structure, color: C.accent3 },
        { label: '完播率预测', value: analysisData.scores.specificity, color: C.ikb },
        { label: '爆款元素运用', value: analysisData.scores.cta, color: C.yellow },
        { label: '综合评分', value: analysisData.scores.overall, color: C.accent3 },
      ]
    : [
        { label: '开头吸引力', value: ANALYSIS_DIMENSIONS[0]!.score, color: C.ikb },
        { label: '情感张力', value: ANALYSIS_DIMENSIONS[1]!.score, color: C.yellow },
        { label: '节奏感', value: ANALYSIS_DIMENSIONS[2]!.score, color: C.accent3 },
        { label: '完播率预测', value: ANALYSIS_DIMENSIONS[3]!.score, color: C.ikb },
        { label: '爆款元素运用', value: ANALYSIS_DIMENSIONS[4]!.score, color: C.yellow },
        { label: '综合评分', value: ANALYSIS_OVERALL_SCORE, color: C.accent3 },
      ];

  function handleAnalyze() {
    if (!copy.trim() || isPending) return;
    analyzeMutation.mutate({ copy });
  }

  function handleFeedbackUp() {
    toast.success('感谢反馈!');
  }

  function handleFeedbackDown() {
    toast.info('我们会持续改进');
  }

  return (
    <LiquidShell>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Reveal>
        <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ flexShrink: 0 }}>
            {/* chip 标签行 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ink,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                工具
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  border: '0.5px solid rgba(168,197,224,0.55)',
                  background: 'rgba(168,197,224,0.18)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                拆解器
              </span>
            </div>
            {/* 主标题 — 冷蓝渐变字 */}
            <h1
              style={{
                whiteSpace: 'nowrap',
                fontSize: 52,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: F.display,
                margin: 0,
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              {ANALYSIS_H1}
            </h1>
            <p
              style={{
                marginTop: 10,
                maxWidth: 820,
                fontSize: 16,
                lineHeight: 1.6,
                color: C.burgundyText,
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              {ANALYSIS_SUBTITLE}
            </p>
          </div>
          {/* 重新分析按钮 */}
          <div style={{ flexShrink: 0 }}>
            <Magnetic strength={0.3}>
              <button
                type="button"
                aria-label="重新分析"
                onClick={handleAnalyze}
                disabled={!copy.trim() || isPending}
                className="lg-gradbtn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  borderRadius: 9999,
                  padding: '10px 22px',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: F.cn,
                  cursor: 'pointer',
                  border: 'none',
                  opacity: copy.trim() && !isPending ? 1 : 0.4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>analytics</span>
                重新分析
              </button>
            </Magnetic>
          </div>
        </header>
      </Reveal>

      {/* ── 使用方法提示卡 ───────────────────────────────────────────────── */}
      <Reveal>
        <div
          className="lg-glass"
          style={{
            marginBottom: 44,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            borderRadius: 16,
            padding: 18,
          }}
        >
          <span className="material-symbols-outlined" style={{ marginTop: 2, flexShrink: 0, fontSize: 20, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }} aria-hidden={true}>info</span>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.purpleText, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>
            <span style={{ fontWeight: 700 }}>使用方法：</span>
            粘贴任意短视频文案/口播稿 → AI 将从结构、节奏、爆款元素等多维度深度分析
          </p>
        </div>
      </Reveal>

      {isPending && (
        <Reveal>
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '14px 20px', background: 'rgba(168,197,224,0.15)', border: `0.5px solid rgba(168,197,224,0.35)` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb, animation: 'spin 1s linear infinite' }} aria-hidden={true}>progress_activity</span>
            <p style={{ fontSize: 14, color: C.ikb, fontFamily: F.cn, margin: 0 }}>AI 正在分析中，请稍候…</p>
          </div>
        </Reveal>
      )}
      {isError && (
        <Reveal>
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '14px 20px', background: 'rgba(239,68,68,0.12)', border: `0.5px solid rgba(239,68,68,0.35)` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#f87171' }} aria-hidden={true}>error</span>
            <p style={{ fontSize: 14, color: '#f87171', fontFamily: F.cn, margin: 0 }}>分析失败，请重试</p>
          </div>
        </Reveal>
      )}

      {/* ── 输入卡 (AnalysisInputCard) ───────────────────────────────────── */}
      <Reveal>
        <section
          data-testid="analysis-input-card"
          className="lg-glass"
          style={{
            position: 'relative',
            marginBottom: 48,
            overflow: 'hidden',
            borderRadius: 20,
            padding: 28,
          }}
        >
          {/* 标题行 */}
          <div
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `0.5px solid ${C.line}`,
              paddingBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(168,197,224,0.4), rgba(120,160,220,0.25))',
                  color: C.ink,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }} aria-hidden={true}>content_paste_search</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>输入文案内容</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>粘贴短视频文案 · AI 多维度深度分析</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 9999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                background: 'rgba(168,197,224,0.18)',
                color: C.ikb,
                fontFamily: F.mono,
                textShadow: C.textShadow,
              }}
            >
              <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
              待分析
            </span>
          </div>

          {/* 文案 textarea */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                htmlFor="an-copy"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    height: 14,
                    width: 4,
                    borderRadius: 9999,
                    background: C.grad,
                    marginRight: 4,
                  }}
                  aria-hidden={true}
                />
                文案内容 <span style={{ marginLeft: 4, color: C.yellow }}>*</span>
              </label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }} aria-hidden={true}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.yellow }} aria-hidden={true}>auto_awesome</span>
                AI 据此深度拆解
              </span>
            </div>
            <div
              className="lg-glass"
              style={{
                overflow: 'hidden',
                borderRadius: 14,
              }}
            >
              <textarea
                id="an-copy"
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                rows={10}
                placeholder="粘贴短视频文案/口播稿"
                style={{
                  display: 'block',
                  width: '100%',
                  resize: 'none',
                  border: 'none',
                  background: 'transparent',
                  padding: 16,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: C.ink,
                  fontFamily: F.cn,
                  outline: 'none',
                  textShadow: C.textShadow,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderTop: `0.5px solid ${C.line}`,
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>支持</span>
                  {['口播稿', '字幕', '描述文案', '评论区文案'].map((t) => (
                    <span
                      key={t}
                      style={{
                        borderRadius: 9999,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 500,
                        background: 'rgba(168,197,224,0.12)',
                        color: 'rgba(255,255,255,0.84)',
                        border: `0.5px solid ${C.line}`,
                        fontFamily: F.cn,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span style={{ flexShrink: 0, tabularNums: true, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.mono } as React.CSSProperties}>{copy.length} 字</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Magnetic strength={0.3}>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!copy.trim() || isPending}
                className="lg-gradbtn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 9999,
                  padding: '12px 32px',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: F.cn,
                  cursor: 'pointer',
                  border: 'none',
                  opacity: copy.trim() && !isPending ? 1 : 0.4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>analytics</span>
                {ANALYSIS_CTA}
              </button>
            </Magnetic>
          </div>
        </section>
      </Reveal>

      {/* ── 解析结果区 ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── AnalysisStructure · 结构拆解 ─────────────────────────────── */}
        <Reveal>
          <section
            data-testid="analysis-structure"
            className="lg-glass"
            style={{ overflow: 'hidden', borderRadius: 20 }}
          >
            {/* 区块头 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '18px 24px',
                background: 'linear-gradient(110deg, rgba(168,197,224,0.32) 0%, rgba(120,160,220,0.18) 100%)',
                borderBottom: `0.5px solid ${C.line}`,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  height: 34,
                  width: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.14)',
                  color: C.ink,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>timeline</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{ANALYSIS_STRUCTURE_TITLE}</h3>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {displayStructure.map((it, idx) => {
                  const accentColors = [C.ikb, C.yellow, C.accent3, C.ikb] as const;
                  const accent = accentColors[idx % accentColors.length]!;
                  return (
                    <div
                      key={it.stage}
                      className="lg-glass lg-spec"
                      style={{ overflow: 'hidden', borderRadius: 14 }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          padding: '10px 16px',
                          background: 'rgba(168,197,224,0.18)',
                          borderBottom: `0.5px solid ${C.line}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span
                            style={{
                              display: 'flex',
                              height: 28,
                              width: 28,
                              flexShrink: 0,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              fontSize: 12,
                              fontWeight: 800,
                              color: accent,
                              background: 'rgba(255,255,255,0.14)',
                              fontFamily: F.mono,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <h4 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{it.stage}</h4>
                        </div>
                        <span
                          style={{
                            flexShrink: 0,
                            borderRadius: 9999,
                            padding: '2px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.12)',
                            color: accent,
                            border: '0.5px solid rgba(255,255,255,0.22)',
                            fontFamily: F.mono,
                          }}
                        >
                          {it.score}分
                        </span>
                      </div>
                      <div style={{ padding: 16 }}>
                        {it.type !== undefined && (
                          <p style={{ marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>类型：{it.type}</p>
                        )}
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', fontFamily: F.cn, margin: 0 }}>{it.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── AnalysisElements · 识别到的爆款元素 ─────────────────────── */}
        <Reveal>
          <section
            data-testid="analysis-elements"
            className="lg-glass"
            style={{ overflow: 'hidden', borderRadius: 20 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '18px 24px',
                background: 'linear-gradient(110deg, rgba(168,197,224,0.28) 0%, rgba(120,160,220,0.14) 100%)',
                borderBottom: `0.5px solid ${C.line}`,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  height: 34,
                  width: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.14)',
                  color: C.ink,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }} aria-hidden={true}>stars</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{ANALYSIS_ELEMENTS_TITLE}</h3>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {(analysisData?.elements ?? ANALYSIS_ELEMENTS).map((e) => (
                  <motion.span
                    key={e}
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{
                      display: 'inline-block',
                      borderRadius: 9999,
                      border: `0.5px solid rgba(168,197,224,0.45)`,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'rgba(168,197,224,0.15)',
                      color: C.ikb,
                      fontFamily: F.cn,
                      textShadow: C.textShadow,
                      cursor: 'default',
                    }}
                  >
                    {e}
                  </motion.span>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── AnalysisProsCons · 优点 / 不足 双栏 ─────────────────────── */}
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Item data-testid="analysis-pros-cons">
            {/* 优点 */}
            <section
              className="lg-glass"
              style={{ overflow: 'hidden', borderRadius: 20, height: '100%' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '18px 24px',
                  background: 'linear-gradient(110deg, rgba(34,197,94,0.22) 0%, rgba(22,163,74,0.12) 100%)',
                  borderBottom: `0.5px solid ${C.line}`,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    height: 34,
                    width: 34,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.14)',
                    color: '#4ade80',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>check_circle</span>
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{ANALYSIS_PROS_TITLE}</h3>
              </div>
              <div style={{ padding: 24 }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
                  {(analysisData?.pros ?? ANALYSIS_PROS).map((p) => (
                    <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', fontFamily: F.cn }}>
                      <span style={{ marginTop: 2, flexShrink: 0, fontSize: 16, fontWeight: 800, color: '#4ade80' }}>+</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </Item>

          <Item>
            {/* 不足 */}
            <section
              className="lg-glass"
              style={{ overflow: 'hidden', borderRadius: 20, height: '100%' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '18px 24px',
                  background: 'linear-gradient(110deg, rgba(239,68,68,0.22) 0%, rgba(185,28,28,0.12) 100%)',
                  borderBottom: `0.5px solid ${C.line}`,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    height: 34,
                    width: 34,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.14)',
                    color: '#f87171',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>warning</span>
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{ANALYSIS_CONS_TITLE}</h3>
              </div>
              <div style={{ padding: 24 }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
                  {(analysisData?.cons ?? ANALYSIS_CONS).map((c) => (
                    <li key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', fontFamily: F.cn }}>
                      <span style={{ marginTop: 2, flexShrink: 0, fontSize: 16, fontWeight: 800, color: '#f87171' }}>−</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </Item>
        </RevealGroup>

        {/* ── AnalysisSuggestions · 优化建议 ──────────────────────────── */}
        <Reveal>
          <section
            data-testid="analysis-suggestions"
            className="lg-glass"
            style={{ overflow: 'hidden', borderRadius: 20 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '18px 24px',
                background: 'linear-gradient(110deg, rgba(168,197,224,0.28) 0%, rgba(120,160,220,0.14) 100%)',
                borderBottom: `0.5px solid ${C.line}`,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  height: 34,
                  width: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.14)',
                  color: C.accent3,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>lightbulb</span>
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{ANALYSIS_SUGGESTIONS_TITLE}</h3>
            </div>
            <div style={{ padding: 24 }}>
              <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {displaySuggestions.map((s, i) => (
                  <Item key={s} style={{ height: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.line}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span
                          style={{
                            display: 'flex',
                            height: 28,
                            width: 28,
                            flexShrink: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            fontSize: 12,
                            fontWeight: 800,
                            color: '#fff',
                            background: 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.4))',
                            fontFamily: F.mono,
                            textShadow: C.textShadow,
                          }}
                        >
                          {i + 1}
                        </span>
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', fontFamily: F.cn, margin: 0, marginTop: 'auto' }}>{s}</p>
                      </div>
                    </div>
                  </Item>
                ))}
              </RevealGroup>
            </div>
          </section>
        </Reveal>
      </div>

      {/* ── 数据洞察 band ────────────────────────────────────────────────── */}
      <Reveal style={{ marginTop: 48, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }} aria-hidden={true}>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 9999,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 700,
              background: 'rgba(168,197,224,0.18)',
              color: C.ikb,
              fontFamily: F.mono,
              textShadow: C.textShadow,
            }}
          >
            <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
            模型已就绪
          </span>
        </div>
      </Reveal>

      {/* ── 雷达 + KPI 一行 ──────────────────────────────────────────────── */}
      <RevealGroup style={{ marginBottom: 44, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }}>

        {/* AnalysisDimensions · 雷达 */}
        <Item>
          <motion.div
            data-testid="analysis-dimensions"
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 24 }}
          >
            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.22)',
                    color: C.ink,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }} aria-hidden={true}>radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{ANALYSIS_DIMENSIONS_TITLE}</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>六维模型评估</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    lineHeight: 1,
                    margin: 0,
                    fontFamily: F.display,
                    background: C.grad,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  {displayOverall}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: F.mono, margin: 0 }}>{ANALYSIS_OVERALL_LABEL}</p>
              </div>
            </div>
            {(() => {
              const dims = radarDims;
              const cx = 130;
              const cy = 122;
              const R = 88;
              const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
              const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
              const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
              const dataPoly = dims.map((d, i) => pt(i, R * (Math.min(d.value, 100) / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
              return (
                <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="文案分析雷达图">
                  <defs>
                    <linearGradient id="anl-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                      <stop offset="100%" stopColor={C.yellow} stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
                  })}
                  <polygon points={dataPoly} fill="url(#anl-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R * (Math.min(d.value, 100) / 100));
                    return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(8,20,48,0.8)" stroke={d.color} strokeWidth="2" />;
                  })}
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R + 16);
                    return (
                      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.65)" fontSize="10.5" fontWeight="600">
                        {d.label}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {radarDims.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ height: 8, width: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: d.color }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </Item>

        {/* AnalysisScoreCard + KPI 卡 */}
        <Item>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
            {/* 综合评分大卡 */}
            <motion.div
              data-testid="analysis-score-card"
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ flex: 1, borderRadius: 20, padding: 24 }}
            >
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.22)',
                    color: C.ink,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }} aria-hidden={true}>grade</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0, fontFamily: F.cn, textShadow: C.textShadow }}>{ANALYSIS_OVERALL_LABEL}</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>综合 AI 评估</p>
                </div>
                <span
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  已分析
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
                <div>
                  <p style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, margin: 0, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                    {displayOverall}
                    <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>/100</span>
                  </p>
                </div>
                {/* 环形进度 */}
                <div style={{ height: 80, width: 80, flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`综合评分 ${displayOverall} 分环形进度`}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.2)" strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={C.ikb}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min(100, displayOverall)} 100`}
                    />
                  </svg>
                </div>
              </div>
              {/* 维度评分 bars */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displayDimensions.map((d) => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 90, flexShrink: 0, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                    <div style={{ height: 6, flex: 1, overflow: 'hidden', borderRadius: 9999, background: 'rgba(168,197,224,0.14)' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 9999,
                          width: `${d.score}%`,
                          background: C.grad,
                        }}
                      />
                    </div>
                    <span style={{ width: 28, flexShrink: 0, textAlign: 'right', fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.score}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 小 KPI 一排 */}
            <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {/* 爆款元素数 */}
              <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 16, padding: 18, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 34,
                      width: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'rgba(168,197,224,0.22)',
                      color: C.yellow,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>stars</span>
                  </span>
                  <span
                    style={{
                      borderRadius: 9999,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.yellow,
                      fontFamily: F.mono,
                    }}
                  >
                    已提取
                  </span>
                </div>
                <p style={{ marginTop: 14, fontSize: 24, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, marginBottom: 0 }}>
                  {(analysisData?.elements ?? ANALYSIS_ELEMENTS).length}
                  <span style={{ marginLeft: 4, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}> 个</span>
                </p>
                <p style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>爆款元素</p>
              </motion.div>
              </Item>

              {/* 优点数 */}
              <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 16, padding: 18, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 34,
                      width: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'rgba(34,197,94,0.18)',
                      color: '#4ade80',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>check_circle</span>
                  </span>
                  <span
                    style={{
                      borderRadius: 9999,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'rgba(34,197,94,0.15)',
                      color: '#4ade80',
                      fontFamily: F.mono,
                    }}
                  >
                    优点
                  </span>
                </div>
                <p style={{ marginTop: 14, fontSize: 24, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, marginBottom: 0 }}>
                  {(analysisData?.pros ?? ANALYSIS_PROS).length}
                  <span style={{ marginLeft: 4, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}> 条</span>
                </p>
                <p style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>亮点</p>
              </motion.div>
              </Item>

              {/* 建议数 */}
              <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 16, padding: 18, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'flex',
                      height: 34,
                      width: 34,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      background: 'rgba(168,197,224,0.22)',
                      color: C.accent3,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden={true}>lightbulb</span>
                  </span>
                  <span
                    style={{
                      borderRadius: 9999,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.purpleText,
                      fontFamily: F.mono,
                    }}
                  >
                    建议
                  </span>
                </div>
                <p style={{ marginTop: 14, fontSize: 24, fontWeight: 800, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, marginBottom: 0 }}>
                  {displaySuggestions.length}
                  <span style={{ marginLeft: 4, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}> 条</span>
                </p>
                <p style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>优化建议</p>
              </motion.div>
              </Item>
            </RevealGroup>
          </div>
        </Item>
      </RevealGroup>

      {/* ── AnalysisFeedback · 反馈 footer ──────────────────────────────── */}
      <Reveal>
        <div
          data-testid="analysis-feedback"
          style={{
            marginTop: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderTop: `0.5px solid ${C.line}`,
            paddingTop: 24,
          }}
        >
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{ANALYSIS_FEEDBACK_PROMPT}</p>
          <motion.button
            type="button"
            onClick={handleFeedbackUp}
            aria-label="有帮助"
            whileHover={{ y: -3, color: C.ikb }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{
              display: 'flex',
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              border: `0.5px solid ${C.line}`,
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>thumb_up</span>
          </motion.button>
          <motion.button
            type="button"
            onClick={handleFeedbackDown}
            aria-label="无帮助"
            whileHover={{ y: -3, color: 'rgba(255,255,255,0.85)' }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{
              display: 'flex',
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              border: `0.5px solid ${C.line}`,
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden={true}>thumb_down</span>
          </motion.button>
        </div>
      </Reveal>

    </LiquidShell>
  );
}
