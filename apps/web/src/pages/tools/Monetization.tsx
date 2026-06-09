/**
 * Monetization.tsx — /monetization IP变现模型定制
 * 液态玻璃皮 · LiquidShell 外壳 · home-next/ikb/system 原语
 * 阶段2 接真: trpc.monetization.generate
 * 业务逻辑/状态/mutation/校验/testid 零改动
 * 换皮: IKBLayout → LiquidShell · C/F → home-next · 卡片 lg-glass · 入场 Reveal/RevealGroup
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
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

// ── 三色轮转 ──────────────────────────────────────────────────────────────────
const ACCENT_CYCLE = [C.ikb, C.yellow, C.accent3] as const;

// ── FieldLabel 液态玻璃版 ──────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 700,
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
          width: 3,
          borderRadius: 9999,
          background: C.grad,
          flexShrink: 0,
        }}
        aria-hidden={true}
      />
      {children}
    </span>
  );
}

// ── MonetizationHero 液态玻璃 header ─────────────────────────────────────────
function MonetizationHero() {
  return (
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
                border: `0.5px solid rgba(168,197,224,0.55)`,
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
              变现模型
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
            {MONETIZATION_H1}
          </h1>
          <p
            style={{
              marginTop: 10,
              maxWidth: 820,
              fontSize: 16,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.75)',
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            {MONETIZATION_SUBTITLE}
          </p>
        </div>
      </header>
    </Reveal>
  );
}

// ── MonetizationForm — 液态玻璃卡 ─────────────────────────────────────────────
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
    <Reveal>
      <section
        className="lg-glass"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          padding: 28,
        }}
      >
        {/* Section header */}
        <div
          style={{
            position: 'relative',
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
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 22, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>tune</span>
            </span>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{MONETIZATION_FORM_TITLE}</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>填写基础信息 · AI 据此生成变现模型</p>
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
              fontWeight: 600,
              background: 'rgba(168,197,224,0.18)',
              color: C.ikb,
              fontFamily: F.mono,
              textShadow: C.textShadow,
            }}
          >
            <span
              style={{
                height: 6,
                width: 6,
                borderRadius: 9999,
                backgroundColor: C.ikb,
                animation: 'ikb-pulse 2s ease-in-out infinite',
              }}
            />
            参数就绪
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 字段 1 · 选择行业 */}
          <div>
            <label htmlFor="mn-industry" style={{ display: 'block', marginBottom: 8 }}>
              <FieldLabel>{MONETIZATION_LABEL_INDUSTRY}</FieldLabel>
            </label>
            <select
              id="mn-industry"
              value={industryId}
              onChange={(e) => onIndustryChange(e.target.value)}
              style={{
                width: '100%',
                borderRadius: 10,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.08)',
                color: C.ink,
                fontFamily: F.cn,
                fontSize: 14,
                padding: '10px 14px',
                outline: 'none',
                backdropFilter: 'blur(8px)',
                WebkitAppearance: 'none',
                cursor: 'pointer',
              }}
            >
              {STEP1_INDUSTRIES_56.map((ind) => (
                <option key={ind.id} value={ind.id} style={{ background: '#0e1a36', color: '#fff' }}>
                  {ind.emoji} {ind.label}
                </option>
              ))}
            </select>
          </div>

          {/* 字段 2 · 产品/服务描述 */}
          <div>
            <label htmlFor="mn-product" style={{ display: 'block', marginBottom: 8 }}>
              <FieldLabel>
                {MONETIZATION_LABEL_PRODUCT}
                {' '}<span style={{ color: C.ikb }}>*</span>
              </FieldLabel>
            </label>
            <div
              style={{
                overflow: 'hidden',
                borderRadius: 10,
                border: `0.5px solid ${C.line}`,
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <textarea
                id="mn-product"
                value={product}
                onChange={(e) => onProductChange(e.target.value)}
                rows={3}
                placeholder="例如：线上英语培训课程，面向职场白领"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  border: 'none',
                  background: 'transparent',
                  padding: '12px 14px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: C.ink,
                  fontFamily: F.cn,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* 字段 3 · 目标受众 */}
          <div>
            <label htmlFor="mn-audience" style={{ display: 'block', marginBottom: 8 }}>
              <FieldLabel>{MONETIZATION_LABEL_AUDIENCE}</FieldLabel>
            </label>
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                aria-hidden={true}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: 'rgba(255,255,255,0.45)',
                  pointerEvents: 'none',
                }}
              >
                groups
              </span>
              <input
                id="mn-audience"
                type="text"
                value={audience}
                onChange={(e) => onAudienceChange(e.target.value)}
                placeholder="例如：25-40岁职场女性"
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.08)',
                  color: C.ink,
                  fontFamily: F.cn,
                  fontSize: 14,
                  padding: '10px 14px 10px 40px',
                  outline: 'none',
                  backdropFilter: 'blur(8px)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* 字段 4 · IP定位 */}
          <div>
            <label htmlFor="mn-positioning" style={{ display: 'block', marginBottom: 8 }}>
              <FieldLabel>{MONETIZATION_LABEL_POSITIONING}</FieldLabel>
            </label>
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                aria-hidden={true}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: 'rgba(255,255,255,0.45)',
                  pointerEvents: 'none',
                }}
              >
                person_pin
              </span>
              <input
                id="mn-positioning"
                type="text"
                value={positioning}
                onChange={(e) => onPositioningChange(e.target.value)}
                placeholder="例如：专业、接地气的英语老师人设"
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.08)',
                  color: C.ink,
                  fontFamily: F.cn,
                  fontSize: 14,
                  padding: '10px 14px 10px 40px',
                  outline: 'none',
                  backdropFilter: 'blur(8px)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* CTA */}
          <Magnetic strength={0.3}>
            <button
              type="button"
              data-testid="mn-generate-btn"
              onClick={onGenerate}
              disabled={isPending}
              aria-label={MONETIZATION_CTA}
              className="lg-gradbtn"
              style={{
                marginTop: 8,
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 9999,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                fontFamily: F.cn,
                border: 'none',
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.6 : 1,
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>auto_awesome</span>
              {MONETIZATION_CTA}
            </button>
          </Magnetic>
        </div>
      </section>
    </Reveal>
  );
}

// ── MonetizationEmptyState 液态玻璃占位 ──────────────────────────────────────
function MonetizationEmptyState() {
  return (
    <Reveal>
      <div
        data-testid="mn-empty-state"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 20,
          border: `1.5px dashed rgba(168,197,224,0.3)`,
          padding: 48,
          textAlign: 'center',
          background: 'rgba(168,197,224,0.05)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span
          style={{
            display: 'flex',
            height: 64,
            width: 64,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            background: 'rgba(168,197,224,0.18)',
            color: C.ink,
            marginBottom: 16,
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 36, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>account_balance</span>
        </span>
        <h3
          style={{
            marginBottom: 8,
            fontSize: 17,
            fontWeight: 700,
            color: C.ink,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          {MONETIZATION_RESULT_TITLE}
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
          填写左侧表单，点击「{MONETIZATION_CTA}」<br />AI 将为您生成专属变现路径
        </p>
      </div>
    </Reveal>
  );
}

// ── MonetizationResult — 液态玻璃结构化卡 ────────────────────────────────────
interface MonetizationResultProps {
  result: MonetizationToolResult;
  isFallback: boolean;
}

function MonetizationResult({ result, isFallback }: MonetizationResultProps) {
  function handleFeedback() {
    toast.success('感谢反馈');
  }

  const { productMatrix, pricingStrategy, conversionFunnel } = result;

  // KPI 从真结果派生
  const kpis = [
    { icon: 'route', label: '产品矩阵', value: `${productMatrix.length}`, unit: '款', badge: '全层次', color: C.ink, bg: 'rgba(168,197,224,0.18)' },
    { icon: 'currency_yen', label: '漏斗步骤', value: `${conversionFunnel.length}`, unit: '步', badge: '转化路径', color: C.yellow, bg: 'rgba(228,238,255,0.18)' },
    { icon: 'grid_view', label: '定价策略', value: '已生成', unit: '', badge: '定价方案', color: C.accent3, bg: 'rgba(168,197,224,0.18)' },
    { icon: 'sell', label: 'AI 生成', value: '✓', unit: '', badge: '变现模型', color: C.ink, bg: 'rgba(168,197,224,0.18)' },
  ];

  // 雷达六维 (变现能力) — 固定展示维度
  const radarDims = [
    { label: '获客', value: 85, color: C.ikb },
    { label: '转化', value: 78, color: C.yellow },
    { label: '客单价', value: 82, color: C.accent3 },
    { label: '复购', value: 70, color: C.ikb },
    { label: '利润', value: 88, color: C.yellow },
    { label: '规模化', value: 74, color: C.accent3 },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} data-testid="mn-result-panel">
      {/* ── isFallback 降级提示 ────────────────────────── */}
      {isFallback && (
        <Reveal>
          <div
            data-testid="mn-fallback-notice"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              border: `0.5px solid rgba(168,197,224,0.3)`,
              padding: '12px 16px',
              fontSize: 13,
              background: 'rgba(168,197,224,0.10)',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18, color: C.accent3 }}>warning</span>
            AI 繁忙，已返回备用变现方案，建议稍后重试以获取个性化结果。
          </div>
        </Reveal>
      )}

      {/* ── Result title header ──────────────────────────── */}
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'flex',
              height: 36,
              width: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(168,197,224,0.4), rgba(120,160,220,0.25))',
              color: C.ikb,
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>account_balance</span>
          </span>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{MONETIZATION_RESULT_TITLE}</h2>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 9999,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              background: 'rgba(168,197,224,0.18)',
              color: C.ikb,
              fontFamily: F.mono,
              textShadow: C.textShadow,
            }}
          >
            <span style={{ height: 6, width: 6, borderRadius: 9999, backgroundColor: C.ikb }} />
            模型已就绪
          </span>
        </div>
      </Reveal>

      {/* ── KPI 概览一排 (4 cards) ────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {kpis.map((k) => (
          <Item key={k.label} style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 16, padding: 18, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: k.bg,
                    color: k.color,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>{k.icon}</span>
                </span>
                <span
                  style={{
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    background: k.bg,
                    color: k.color,
                    fontFamily: F.mono,
                    textShadow: C.textShadow,
                  }}
                >
                  {k.badge}
                </span>
              </div>
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: k.color, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                  {k.value}
                  {k.unit && (
                    <span style={{ marginLeft: 3, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{k.unit}</span>
                  )}
                </p>
                <p style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{k.label}</p>
              </div>
            </motion.div>
          </Item>
        ))}
      </RevealGroup>

      {/* ── 产品矩阵(真结果) ──────────────────────────────── */}
      <Reveal>
        <div
          className="lg-glass"
          style={{ overflow: 'hidden', borderRadius: 18, padding: 24, position: 'relative' }}
        >
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                display: 'flex',
                height: 40,
                width: 40,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 11,
                background: 'linear-gradient(135deg, rgba(168,197,224,0.4), rgba(120,160,220,0.25))',
                color: C.ikb,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>grid_view</span>
            </span>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 9999,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                  fontFamily: F.mono,
                  marginBottom: 4,
                  textShadow: C.textShadow,
                }}
              >
                <span style={{ height: 6, width: 6, borderRadius: 9999, backgroundColor: C.ikb }} />
                Product Matrix
              </span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>产品矩阵</h3>
            </div>
          </div>
          <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} data-testid="mn-product-matrix">
            {productMatrix.map((item, idx) => {
              const c = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
              return (
                <Item key={idx} style={{ height: '100%' }}>
                  <motion.div
                    className="lg-glass lg-spec"
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, padding: '12px 14px', height: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span
                        style={{
                          marginTop: 2,
                          display: 'flex',
                          height: 24,
                          width: 24,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#fff',
                          background: 'linear-gradient(135deg, rgba(168,197,224,0.55), rgba(120,160,220,0.4))',
                          fontFamily: F.mono,
                          textShadow: C.textShadow,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{item}</p>
                    </div>
                    <span style={{ display: 'none' }}>{c}</span>
                  </motion.div>
                </Item>
              );
            })}
          </RevealGroup>
        </div>
      </Reveal>

      {/* ── 定价策略 ────────────────────────────────────────── */}
      <Reveal>
        <div className="lg-glass" style={{ borderRadius: 18, padding: 24 }}>
          <h3
            style={{
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 15,
              fontWeight: 700,
              color: C.ink,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            <span
              style={{
                display: 'flex',
                height: 36,
                width: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                background: 'rgba(168,197,224,0.18)',
                color: C.ikb,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>sell</span>
            </span>
            定价策略
          </h3>
          <div
            className="lg-glass"
            style={{ borderRadius: 12, padding: '14px 16px' }}
            data-testid="mn-pricing-strategy"
          >
            <p style={{ fontSize: 13, lineHeight: 1.7, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{pricingStrategy}</p>
          </div>
        </div>
      </Reveal>

      {/* ── 转化漏斗 ────────────────────────────────────────── */}
      <Reveal>
        <div className="lg-glass" style={{ borderRadius: 18, padding: 24 }}>
          <h3
            style={{
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 15,
              fontWeight: 700,
              color: C.ink,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            <span
              style={{
                display: 'flex',
                height: 36,
                width: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                background: 'rgba(228,238,255,0.18)',
                color: C.yellow,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>filter_alt</span>
            </span>
            转化漏斗
          </h3>
          <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} data-testid="mn-conversion-funnel">
            {conversionFunnel.map((step, idx) => {
              const c = ACCENT_CYCLE[idx % ACCENT_CYCLE.length];
              return (
                <Item key={idx} style={{ height: '100%' }}>
                  <motion.div
                    className="lg-glass lg-spec"
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, padding: '11px 14px', height: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span
                        style={{
                          display: 'flex',
                          height: 26,
                          width: 26,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#fff',
                          background: 'linear-gradient(135deg, rgba(168,197,224,0.55), rgba(120,160,220,0.4))',
                          fontFamily: F.mono,
                          textShadow: C.textShadow,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <p style={{ fontSize: 13, lineHeight: 1.5, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{step}</p>
                    </div>
                    <span style={{ display: 'none' }}>{c}</span>
                  </motion.div>
                </Item>
              );
            })}
          </RevealGroup>
        </div>
      </Reveal>

      {/* ── 数据洞察 band (雷达 + 趋势) ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 16 }}>
        {/* 变现能力雷达 */}
        <Reveal>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 22 }}
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
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>变现能力雷达</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>六维模型评估（基于行业典型值）</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    lineHeight: 1,
                    margin: 0,
                    background: C.grad,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                    fontFamily: F.display,
                    textShadow: 'none',
                  }}
                >
                  80
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>综合分（参考）</p>
              </div>
            </div>
            <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="变现能力雷达图">
              <defs>
                <linearGradient id="mon-radarFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(168,197,224,1)" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="rgba(168,197,224,1)" stopOpacity="0.12" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              ))}
              {radarDims.map((_, i) => {
                const [x, y] = pt(i, R);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.10)" strokeWidth="1" />;
              })}
              <polygon points={dataPoly} fill="url(#mon-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
              {radarDims.map((d, i) => {
                const [x, y] = pt(i, R * (d.value / 100));
                return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
              })}
              {radarDims.map((d, i) => {
                const [x, y] = pt(i, R + 16);
                return (
                  <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.7)" fontSize="10.5" fontWeight="600">
                    {d.label}
                  </text>
                );
              })}
            </svg>
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 0' }}>
              {radarDims.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ height: 8, width: 8, borderRadius: 9999, backgroundColor: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </Reveal>

        {/* 营收增长预估 */}
        <Reveal>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 18, padding: 22 }}
          >
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(228,238,255,0.18)',
                    color: C.yellow,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>营收增长预估</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>行业参考示例</p>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  lineHeight: 1,
                  margin: 0,
                  background: C.grad,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                  fontFamily: F.display,
                  textShadow: 'none',
                }}
              >
                示例趋势
              </p>
              <span
                style={{
                  marginBottom: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 13 }}>trending_up</span>增长趋势
              </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="营收增长预估趋势图">
              <defs>
                <linearGradient id="mon-trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                  <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="mon-trendLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C.ikb} />
                  <stop offset="55%" stopColor={C.accent3} />
                  <stop offset="100%" stopColor={C.yellow} />
                </linearGradient>
              </defs>
              {[0, 0.33, 0.66, 1].map((f) => (
                <line key={f} x1={padL} x2={W - padR} y1={(padT + innerH * f).toFixed(1)} y2={(padT + innerH * f).toFixed(1)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              ))}
              <path d={tArea} fill="url(#mon-trendFill)" />
              <path d={tLine} fill="none" stroke="url(#mon-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {trendData.map((v, i) =>
                i % 3 === 0 ? <circle key={i} cx={tx(i)} cy={ty(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" /> : null,
              )}
            </svg>
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4, fontSize: 10, color: 'rgba(255,255,255,0.72)', fontFamily: F.mono }}>
              {['启动期', '引流期', '信任期', '利润期', '后端期', '生态期'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </motion.div>
        </Reveal>
      </div>

      {/* ── 反馈 row ──────────────────────────────────────── */}
      <Reveal>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderTop: `0.5px solid ${C.line}`,
            paddingTop: 16,
          }}
        >
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>{MONETIZATION_FEEDBACK_PROMPT}</p>
          <button
            type="button"
            onClick={handleFeedback}
            aria-label="有帮助"
            style={{
              display: 'flex',
              height: 32,
              width: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9999,
              border: `0.5px solid ${C.line}`,
              background: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.ikb;
              (e.currentTarget as HTMLButtonElement).style.color = C.ikb;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.line;
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>thumb_up</span>
          </button>
          <button
            type="button"
            onClick={handleFeedback}
            aria-label="无帮助"
            style={{
              display: 'flex',
              height: 32,
              width: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9999,
              border: `0.5px solid ${C.line}`,
              background: 'transparent',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              outline: 'none',
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>thumb_down</span>
          </button>
        </div>
      </Reveal>
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
    <LiquidShell>
      <MonetizationHero />

      {/* ── loading banner ───────────────────────────────── */}
      {isPending && (
        <Reveal>
          <div
            data-testid="mn-loading-banner"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              border: `0.5px solid rgba(168,197,224,0.3)`,
              padding: '14px 20px',
              fontSize: 14,
              background: 'rgba(168,197,224,0.10)',
              color: C.ikb,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            <svg style={{ height: 20, width: 20, animation: 'spin 1s linear infinite', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" aria-hidden={true}>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            AI 正在生成变现模型，大约需要 15-30 秒…
          </div>
        </Reveal>
      )}

      {/* ── error notice ─────────────────────────────────── */}
      {isError && (
        <Reveal>
          <div
            data-testid="mn-error-notice"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              border: `0.5px solid rgba(255,255,255,0.18)`,
              padding: '14px 20px',
              fontSize: 14,
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: 'rgba(255,120,120,0.85)' }}>error</span>
            生成失败，请检查网络后重试。
            <Magnetic strength={0.3}>
              <button
                type="button"
                onClick={handleGenerate}
                className="lg-gradbtn"
                style={{
                  marginLeft: 'auto',
                  borderRadius: 9999,
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: F.cn,
                  border: 'none',
                  cursor: 'pointer',
                  textShadow: C.textShadow,
                }}
              >
                重试
              </button>
            </Magnetic>
          </div>
        </Reveal>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
    </LiquidShell>
  );
}
