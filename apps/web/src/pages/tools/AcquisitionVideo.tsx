/**
 * AcquisitionVideo.tsx — /acquisition-video 获客型视频制作
 * 阶段2 接真: trpc.acquisitionVideo.generate
 * hasResult 门控 · 三态 + isFallback · 液态玻璃体系
 * 逻辑零改动 · testid 全保留 · 只换皮(IKB → LiquidGlass)
 * 2026-06-08
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
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
  { label: '痛点共鸣', value: 85, color: C.accent3 },
  { label: '信任塑造', value: 80, color: C.yellow },
  { label: 'CTA引导',  value: 88, color: C.ikb },
  { label: '真实感',   value: 78, color: C.accent3 },
  { label: '转化预期', value: 82, color: C.yellow },
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
  const BADGE_COLORS = [C.ikb, C.accent3, C.yellow];

  return (
    <section aria-label="获客方案结果" data-testid="av-result-panel" style={{ marginBottom: 32 }}>
      {/* isFallback 降级提示 */}
      {isFallback && (
        <Reveal>
          <div
            data-testid="av-fallback-notice"
            className="lg-glass"
            style={{
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              padding: '14px 18px',
              fontSize: 14,
              color: C.purpleText,
              fontFamily: F.cn,
              textShadow: C.textShadow,
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.accent3, flexShrink: 0 }}>info</span>
            当前为降级结果，AI 模型暂时不可用，已使用备用方案。
          </div>
        </Reveal>
      )}

      {/* 获客脚本 */}
      <Reveal style={{ marginBottom: 16 }}>
        <motion.div
          className="lg-glass lg-spec"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ borderRadius: 18, padding: 24 }}
        >
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>movie</span>
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>获客视频脚本</h2>
          </div>
          <p
            data-testid="av-script"
            style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}
          >
            {result.script}
          </p>
        </motion.div>
      </Reveal>

      {/* CTA 脚本 */}
      <Reveal style={{ marginBottom: 16 }}>
        <motion.div
          className="lg-glass lg-spec"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ borderRadius: 18, padding: 24 }}
        >
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, background: 'rgba(168,197,224,0.18)', color: C.accent3,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>ads_click</span>
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>行动号召 (CTA)</h2>
          </div>
          <p
            data-testid="av-cta-script"
            style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}
          >
            {result.ctaScript}
          </p>
        </motion.div>
      </Reveal>

      {/* 转化路径 */}
      <Reveal style={{ marginBottom: 16 }}>
        <motion.div
          className="lg-glass lg-spec"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ borderRadius: 18, padding: 24 }}
        >
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, background: 'rgba(168,197,224,0.18)', color: C.yellow,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>conversion_path</span>
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>转化路径</h2>
          </div>
          <p
            data-testid="av-conversion-path"
            style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0 }}
          >
            {result.conversionPath}
          </p>
        </motion.div>
      </Reveal>

      {/* 核心卖点 keyMessages */}
      <Reveal>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.ikb }}>lightbulb</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>核心卖点</h2>
        </div>
        <RevealGroup data-testid="av-key-messages" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.keyMessages.map((msg, i) => {
            const badgeColor = BADGE_COLORS[i % 3]!;
            return (
              <Item key={i}>
                <motion.div
                  className="lg-glass lg-spec"
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                  style={{ borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}
                >
                  <span
                    style={{
                      display: 'flex', height: 28, width: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8, fontSize: 13, fontWeight: 800, color: '#fff',
                      background: 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.4))',
                      fontFamily: F.mono, textShadow: C.textShadow, border: `1px solid ${badgeColor}50`,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn }}>{msg}</p>
                </motion.div>
              </Item>
            );
          })}
        </RevealGroup>
      </Reveal>
    </section>
  );
}

// ── AcquisitionVideoEmptyState component ──────────────────────────────────────

function AcquisitionVideoEmptyState() {
  return (
    <Reveal>
      <div
        data-testid="av-empty-state"
        className="lg-glass"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderRadius: 20, padding: '64px 32px', textAlign: 'center',
          border: `1.5px dashed rgba(255,255,255,0.22)`,
        }}
      >
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 48, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
          movie
        </span>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>
          填写左侧信息，点击「生成获客方案」
        </p>
        <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>
          AI 将为你生成转化导向的获客视频脚本
        </p>
      </div>
    </Reveal>
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
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <div style={{ flexShrink: 0 }}>
          {/* chip 标签行 */}
          <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
              创作引擎
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
              获客视频
            </span>
          </Reveal>
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
            {ACQUISITION_VIDEO_H1}
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
            {ACQUISITION_VIDEO_SUBTITLE}
          </p>
        </div>
        {/* 操作按钮 */}
        <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'nowrap', gap: 12 }}>
          <button
            type="button"
            aria-label="智能优化功能开发中"
            data-testid="av-optimize-btn"
            disabled
            onClick={() => toast.info('优化功能开发中')}
            className="lg-glass"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap',
              borderRadius: 12, padding: '10px 16px', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
              fontFamily: F.mono, cursor: 'not-allowed', opacity: 0.45, border: 'none',
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>auto_fix_high</span>
            智能优化
          </button>
          <motion.button
            type="button"
            data-testid="av-copy-btn"
            disabled={!hasResult}
            onClick={handleCopyPlan}
            aria-label="复制方案"
            whileHover={hasResult ? { y: -3 } : {}}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-gradbtn"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap',
              borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700,
              fontFamily: F.mono, cursor: hasResult ? 'pointer' : 'not-allowed',
              opacity: hasResult ? 1 : 0.4, border: 'none',
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>content_copy</span>
            复制方案
          </motion.button>
        </div>
      </header>

      {/* ── loading banner ───────────────────────────────────── */}
      {isPending && (
        <Reveal>
          <div
            data-testid="av-loading-banner"
            className="lg-glass"
            style={{
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
              borderRadius: 14, padding: '14px 18px', fontSize: 14, color: C.ikb,
              fontFamily: F.cn, textShadow: C.textShadow,
            }}
          >
            <svg style={{ height: 20, width: 20, animation: 'spin 1s linear infinite', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" aria-hidden={true}>
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            AI 正在生成获客方案，大约需要 15-30 秒…
          </div>
        </Reveal>
      )}

      {/* ── error notice ─────────────────────────────────────── */}
      {isError && (
        <Reveal>
          <div
            data-testid="av-error-notice"
            className="lg-glass"
            style={{
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
              borderRadius: 14, padding: '14px 18px', fontSize: 14,
              color: 'rgba(255,255,255,0.88)', fontFamily: F.cn, textShadow: C.textShadow,
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.accent3, flexShrink: 0 }}>error</span>
            生成失败，请检查网络后重试。
            <button
              type="button"
              onClick={handleGenerate}
              className="lg-gradbtn"
              style={{
                marginLeft: 'auto', borderRadius: 8, padding: '6px 14px', fontSize: 12,
                fontWeight: 700, fontFamily: F.mono, border: 'none', cursor: 'pointer',
              }}
            >
              重试
            </button>
          </div>
        </Reveal>
      )}

      {/* ── 输入卡 ───────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 36 }}>
        <div
          className="lg-glass"
          style={{ borderRadius: 22, padding: 28, overflow: 'hidden', position: 'relative' }}
        >
          {/* 装饰光晕 */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(168,197,224,0.12)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -70, left: '33%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(168,197,224,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          {/* 卡头 */}
          <div
            style={{
              position: 'relative', marginBottom: 24, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', paddingBottom: 20,
              borderBottom: `0.5px solid ${C.line}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span
                style={{
                  display: 'flex', height: 44, width: 44, alignItems: 'center', justifyContent: 'center',
                  borderRadius: 14, color: '#fff',
                  background: 'linear-gradient(135deg, rgba(168,197,224,0.55), rgba(100,150,220,0.4))',
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 22 }}>movie</span>
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>获客信息</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>填写行业与客户信息 · AI 据此生成精准获客视频方案</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999,
                padding: '4px 12px', fontSize: 12, fontWeight: 600,
                background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.mono,
              }}
            >
              <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
              待生成
            </span>
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* 行业 · 可视化选择卡 */}
            <div>
              <p
                id="av-industry-label"
                style={{
                  margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
                  color: C.ink, fontFamily: F.cn, textShadow: C.textShadow,
                }}
              >
                <span
                  style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, flexShrink: 0, background: `linear-gradient(to bottom, ${C.ikb}, ${C.accent3})` }}
                  aria-hidden={true}
                />
                {ACQUISITION_VIDEO_INDUSTRY_LABEL}
              </p>
              <div role="group" aria-labelledby="av-industry-label" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {INDUSTRY_OPTIONS.map((opt) => {
                  const active = industry === opt.value;
                  return (
                    <motion.button
                      type="button"
                      key={opt.value}
                      onClick={() => setIndustry(opt.value)}
                      aria-pressed={active}
                      data-state={active ? 'active' : 'inactive'}
                      whileHover={{ y: -3 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                      className={active ? 'lg-glass' : 'lg-glass'}
                      style={{
                        position: 'relative', display: 'flex', alignItems: 'center', gap: 10,
                        borderRadius: 14, padding: 12, textAlign: 'left',
                        border: active ? `1px solid ${C.ikb}` : `0.5px solid ${C.line}`,
                        background: active ? 'rgba(168,197,224,0.25)' : 'rgba(255,255,255,0.07)',
                        boxShadow: active ? `0 0 0 1px rgba(168,197,224,0.4)` : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{opt.label.split(' ')[0]}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{opt.label.split(' ').slice(1).join(' ')}</span>
                      <span
                        style={{
                          position: 'absolute', right: 8, top: 8, display: 'flex',
                          height: 16, width: 16, alignItems: 'center', justifyContent: 'center',
                          borderRadius: '50%', fontSize: 12,
                          background: active ? C.ikb : 'transparent',
                          border: active ? 'none' : `1px solid ${C.line}`,
                          color: active ? '#fff' : 'transparent',
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 12 }}>check</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 转化目标 · 下拉选择 */}
            <div>
              <label
                htmlFor="av-conversion-goal"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                  fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
                  color: C.ink, fontFamily: F.cn, textShadow: C.textShadow,
                }}
              >
                <span
                  style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, flexShrink: 0, background: `linear-gradient(to bottom, ${C.ikb}, ${C.accent3})` }}
                  aria-hidden={true}
                />
                转化目标
              </label>
              <select
                id="av-conversion-goal"
                data-testid="av-conversion-goal-select"
                value={conversionGoal}
                onChange={(e) => setConversionGoal(e.target.value)}
                style={{
                  width: '100%', borderRadius: 12, padding: '12px 16px', fontSize: 14,
                  color: C.ink, fontFamily: F.cn, background: 'rgba(255,255,255,0.10)',
                  border: `0.5px solid ${C.line}`, outline: 'none',
                  appearance: 'none', WebkitAppearance: 'none', backdropFilter: 'blur(8px)',
                }}
              >
                {CONVERSION_GOAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: '#0a1628', color: '#fff' }}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 客户画像 · 框式编辑器 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label
                  htmlFor="av-customer-profile"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
                    color: C.ink, fontFamily: F.cn, textShadow: C.textShadow,
                  }}
                >
                  <span
                    style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, flexShrink: 0, background: `linear-gradient(to bottom, ${C.ikb}, ${C.accent3})` }}
                    aria-hidden={true}
                  />
                  {ACQUISITION_VIDEO_CUSTOMER_LABEL}
                  <span style={{ marginLeft: 4, fontWeight: 400, fontSize: 12, color: C.accent3 }}>*</span>
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14, color: C.ikb }}>auto_awesome</span>
                  AI 据此精准定位受众
                </span>
              </div>
              <div
                style={{
                  overflow: 'hidden', borderRadius: 14,
                  background: 'rgba(255,255,255,0.07)',
                  border: `0.5px solid ${customerProfileError ? C.accent3 : C.line}`,
                }}
              >
                <textarea
                  id="av-customer-profile"
                  data-testid="av-customer-profile-input"
                  value={customerProfile}
                  onChange={(e) => setCustomerProfile(e.target.value)}
                  rows={3}
                  placeholder="例如：想要创业的 25-40 岁宝妈，有积蓄但缺方向"
                  style={{
                    width: '100%', resize: 'none', border: 'none', background: 'transparent',
                    padding: 16, fontSize: 14, lineHeight: 1.65, color: C.ink,
                    fontFamily: F.cn, outline: 'none',
                  }}
                  required
                />
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, borderTop: `0.5px solid ${C.line}`, padding: '8px 16px',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  {customerProfileError ? (
                    <span data-testid="av-customer-profile-error" style={{ fontSize: 11, color: C.accent3, fontFamily: F.cn }}>{customerProfileError}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: F.cn }}>可包含年龄段、职业、痛点、消费能力</span>
                  )}
                  <span style={{ flexShrink: 0, fontSize: 11, fontFamily: F.mono, color: 'rgba(255,255,255,0.45)' }}>{customerProfile.length} 字</span>
                </div>
              </div>
            </div>

            {/* 产品亮点 · 框式编辑器 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label
                  htmlFor="av-product-highlights"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
                    color: C.ink, fontFamily: F.cn, textShadow: C.textShadow,
                  }}
                >
                  <span
                    style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, flexShrink: 0, background: `linear-gradient(to bottom, ${C.ikb}, ${C.accent3})` }}
                    aria-hidden={true}
                  />
                  {ACQUISITION_VIDEO_PRODUCT_LABEL}
                  <span style={{ marginLeft: 4, fontWeight: 400, fontSize: 12, color: C.accent3 }}>*</span>
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14, color: C.ikb }}>auto_awesome</span>
                  AI 据此塑造信任感
                </span>
              </div>
              <div
                style={{
                  overflow: 'hidden', borderRadius: 14,
                  background: 'rgba(255,255,255,0.07)',
                  border: `0.5px solid ${productHighlightsError ? C.accent3 : C.line}`,
                }}
              >
                <textarea
                  id="av-product-highlights"
                  data-testid="av-product-highlights-input"
                  value={productHighlights}
                  onChange={(e) => setProductHighlights(e.target.value)}
                  rows={3}
                  placeholder="例如：零基础可学、3个月回本、一对一指导"
                  style={{
                    width: '100%', resize: 'none', border: 'none', background: 'transparent',
                    padding: 16, fontSize: 14, lineHeight: 1.65, color: C.ink,
                    fontFamily: F.cn, outline: 'none',
                  }}
                  required
                />
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, borderTop: `0.5px solid ${C.line}`, padding: '8px 16px',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  {productHighlightsError ? (
                    <span data-testid="av-product-highlights-error" style={{ fontSize: 11, color: C.accent3, fontFamily: F.cn }}>{productHighlightsError}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: F.cn }}>可包含核心优势、回本周期、服务保障</span>
                  )}
                  <span style={{ flexShrink: 0, fontSize: 11, fontFamily: F.mono, color: 'rgba(255,255,255,0.45)' }}>{productHighlights.length} 字</span>
                </div>
              </div>
            </div>

            {/* 生成按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <motion.button
                type="button"
                data-testid="av-generate-btn"
                onClick={handleGenerate}
                disabled={isPending || !isFormValid}
                whileHover={(!isPending && isFormValid) ? { y: -4 } : {}}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                className="lg-gradbtn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, borderRadius: 14,
                  padding: '12px 32px', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: F.mono,
                  cursor: (isPending || !isFormValid) ? 'not-allowed' : 'pointer',
                  opacity: (isPending || !isFormValid) ? 0.4 : 1, border: 'none',
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>movie</span>
                {ACQUISITION_VIDEO_CTA_GENERATE}
              </motion.button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── 结果区 · hasResult 门控 ─────────────────────────────── */}
      {hasResult ? (
        <AcquisitionVideoResult result={acquisitionContent} isFallback={isFallback} />
      ) : (
        <AcquisitionVideoEmptyState />
      )}

      {/* ── 数据洞察(雷达 + 趋势) · 示例/参考 ──────────────────────────── */}
      <div style={{ marginTop: 40 }}>
        <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}>· 行业参考数据 · 示例</span>
          <span
            style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
              borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 600,
              background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.45)', fontFamily: F.mono,
            }}
          >
            <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.45)' }} />
            示例数据
          </span>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 20 }}>
          {/* 获客视频力雷达 */}
          <Reveal>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 24 }}
            >
              <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.22)', color: C.ikb }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>radar</span>
                  </span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>获客视频力雷达</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}>行业参考模型 · 示例</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 700, lineHeight: 1, background: C.grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: F.display }}>84</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>参考分</p>
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
                  <svg viewBox="0 0 260 244" style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="acq-radarFillAV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                        <stop offset="100%" stopColor={C.accent3} stopOpacity="0.12" />
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
                      return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
                    })}
                    {dims.map((d, i) => {
                      const [x, y] = pt(i, R + 16);
                      return (
                        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.6)" fontSize="10.5" fontWeight="600">
                          {d.label}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 0' }}>
                {RADAR_DIMS_AV.map((d) => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>{d.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </Reveal>

          {/* 获客转化漏斗 / 注意力曲线 */}
          <Reveal>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 20, padding: 24 }}
            >
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.18)', color: C.accent3 }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>show_chart</span>
                  </span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>获客转化漏斗 / 注意力曲线</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}>12 周行业参考预估 · 示例</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(['注意力', '互动', '转化'] as const).map((t, i) => (
                    <span
                      key={t}
                      style={{
                        borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                        background: i === 0 ? C.ikb : 'rgba(255,255,255,0.12)',
                        color: i === 0 ? '#0a1628' : 'rgba(255,255,255,0.55)',
                        fontFamily: F.mono,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>96%</p>
                <span
                  style={{
                    marginBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 2,
                    borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 700,
                    background: 'rgba(168,197,224,0.22)', color: C.ikb, fontFamily: F.mono,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>trending_up</span>+380%
                </span>
                <span style={{ marginBottom: 2, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: F.cn }}>参考值 · 第 12 周</span>
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
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="acq-trendFillAV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                        <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="acq-trendLineAV" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={C.ikb} />
                        <stop offset="100%" stopColor={C.accent3} />
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
                      i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" /> : null,
                    )}
                  </svg>
                );
              })()}
              <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>
                {TREND_LABELS_AV.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </motion.div>
          </Reveal>
        </div>
      </div>

      {/* ── 反馈 footer ──────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 40, display: 'flex', alignItems: 'center', gap: 12,
          borderTop: `0.5px solid ${C.line}`, paddingTop: 24,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}>{ACQUISITION_VIDEO_FOOTER_FEEDBACK}</p>
        <motion.button
          type="button"
          onClick={handleFeedbackUp}
          aria-label="有帮助"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          className="lg-glass"
          style={{
            display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>thumb_up</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={handleFeedbackDown}
          aria-label="无帮助"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          className="lg-glass"
          style={{
            display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>thumb_down</span>
        </motion.button>
      </div>
    </LiquidShell>
  );
}
